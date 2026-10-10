"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/format";
import { Logo } from "@/components/logo";

export interface NavItem {
  href: string;
  label: string;
  /** Match nested routes too (e.g. /faculty/courses/c1/import). */
  prefix?: boolean;
}

export function AppShell({
  nav,
  user,
  roleLabel,
  children,
}: {
  nav: NavItem[];
  user: { name: string; sub: string };
  roleLabel: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (item: NavItem) =>
    item.prefix ? pathname === item.href || pathname.startsWith(item.href + "/") : pathname === item.href;

  const sidebar = (
    <nav className="flex h-full flex-col">
      <div className="px-5 py-5">
        <Logo />
        <p className="mt-1 pl-11 text-xs font-medium text-ink-subtle">{roleLabel} portal</p>
      </div>
      <ul className="flex-1 space-y-0.5 px-3">
        {nav.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "block rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive(item) ? "bg-brand-soft text-brand-ink" : "text-ink-muted hover:bg-surface-muted",
              )}
              aria-current={isActive(item) ? "page" : undefined}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
      <div className="border-t border-line px-5 py-4">
        <p className="truncate text-sm font-medium">{user.name}</p>
        <p className="truncate text-xs text-ink-subtle">{user.sub}</p>
        {/* Phase 2: POST /api/auth/logout */}
        <Link href="/login" className="mt-2 inline-block text-xs font-medium text-brand-ink hover:underline">
          Sign out
        </Link>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen lg:flex">
      <aside className="hidden w-60 shrink-0 border-r border-line bg-surface lg:block">
        <div className="sticky top-0 h-screen">{sidebar}</div>
      </aside>

      <header className="flex items-center justify-between border-b border-line bg-surface px-4 py-3 lg:hidden">
        <Logo />
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-xl px-3 py-1.5 text-sm font-medium ring-1 ring-line"
          aria-label="Open menu"
        >
          Menu
        </button>
      </header>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button className="absolute inset-0 bg-ink/40 backdrop-blur-sm" aria-label="Close menu" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-surface shadow-xl">{sidebar}</aside>
        </div>
      )}

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-8 sm:py-8">{children}</main>
    </div>
  );
}
