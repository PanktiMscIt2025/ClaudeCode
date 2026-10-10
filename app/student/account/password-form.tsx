"use client";

import { ChangePasswordForm } from "@/app/change-password/change-password-form";
import { useToast } from "@/components/toast";

export function AccountPasswordForm() {
  const toast = useToast();
  return <ChangePasswordForm onDone={() => toast("Password updated")} />;
}
