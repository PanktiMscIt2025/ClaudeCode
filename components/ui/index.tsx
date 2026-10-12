import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/format";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-brand text-white shadow-soft hover:bg-brand-hover hover:-translate-y-px disabled:opacity-50",
  secondary: "bg-surface text-ink ring-1 ring-line hover:ring-ink-subtle hover:-translate-y-px",
  danger: "bg-danger text-white hover:opacity-90",
  ghost: "text-ink-muted hover:bg-surface-muted hover:text-ink",
};

const sizes: Record<Size, string> = {
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 " +
  "disabled:cursor-not-allowed disabled:hover:translate-y-0";

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button className={cn(buttonBase, variants[variant], sizes[size], className)} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={cn(buttonBase, variants[variant], sizes[size], className)} {...props} />;
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("rounded-2xl bg-surface p-5 shadow-soft ring-1 ring-line sm:p-6", className)}>{children}</div>;
}

export function CardTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="font-display text-lg font-semibold text-ink">{children}</h2>
      {action}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="text-sm font-semibold text-brand-ink">{eyebrow}</p>}
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-ink-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Label({ htmlFor, children }: { htmlFor: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-ink">
      {children}
    </label>
  );
}

const fieldBase =
  "block w-full rounded-xl border-0 bg-surface px-3.5 py-2.5 text-sm text-ink ring-1 ring-line " +
  "placeholder:text-ink-subtle transition-shadow focus:ring-2 focus:ring-ring focus:outline-none";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(fieldBase, "h-11", className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn(fieldBase, "h-11", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(fieldBase, className)} {...props} />;
}

export function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-ink-subtle">{hint}</p>}
    </div>
  );
}

export type Tone = "gray" | "blue" | "green" | "amber" | "red";
const tones: Record<Tone, string> = {
  gray: "bg-surface-muted text-ink-muted",
  blue: "bg-brand-soft text-brand-ink",
  green: "bg-mint-soft text-mint",
  amber: "bg-sun-soft text-sun",
  red: "bg-danger-soft text-danger",
};

export function Badge({ tone = "gray", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold", tones[tone])}>
      {children}
    </span>
  );
}

export function StatCard({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: string; tone?: Tone }) {
  return (
    <Card className="p-4 sm:p-5">
      <p className="text-xs font-semibold tracking-wide text-ink-subtle uppercase">{label}</p>
      <p className={cn("mt-1 font-display text-3xl font-bold tabular-nums", tone === "amber" && "text-sun")}>{value}</p>
      {hint && <p className="mt-0.5 text-xs text-ink-subtle">{hint}</p>}
    </Card>
  );
}

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="relative overflow-x-auto rounded-2xl bg-surface shadow-soft ring-1 ring-line">
      <table className="min-w-full divide-y divide-line text-sm">{children}</table>
    </div>
  );
}

export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <th scope="col" className={cn("bg-surface-muted/60 px-4 py-3 text-left text-xs font-semibold text-ink-muted", className)}>
      {children}
    </th>
  );
}

export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return <td className={cn("px-4 py-3 align-top whitespace-nowrap text-ink", className)}>{children}</td>;
}

export function Alert({ tone = "blue", title, children }: { tone?: Tone; title?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-xl p-4 text-sm", tones[tone])} role="status">
      {title && <p className="font-semibold">{title}</p>}
      <div className={cn(title && "mt-0.5")}>{children}</div>
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-line p-10 text-center">
      <p className="font-display text-lg font-semibold text-ink">{title}</p>
      {children && <div className="mt-1 text-sm text-ink-muted">{children}</div>}
    </div>
  );
}
