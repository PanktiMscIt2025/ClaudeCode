import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthLayout } from "@/components/auth-layout";
import { getSessionUser } from "@/lib/server/session";
import { homeFor } from "@/lib/server/auth";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in · AssignAI" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  const user = await getSessionUser();
  if (user) redirect(user.mustChangePassword ? "/change-password" : homeFor(user.role));
  const { role } = await searchParams;
  return (
    <AuthLayout>
      <LoginForm initialRole={role === "faculty" ? "faculty" : "student"} />
    </AuthLayout>
  );
}
