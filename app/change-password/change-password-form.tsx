"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert, Button, Field, Input } from "@/components/ui";
import { Check, Key } from "@/components/icons";
import { cn } from "@/lib/format";

export const passwordRules = [
  { id: "len", label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { id: "case", label: "Upper and lower case letters", test: (p: string) => /[a-z]/.test(p) && /[A-Z]/.test(p) },
  { id: "num", label: "At least one number", test: (p: string) => /\d/.test(p) },
];

export function ChangePasswordForm({ firstLogin = false, onDone }: { firstLogin?: boolean; onDone?: () => void }) {
  const router = useRouter();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const passed = passwordRules.filter((r) => r.test(next)).length;
  const strength = next ? passed / passwordRules.length : 0;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!current) return setError(firstLogin ? "Enter the temporary password from your teacher." : "Enter your current password.");
    if (passed < passwordRules.length) return setError("Your new password doesn't meet all the requirements yet.");
    if (next !== confirm) return setError("The two new passwords don't match.");
    if (next === current) return setError("Choose a password different from your current one.");
    setPending(true);
    // Phase 2: POST /api/auth/change-password
    await new Promise((r) => setTimeout(r, 400));
    if (onDone) {
      onDone();
      setPending(false);
      setCurrent("");
      setNext("");
      setConfirm("");
    } else router.push("/student");
  }

  return (
    <div className={cn(firstLogin && "animate-rise")}>
      {firstLogin && (
        <>
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand-ink">
            <Key className="h-6 w-6" />
          </span>
          <h1 className="mt-5 font-display text-3xl font-extrabold tracking-tight">Create your password</h1>
          <p className="mt-2 text-ink-muted">
            You signed in with a temporary password. Choose a new one that only you know; you&apos;ll use it from now on.
          </p>
        </>
      )}

      <form onSubmit={onSubmit} className={cn("space-y-5", firstLogin && "mt-8")} noValidate>
        <Field id="current" label={firstLogin ? "Temporary password" : "Current password"}>
          <Input id="current" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
        </Field>

        <Field id="next" label="New password">
          <Input id="next" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} aria-describedby="pw-rules" />
          <div className="mt-2 flex gap-1.5" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors",
                  strength * 3 > i ? (strength === 1 ? "bg-mint" : strength >= 0.66 ? "bg-brand" : "bg-accent") : "bg-surface-muted",
                )}
              />
            ))}
          </div>
          <ul id="pw-rules" className="mt-3 space-y-1.5">
            {passwordRules.map((r) => {
              const ok = r.test(next);
              return (
                <li key={r.id} className={cn("flex items-center gap-2 text-sm", ok ? "text-mint" : "text-ink-subtle")}>
                  <span className={cn("flex h-4 w-4 items-center justify-center rounded-full", ok ? "bg-mint text-white" : "ring-1 ring-line")}>
                    {ok && <Check className="h-3 w-3" />}
                  </span>
                  {r.label}
                </li>
              );
            })}
          </ul>
        </Field>

        <Field id="confirm" label="Confirm new password">
          <Input id="confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </Field>

        {error && (
          <Alert tone="red">
            <span role="alert">{error}</span>
          </Alert>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? "Saving…" : firstLogin ? "Save and continue" : "Update password"}
        </Button>
      </form>
    </div>
  );
}
