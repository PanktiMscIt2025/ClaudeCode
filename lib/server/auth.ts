import "server-only";
import { redirect } from "next/navigation";
import { getSessionUser } from "./session";

export type Role = "FACULTY" | "STUDENT";

export const homeFor = (role: string) => (role === "FACULTY" ? "/faculty" : "/student");

/**
 * Server-side gate for pages and actions. Redirects anonymous users to /login, users of the
 * other role to their own home, and anyone still on a temporary password to /change-password.
 */
export async function requireUser(role?: Role, opts: { allowTempPassword?: boolean } = {}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (role && user.role !== role) redirect(homeFor(user.role));
  if (user.mustChangePassword && !opts.allowTempPassword) redirect("/change-password");
  return user;
}

/** Normalize a login ID: emails lower-case, enrollment numbers upper-case. */
export function normalizeLoginId(raw: string): string {
  const v = raw.trim();
  return v.includes("@") ? v.toLowerCase() : v.toUpperCase();
}
