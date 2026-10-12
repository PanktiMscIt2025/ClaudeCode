import { Badge, ButtonLink, Card, EmptyState } from "@/components/ui";
import { Calendar, Clock, File, Upload } from "@/components/icons";
import { requireUser } from "@/lib/server/auth";
import { getStudentViews } from "@/lib/server/student-data";
import { AssignmentPicker } from "@/components/assignment-picker";
import { dueLabel, formatDate } from "@/lib/format";
import { DownloadInstructions } from "./download-instructions";

export default async function MyAssignmentPage({ searchParams }: { searchParams: Promise<{ sa?: string }> }) {
  const user = await requireUser("STUDENT");
  const views = await getStudentViews(user.id);
  const { sa: selected } = await searchParams;
  const view = views.find((v) => v.sa.id === selected) ?? views[0];
  if (!view) return <EmptyState title="No assignment yet">Your teacher hasn&apos;t published one for you.</EmptyState>;

  const { assignment, sa } = view;
  const due = dueLabel(assignment.dueAt);

  return (
    <>
    <AssignmentPicker base="/student/assignment" current={sa.id} items={views.map((v) => ({ id: v.sa.id, label: `${v.assignment.courseCode} · ${v.sa.version}` }))} />
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="min-w-0 space-y-6">
        <header>
          <div className="flex flex-wrap gap-2">
            <Badge tone="blue">Version {sa.version}</Badge>
            <Badge tone={due.closed ? "gray" : due.urgent ? "red" : "amber"}>
              <Clock className="h-3.5 w-3.5" /> {due.text}
            </Badge>
          </div>
          <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight">{assignment.title}</h1>
          <p className="mt-1 text-sm text-ink-subtle">
            {assignment.courseCode} · {assignment.courseName}
          </p>
        </header>

        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-soft to-accent-soft p-6 sm:p-8">
          <p className="text-xs font-bold tracking-wider text-brand-ink uppercase">Your scenario</p>
          <p className="mt-3 text-lg leading-relaxed text-ink">{sa.scenario}</p>
          <p className="mt-4 text-xs text-ink-muted">This scenario was written for you. Other students have different ones.</p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold">Questions</h2>
          <ol className="mt-4 space-y-4">
            {sa.questions.map((q) => (
              <li key={q.number} className="rounded-2xl bg-surface p-5 shadow-soft ring-1 ring-line sm:p-6">
                <div className="flex items-start gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand text-sm font-bold text-white">
                    Q{q.number}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="leading-relaxed text-ink">{q.text}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <Badge tone="gray">{q.marks} marks</Badge>
                      <span className="inline-flex items-center gap-1 rounded-full bg-mint-soft px-2.5 py-0.5 font-semibold text-mint">
                        <File className="h-3.5 w-3.5" /> {q.deliverable}
                      </span>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <Card>
          <h2 className="font-display text-lg font-bold">How you&apos;ll be marked</h2>
          <ul className="mt-4 divide-y divide-line">
            {assignment.rubric.map((r) => (
              <li key={r.criterion} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                <div>
                  <p className="font-medium">{r.criterion}</p>
                  <p className="text-sm text-ink-subtle">{r.description}</p>
                </div>
                <span className="shrink-0 font-display text-lg font-bold tabular-nums">{r.maxMarks}</span>
              </li>
            ))}
            <li className="flex justify-between pt-3 font-semibold">
              <span>Total</span>
              <span className="font-display text-lg tabular-nums">{assignment.totalMarks}</span>
            </li>
          </ul>
        </Card>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-10 lg:self-start">
        <Card>
          <h2 className="font-semibold">Submission</h2>
          <p className="mt-3 flex items-center gap-2 text-sm text-ink-muted">
            <Calendar className="h-4 w-4" /> Due {formatDate(assignment.dueAt)}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-ink-muted">{sa.instructions}</p>
          <div className="mt-5 space-y-2">
            <ButtonLink href={`/student/submit?sa=${sa.id}`} className="w-full">
              <Upload className="h-4 w-4" /> Upload ZIP
            </ButtonLink>
            <DownloadInstructions assignment={assignment} sa={sa} />
          </div>
        </Card>
        <div className="rounded-2xl bg-sun-soft p-4 text-sm text-sun">
          <p className="font-semibold">Tip</p>
          <p className="mt-1">State your assumptions in the report. Only .pdf, .docx, .txt, .md and source-code files are read.</p>
        </div>
      </aside>
    </div>
    </>
  );
}
