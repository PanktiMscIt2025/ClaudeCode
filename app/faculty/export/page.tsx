import { PageHeader } from "@/components/ui";
import { demoAssignments, demoCourses, demoReviewRows } from "@/lib/demo-data";
import { ExportPanel } from "./export-panel";

export default function ExportPage() {
  return (
    <div>
      <PageHeader title="Marks export" description="Download a formatted Excel sheet of marks for any assignment." />
      <ExportPanel
        courses={demoCourses.map((c) => ({ id: c.id, label: `${c.code} · ${c.name}` }))}
        assignments={demoAssignments.map((a) => ({ id: a.id, courseId: a.courseId, title: a.title }))}
        rows={demoReviewRows}
      />
    </div>
  );
}
