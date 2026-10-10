import { EmptyState, PageHeader } from "@/components/ui";
import { demoCurrentStudent, studentView } from "@/lib/demo-data";
import { dueLabel } from "@/lib/format";
import { SubmitForm } from "./submit-form";

export default function SubmitPage() {
  const view = studentView(demoCurrentStudent.id)[0];
  if (!view) return <EmptyState title="Nothing to submit">You don&apos;t have an active assignment.</EmptyState>;

  const deliverables = Array.from(new Set(view.sa.questions.map((q) => q.deliverable)));
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        eyebrow={`${view.sa.version} · ${dueLabel(view.assignment.dueAt).text}`}
        title="Submit your work"
        description={`Upload a single ZIP for “${view.assignment.title}”.`}
      />
      <SubmitForm
        deliverables={deliverables}
        previous={view.latest ? { fileName: view.latest.fileName, submittedAt: view.latest.submittedAt } : null}
        closed={dueLabel(view.assignment.dueAt).closed}
      />
    </div>
  );
}
