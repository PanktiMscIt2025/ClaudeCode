"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/format";

const tabs = [
  { slug: "students", label: "Students" },
  { slug: "import", label: "Import Excel" },
  { slug: "syllabus", label: "Syllabus" },
  { slug: "assignments", label: "Assignments" },
];

export function CourseTabs({ courseId }: { courseId: string }) {
  const pathname = usePathname();
  return (
    <div className="mt-6 -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <nav className="inline-flex gap-1 rounded-2xl bg-surface-muted p-1" aria-label="Course sections">
        {tabs.map((t) => {
          const href = `/faculty/courses/${courseId}/${t.slug}`;
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={t.slug}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "rounded-xl px-4 py-2 text-sm font-semibold whitespace-nowrap transition-all",
                active ? "bg-surface text-ink shadow-soft" : "text-ink-muted hover:text-ink",
              )}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
