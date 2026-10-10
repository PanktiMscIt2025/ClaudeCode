import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { CriterionBar, ScoreRing } from "@/components/visuals";
import { Clock } from "@/components/icons";
import { demoCurrentStudent, studentView } from "@/lib/demo-data";
import { formatDate, percent } from "@/lib/format";

export default function MarksPage() {
  const views = studentView(demoCurrentStudent.id).filter((v) => v.latest);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Marks & feedback" description="Marks appear here once your teacher has reviewed and approved them." />

      {views.length === 0 && <EmptyState title="Nothing yet">Submit an assignment to see your results here.</EmptyState>}

      <div className="space-y-6">
        {views.map(({ assignment, sa, latest }) => {
          const ev = latest!.evaluation;
          // Students never see provisional (unapproved) AI marks.
          if (!ev || ev.status !== "APPROVED") {
            return (
              <Card key={sa.id} className="flex items-center gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sun-soft text-sun">
                  <Clock className="h-6 w-6" />
                </span>
                <div className="min-w-0">
                  <p className="font-semibold">{assignment.title}</p>
                  <p className="text-sm text-ink-muted">Submitted {formatDate(latest!.submittedAt)}: waiting for your teacher&apos;s review.</p>
                </div>
              </Card>
            );
          }

          return (
            <article key={sa.id} className="overflow-hidden rounded-3xl bg-surface shadow-soft ring-1 ring-line">
              <div className="flex flex-col items-center gap-6 bg-gradient-to-br from-brand-soft via-surface to-mint-soft p-6 text-center sm:flex-row sm:p-8 sm:text-left">
                <ScoreRing value={ev.finalTotal} max={assignment.totalMarks} size={128} stroke={11} label />
                <div className="min-w-0">
                  <Badge tone="green">Published</Badge>
                  <h2 className="mt-2 font-display text-2xl font-bold">{assignment.title}</h2>
                  <p className="mt-1 text-ink-muted">
                    {ev.finalTotal} / {assignment.totalMarks} · {percent(ev.finalTotal, assignment.totalMarks)}% · Version {sa.version}
                  </p>
                </div>
              </div>
              <div className="grid gap-8 p-6 sm:p-8 md:grid-cols-2">
                <section>
                  <h3 className="text-sm font-bold tracking-wide text-ink-subtle uppercase">Breakdown</h3>
                  <div className="mt-4 space-y-5">
                    {ev.criteria.map((c) => (
                      <CriterionBar key={c.criterion} label={c.criterion} value={c.finalMarks} max={c.maxMarks} comment={c.comment} />
                    ))}
                  </div>
                </section>
                <section>
                  <h3 className="text-sm font-bold tracking-wide text-ink-subtle uppercase">Feedback</h3>
                  <p className="mt-4 leading-relaxed text-ink">{ev.feedback}</p>
                </section>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
