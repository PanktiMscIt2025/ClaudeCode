import type { Metadata } from "next";
import { AuthLayout } from "@/components/auth-layout";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in · AssignAI" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  const { role } = await searchParams;
  return (
    <AuthLayout>
      <LoginForm initialRole={role === "faculty" ? "faculty" : "student"} />
    </AuthLayout>
  );
}
