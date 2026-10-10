import type { Metadata } from "next";
import { AuthLayout } from "@/components/auth-layout";
import { ChangePasswordForm } from "./change-password-form";

export const metadata: Metadata = { title: "Set your password · AssignAI" };

export default function ChangePasswordPage() {
  return (
    <AuthLayout>
      <ChangePasswordForm firstLogin />
    </AuthLayout>
  );
}
