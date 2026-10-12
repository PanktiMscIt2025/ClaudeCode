import type { Metadata } from "next";
import { AuthLayout } from "@/components/auth-layout";
import { requireUser } from "@/lib/server/auth";
import { ChangePasswordForm } from "./change-password-form";

export const metadata: Metadata = { title: "Set your password · AssignAI" };

export default async function ChangePasswordPage() {
  await requireUser(undefined, { allowTempPassword: true });
  return (
    <AuthLayout>
      <ChangePasswordForm firstLogin />
    </AuthLayout>
  );
}
