"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ComponentType, type ReactNode, type SVGProps } from "react";
import { cn } from "@/lib/format";
import { Logo } from "@/components/logo";
import { Logout, X } from "@/components/icons";
import { ToastProvider } from "@/components/toast";
import { logoutAction } from "@/lib/server/auth-actions";

export interface NavItem {
  href: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  /** Match nested routes too (e.g. /faculty/courses/c1/import). */
  prefix?: boolean;
}

/**
 * Portal layout: sidebar on desktop. On mobile, `bottomNav` shows an app-style tab bar
 * (used for students, who mostly use phones); otherwise a slide-in drawer.
 */
export function AppShell({
  nav,
  user,
  roleLabel,
  bottomNav = false,
  children,
}: {
  nav: NavItem[];
  user: { name: string; sub: string };
  roleLabel: string;
  bottomNav?: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (item: NavItem) =>
    item.prefix ? pathname === item.href || pathname.startsWith(item.href + "/") : pathname === item.href;

  const initials = user.name
    .split(" ")
    .filter((w) => !w.endsWith("."))
    .map((w) => w[0])
    .slice(0, 2)
    .join("");

  const sidebar = (
    <nav className="flex h-full flex-col" aria-label="Main">
      <div className="px-5 pt-6 pb-5">
        <Logo />
        <p className="mt-1 pl-11 text-xs font-medium text-ink-subtle">{roleLabel} portal</p>
      </div>
      <ul className="flex-1 space-y-1 px-3">
        {nav.map((item) => {
          const active = isActive(item);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active ? "bg-brand-soft text-brand-ink" : "text-ink-muted hover:bg-surface-muted hover:text-ink",
                )}
                aria-current={active ? "page" : undefined}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="m-3 flex items-center gap-3 rounded-2xl bg-surface-muted p-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-accent text-xs font-bold text-white">
          {initials}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{user.name}</p>
          <p className="truncate text-xs text-ink-subtle">{user.sub}</p>
        </div>
        <form action={logoutAction}>
          <button type="submit" className="rounded-lg p-1.5 text-ink-subtle hover:bg-surface hover:text-ink" aria-label="Sign out" title="Sign out">
            <Logout className="h-5 w-5" />
          </button>
        </form>
      </div>
    </nav>
  );

  return (
    <ToastProvider>
      <div className="min-h-screen lg:flex">
        <aside className="hidden w-64 shrink-0 border-r border-line bg-surface lg:block">
          <div className="sticky top-0 h-screen">{sidebar}</div>
        </aside>

        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line/70 bg-bg/80 px-4 backdrop-blur-lg lg:hidden">
          <Logo />
          {bottomNav ? (
            <form action={logoutAction}>
              <button type="submit" className="rounded-xl p-2 text-ink-subtle ring-1 ring-line" aria-label="Sign out">
                <Logout className="h-5 w-5" />
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="rounded-xl px-3 py-1.5 text-sm font-semibold ring-1 ring-line"
              aria-label="Open menu"
              aria-expanded={open}
            >
              Menu
            </button>
          )}
        </header>

        {open && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button className="absolute inset-0 bg-ink/40 backdrop-blur-sm" aria-label="Close menu" onClick={() => setOpen(false)} />
            <aside className="absolute inset-y-0 left-0 w-72 bg-surface shadow-lift">
              <button
                onClick={() => setOpen(false)}
                className="absolute top-5 right-4 rounded-lg p-1.5 text-ink-subtle hover:bg-surface-muted"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
              {sidebar}
            </aside>
          </div>
        )}

        <main className={cn("mx-auto w-full max-w-6xl min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-10", bottomNav && "pb-28 lg:pb-10")}>
          {children}
        </main>

        {bottomNav && (
          <nav
            className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg lg:hidden"
            aria-label="Main"
          >
            <ul className="mx-auto flex max-w-md justify-around px-2">
              {nav.map((item) => {
                const active = isActive(item);
                return (
                  <li key={item.href} className="flex-1">
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold",
                        active ? "text-brand-ink" : "text-ink-subtle",
                      )}
                    >
                      <span className={cn("rounded-full px-4 py-1 transition-colors", active && "bg-brand-soft")}>
                        <item.icon className="h-5 w-5" />
                      </span>
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}
      </div>
    </ToastProvider>
  );
}
