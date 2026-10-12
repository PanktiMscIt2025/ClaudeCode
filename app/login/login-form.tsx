"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Button, Field, Input, Alert } from "@/components/ui";
import { Segmented } from "@/components/segmented";
import { ArrowRight, Eye } from "@/components/icons";
import { loginAction } from "@/lib/server/auth-actions";

type Role = "student" | "faculty";

export function LoginForm({ initialRole }: { initialRole: Role }) {
  const [state, formAction, pending] = useActionState(loginAction, undefined);
  const [role, setRole] = useState<Role>(initialRole);
  const [loginId, setLoginId] = useState("");
  const [show, setShow] = useState(false);

  return (
    <div className="animate-rise">
      <h1 className="font-display text-3xl font-extrabold tracking-tight">Welcome back</h1>
      <p className="mt-2 text-ink-muted">Sign in to continue to your {role} portal.</p>

      <div className="mt-8">
        <Segmented
          label="I am signing in as"
          value={role}
          onChange={setRole}
          options={[
            { value: "student", label: "Student" },
            { value: "faculty", label: "Faculty" },
          ]}
        />
      </div>

      <form action={formAction} className="mt-6 space-y-5">
        <Field
          id="loginId"
          label={role === "student" ? "Enrollment number" : "Email"}
          hint={role === "student" ? "Exactly as on your ID card, e.g. ENR001" : undefined}
        >
          <Input
            id="loginId"
            name="loginId"
            required
            autoComplete="username"
            autoCapitalize={role === "student" ? "characters" : "none"}
            inputMode={role === "faculty" ? "email" : "text"}
            placeholder={role === "student" ? "ENR001" : "you@college.edu"}
            value={loginId}
            onChange={(e) => setLoginId(role === "student" ? e.target.value.toUpperCase() : e.target.value)}
            className="h-12 text-base"
          />
        </Field>

        <Field id="password" label="Password">
          <div className="relative">
            <Input
              id="password"
              name="password"
              required
              type={show ? "text" : "password"}
              autoComplete="current-password"
              className="h-12 pr-12 text-base"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-ink-subtle hover:text-ink"
              aria-label={show ? "Hide password" : "Show password"}
              aria-pressed={show}
            >
              <Eye className="h-5 w-5" />
            </button>
          </div>
        </Field>

        {state?.error && (
          <Alert tone="red">
            <span role="alert">{state.error}</span>
          </Alert>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
          {!pending && <ArrowRight className="h-5 w-5" />}
        </Button>
      </form>

      <div className="mt-8 rounded-2xl bg-surface-muted p-4 text-sm text-ink-muted">
        {role === "student" ? (
          <>
            <p className="font-semibold text-ink">First time here?</p>
            <p className="mt-1">
              Use the temporary password your teacher gave you. You&apos;ll choose your own password right after signing in.
              Forgot it? Ask your faculty to reset it.
            </p>
          </>
        ) : (
          <p>Faculty accounts are created by the administrator. Contact them if you can&apos;t sign in.</p>
        )}
      </div>

      <p className="mt-6 text-center text-sm text-ink-subtle">
        <Link href="/" className="font-medium hover:text-ink">
          ← Back to home
        </Link>
      </p>
    </div>
  );
}
