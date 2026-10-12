import { EmptyState, PageHeader } from "@/components/ui";
import { AssignmentPicker } from "@/components/assignment-picker";
import { requireUser } from "@/lib/server/auth";
import { getStudentViews } from "@/lib/server/student-data";
import { dueLabel } from "@/lib/format";
import { SubmitForm } from "./submit-form";

export default async function SubmitPage({ searchParams }: { searchParams: Promise<{ sa?: string }> }) {
  const user = await requireUser("STUDENT");
  const views = await getStudentViews(user.id);
  const { sa } = await searchParams;
  const view = views.find((v) => v.sa.id === sa) ?? views[0];
  if (!view) return <EmptyState title="Nothing to submit">You don&apos;t have a published assignment yet.</EmptyState>;

  const deliverables = Array.from(new Set(view.sa.questions.map((q) => q.deliverable)));
  const due = dueLabel(view.assignment.dueAt);
  return (
    <div className="mx-auto max-w-2xl">
      <AssignmentPicker base="/student/submit" current={view.sa.id} items={views.map((v) => ({ id: v.sa.id, label: `${v.assignment.courseCode} · ${v.sa.version}` }))} />
      <PageHeader eyebrow={`${view.sa.version} · ${due.text}`} title="Submit your work" description={`Upload a single ZIP for “${view.assignment.title}”.`} />
      <SubmitForm
        studentAssignmentId={view.sa.id}
        deliverables={deliverables}
        previous={view.latest ? { fileName: view.latest.fileName, submittedAt: view.latest.submittedAt } : null}
        closed={due.closed}
        marksPublished={Boolean(view.latest?.evaluation)}
      />
    </div>
  );
}
