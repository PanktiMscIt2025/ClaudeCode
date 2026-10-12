import type { ReactNode } from "react";
import { Logo } from "@/components/logo";
import { Check } from "@/components/icons";

/** Split-screen layout for login / password pages: brand panel + form. */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-brand via-[#7b4df0] to-accent p-12 text-white lg:flex lg:flex-col">
        <div className="bg-dots absolute inset-0 opacity-25" aria-hidden="true" />
        <div className="absolute -right-24 -bottom-24 h-96 w-96 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
        <div className="relative [&_span]:text-white">
          <Logo />
        </div>
        <div className="relative mt-auto max-w-md">
          <h2 className="font-display text-4xl leading-tight font-extrabold">Your assignment. Your scenario. Your marks.</h2>
          <ul className="mt-8 space-y-3 text-white/90">
            {["Only you can see your assignment", "Upload one ZIP, done", "Marks appear once your teacher approves them"].map((t) => (
              <li key={t} className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
                  <Check className="h-3.5 w-3.5" />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <main className="relative flex flex-col px-4 py-8 sm:px-10">
        <div className="lg:hidden">
          <Logo />
        </div>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">{children}</div>
      </main>
    </div>
  );
}
