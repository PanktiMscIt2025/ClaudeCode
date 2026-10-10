"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Alert, Button, Field, Input } from "@/components/ui";
import { Check, Key } from "@/components/icons";
import { cn } from "@/lib/format";
import { passwordRules } from "@/lib/password-rules";
import { changePasswordAction } from "@/lib/server/auth-actions";

export function ChangePasswordForm({ firstLogin = false, onDone }: { firstLogin?: boolean; onDone?: () => void }) {
  const [state, formAction, pending] = useActionState(changePasswordAction, undefined);
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [clientError, setClientError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const passed = passwordRules.filter((r) => r.test(next)).length;
  const strength = next ? passed / passwordRules.length : 0;

  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset();
      setNext("");
      setConfirm("");
      onDoneRef.current?.();
    }
  }, [state]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    // Instant feedback in the browser; the server enforces the same rules.
    if (passed < passwordRules.length) {
      e.preventDefault();
      setClientError("Your new password doesn't meet all the requirements yet.");
    } else if (next !== confirm) {
      e.preventDefault();
      setClientError("The two new passwords don't match.");
    } else setClientError(null);
  }

  const error = clientError ?? state?.error;

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

      <form ref={formRef} action={formAction} onSubmit={onSubmit} className={cn("space-y-5", firstLogin && "mt-8")}>
        <Field id="current" label={firstLogin ? "Temporary password" : "Current password"}>
          <Input id="current" name="current" type="password" autoComplete="current-password" required />
        </Field>

        <Field id="next" label="New password">
          <Input
            id="next"
            name="next"
            type="password"
            autoComplete="new-password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            aria-describedby="pw-rules"
            required
          />
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
          <Input id="confirm" name="confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
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
