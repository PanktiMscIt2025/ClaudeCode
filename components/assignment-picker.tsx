import Link from "next/link";
import { cn } from "@/lib/format";

/** Pill links to switch between a student's assignments (only shown when there is more than one). */
export function AssignmentPicker({ base, items, current }: { base: string; items: { id: string; label: string }[]; current: string }) {
  if (items.length < 2) return null;
  return (
    <nav className="-mx-4 mb-6 overflow-x-auto px-4 sm:mx-0 sm:px-0" aria-label="Choose assignment">
      <div className="inline-flex gap-1 rounded-2xl bg-surface-muted p-1">
        {items.map((i) => (
          <Link
            key={i.id}
            href={`${base}?sa=${i.id}`}
            aria-current={i.id === current ? "page" : undefined}
            className={cn("rounded-xl px-3.5 py-1.5 text-sm font-semibold whitespace-nowrap", i.id === current ? "bg-surface shadow-soft" : "text-ink-muted hover:text-ink")}
          >
            {i.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
