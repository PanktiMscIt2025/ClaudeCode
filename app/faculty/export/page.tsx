import { EmptyState, PageHeader } from "@/components/ui";
import { db } from "@/lib/server/db";
import { requireUser } from "@/lib/server/auth";
import { getReviewRows } from "@/lib/server/faculty-data";
import { parseJson } from "@/lib/server/json";
import type { RubricCriterion } from "@/lib/types";
import { ExportPanel } from "./export-panel";

export default async function ExportPage() {
  const user = await requireUser("FACULTY");
  const [assignments, rows] = await Promise.all([
    db.assignment.findMany({
      where: { status: "PUBLISHED", course: { facultyId: user.id } },
      include: { course: { select: { id: true, code: true, name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    getReviewRows(user.id),
  ]);
  const courses = Array.from(new Map(assignments.map((a) => [a.course.id, { id: a.course.id, label: `${a.course.code} · ${a.course.name}` }])).values());

  return (
    <div>
      <PageHeader title="Marks export" description="Download a formatted Excel sheet of marks for any published assignment." />
      {assignments.length === 0 ? (
        <EmptyState title="Nothing to export yet">Publish an assignment first. Marks appear here as submissions are evaluated.</EmptyState>
      ) : (
        <ExportPanel
          courses={courses}
          assignments={assignments.map((a) => ({
            id: a.id,
            courseId: a.courseId,
            title: `${a.code} · ${a.title}`,
            totalMarks: a.totalMarks,
            criteria: parseJson<RubricCriterion[]>(a.rubric, []).map((r) => `${r.criterion} (/${r.maxMarks})`),
          }))}
          rows={rows}
        />
      )}
    </div>
  );
}
