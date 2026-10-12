import Link from "next/link";

/** Brand mark: a folded "page" with a spark, plus the wordmark. */
export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="group inline-flex items-center gap-2" aria-label="AssignAI home">
      <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-accent shadow-soft transition-transform group-hover:-rotate-6">
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M7 3h7l4 4v14H7z" />
          <path d="M14 3v4h4" />
          <path d="M12.5 11.5l.9 1.9 1.9.9-1.9.9-.9 1.9-.9-1.9-1.9-.9 1.9-.9z" fill="currentColor" stroke="none" />
        </svg>
      </span>
      <span className="font-display text-xl font-bold tracking-tight text-ink">
        Assign<span className="text-brand-ink">AI</span>
      </span>
    </Link>
  );
}
