"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "./db";
import { homeFor, normalizeLoginId, requireUser } from "./auth";
import { hashPassword, verifyAgainstDummy, verifyPassword } from "./password";
import { checkLimit, clearHits, recordHit } from "./rate-limit";
import { createSession, destroyOtherSessions, destroySession } from "./session";
import { isStrongPassword } from "@/lib/password-rules";

export type FormState = { error?: string; ok?: boolean } | undefined;

const ACCOUNT_LIMIT = { max: 5, windowMs: 15 * 60 * 1000 };
const IP_LIMIT = { max: 30, windowMs: 15 * 60 * 1000 };

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || "local";
}

const loginSchema = z.object({
  loginId: z.string().trim().min(1).max(120),
  password: z.string().min(1).max(128),
});

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({ loginId: formData.get("loginId"), password: formData.get("password") });
  if (!parsed.success) return { error: "Enter your login ID and password." };

  const loginId = normalizeLoginId(parsed.data.loginId);
  const ip = await clientIp();
  const accountKey = `login:${ip}:${loginId}`;
  const ipKey = `login-ip:${ip}`;
  const limited = [checkLimit(accountKey, ACCOUNT_LIMIT.max, ACCOUNT_LIMIT.windowMs), checkLimit(ipKey, IP_LIMIT.max, IP_LIMIT.windowMs)].find(
    (r) => !r.allowed,
  );
  if (limited) {
    const minutes = Math.ceil(limited.retryAfterSec / 60);
    return { error: `Too many attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.` };
  }

  const user = await db.user.findUnique({ where: { loginId } });
  const valid = user ? await verifyPassword(parsed.data.password, user.passwordHash) : (await verifyAgainstDummy(parsed.data.password), false);
  if (!user || !valid) {
    recordHit(accountKey);
    recordHit(ipKey);
    return { error: "Incorrect login ID or password." };
  }
  if (user.disabled) return { error: "This account is disabled. Please contact your faculty." };

  clearHits(accountKey);
  await createSession(user.id);
  redirect(user.mustChangePassword ? "/change-password" : homeFor(user.role));
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}

const changeSchema = z.object({
  current: z.string().min(1).max(128),
  next: z.string().max(128),
  confirm: z.string().max(128),
});

export async function changePasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser(undefined, { allowTempPassword: true });
  const parsed = changeSchema.safeParse({ current: formData.get("current"), next: formData.get("next"), confirm: formData.get("confirm") });
  if (!parsed.success) return { error: "Fill in all fields." };
  const { current, next, confirm } = parsed.data;

  const key = `pwchange:${user.id}`;
  if (!checkLimit(key, 5, 15 * 60 * 1000).allowed) return { error: "Too many attempts. Try again later." };
  if (!(await verifyPassword(current, user.passwordHash))) {
    recordHit(key);
    return { error: user.mustChangePassword ? "The temporary password is incorrect." : "Your current password is incorrect." };
  }
  if (!isStrongPassword(next)) return { error: "Your new password doesn't meet all the requirements yet." };
  if (next !== confirm) return { error: "The two new passwords don't match." };
  if (next === current) return { error: "Choose a password different from your current one." };

  const wasTemporary = user.mustChangePassword;
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(next), mustChangePassword: false } });
  await destroyOtherSessions(user.id, true);
  clearHits(key);
  if (wasTemporary) redirect(homeFor(user.role));
  return { ok: true };
}
