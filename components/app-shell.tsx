"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/format";

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
        <Link href="/" className="text-lg font-bold tracking-tight text-brand-700">
          AssignAI
        </Link>
        <p className="text-xs text-slate-500">{roleLabel} portal</p>
      </div>
      <ul className="flex-1 space-y-0.5 px-3">
        {nav.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "block rounded-md px-3 py-2 text-sm font-medium",
                isActive(item) ? "bg-brand-50 text-brand-700" : "text-slate-700 hover:bg-slate-100",
              )}
              aria-current={isActive(item) ? "page" : undefined}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
      <div className="border-t border-slate-200 px-5 py-4">
        <p className="truncate text-sm font-medium">{user.name}</p>
        <p className="truncate text-xs text-slate-500">{user.sub}</p>
        {/* Phase 2: POST /api/auth/logout */}
        <Link href="/login" className="mt-2 inline-block text-xs font-medium text-brand-700 hover:underline">
          Sign out
        </Link>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen lg:flex">
      <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-white lg:block">
        <div className="sticky top-0 h-screen">{sidebar}</div>
      </aside>

      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
        <span className="font-bold text-brand-700">AssignAI</span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-md px-2 py-1 text-sm ring-1 ring-slate-300"
          aria-label="Open menu"
        >
          Menu
        </button>
      </header>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button className="absolute inset-0 bg-slate-900/30" aria-label="Close menu" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-white shadow-xl">{sidebar}</aside>
        </div>
      )}

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-8 sm:py-8">{children}</main>
    </div>
  );
}
