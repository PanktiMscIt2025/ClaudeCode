import { Badge, EmptyState, PageHeader } from "@/components/ui";
import { File, Zip } from "@/components/icons";
import { requireUser } from "@/lib/server/auth";
import { getStudentViews } from "@/lib/server/student-data";
import { studentStatusText } from "@/lib/student-status";
import { formatBytes, formatDate } from "@/lib/format";

export default async function HistoryPage() {
  const user = await requireUser("STUDENT");
  const items = (await getStudentViews(user.id)).flatMap((v) =>
    v.submissions.map((s, i) => ({ s, v, isLatest: i === 0 })),
  ).sort((a, b) => b.s.submittedAt.localeCompare(a.s.submittedAt));

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Submission history" description="Every ZIP you've uploaded. Only the latest upload for each assignment is evaluated." />
      {items.length === 0 ? (
        <EmptyState title="No submissions yet">When you upload a ZIP it will appear here.</EmptyState>
      ) : (
        <ol className="relative space-y-5 border-l-2 border-line pl-6 sm:pl-8">
          {items.map(({ s, v, isLatest }) => {
            const tone = s.evaluation?.status === "APPROVED" ? "green" : "amber";
            return (
              <li key={s.id} className="relative">
                <span className="absolute top-5 -left-[33px] flex h-4 w-4 items-center justify-center rounded-full bg-brand ring-4 ring-bg sm:-left-[41px]" />
                <div className="rounded-2xl bg-surface p-5 shadow-soft ring-1 ring-line">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-ink-subtle">{formatDate(s.submittedAt)}</p>
                      <p className="mt-0.5 font-semibold">{v.assignment.title}</p>
                    </div>
                    <div className="flex gap-2">
                      {isLatest && <Badge tone="blue">Latest</Badge>}
                      <Badge tone={tone}>{studentStatusText(s)}</Badge>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-3 rounded-xl bg-surface-muted p-3">
                    <Zip className="h-5 w-5 shrink-0 text-brand-ink" />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{s.fileName}</span>
                    <span className="text-xs text-ink-subtle">{formatBytes(s.sizeBytes)}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {s.files.map((f) => (
                      <span key={f} className="inline-flex items-center gap-1 rounded-md bg-bg px-2 py-1 text-xs text-ink-muted ring-1 ring-line">
                        <File className="h-3 w-3" /> {f}
                      </span>
                    ))}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
