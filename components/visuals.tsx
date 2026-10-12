import { cn } from "@/lib/format";
import { Check } from "@/components/icons";

/** Circular score indicator. Colour follows the score band. */
export function ScoreRing({ value, max, size = 56, stroke = 6, label }: { value: number; max: number; size?: number; stroke?: number; label?: boolean }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const ratio = max ? value / max : 0;
  const color = ratio >= 0.75 ? "stroke-mint" : ratio >= 0.5 ? "stroke-brand" : "stroke-accent";
  return (
    <span className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="-rotate-90" width={size} height={size} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-surface-muted" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - ratio)}
          className={cn(color, "transition-[stroke-dashoffset] duration-700")}
        />
      </svg>
      {label && (
        <span className="absolute inset-0 flex flex-col items-center justify-center leading-none">
          <span className="font-display font-bold tabular-nums" style={{ fontSize: size * 0.28 }}>{value}</span>
          <span className="text-ink-subtle" style={{ fontSize: size * 0.13 }}>of {max}</span>
        </span>
      )}
    </span>
  );
}

/** Horizontal step tracker (Assigned → Submitted → Evaluated → Published). */
export function ProgressSteps({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="flex items-start">
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={s} className="relative flex flex-1 flex-col items-center text-center">
            {i > 0 && (
              <span className={cn("absolute top-4 right-1/2 h-0.5 w-full -translate-y-1/2", i <= current ? "bg-brand" : "bg-line")} aria-hidden="true" />
            )}
            <span
              className={cn(
                "relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ring-4 ring-surface",
                done ? "bg-brand text-white" : active ? "bg-brand-soft text-brand-ink ring-brand-soft" : "bg-surface-muted text-ink-subtle",
              )}
            >
              {done ? <Check className="h-4 w-4" /> : i + 1}
            </span>
            <span className={cn("mt-2 text-[11px] font-semibold sm:text-xs", done || active ? "text-ink" : "text-ink-subtle")}>{s}</span>
          </li>
        );
      })}
    </ol>
  );
}

/** Thin labelled bar for a rubric criterion. */
export function CriterionBar({ label, value, max, comment }: { label: string; value: number; max: number; comment?: string }) {
  const pct = max ? (value / max) * 100 : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-medium text-ink">{label}</span>
        <span className="shrink-0 tabular-nums text-ink-muted">
          <span className="font-semibold text-ink">{value}</span> / {max}
        </span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-muted">
        <div className="h-full rounded-full bg-gradient-to-r from-brand to-accent" style={{ width: `${pct}%` }} />
      </div>
      {comment && <p className="mt-1 text-xs text-ink-subtle">{comment}</p>}
    </div>
  );
}
