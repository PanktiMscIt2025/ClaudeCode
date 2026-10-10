import Link from "next/link";
import { db } from "@/lib/server/db";
import { requireUser } from "@/lib/server/auth";
import { requireOwnedCourse } from "@/lib/server/courses";
import { parseJson } from "@/lib/server/json";
import { aiEnabled } from "@/lib/server/ai";
import { Badge, Card, EmptyState } from "@/components/ui";
import { AssignmentBadge } from "@/components/status";
import { AutoRefresh } from "@/components/auto-refresh";
import { ArrowRight } from "@/components/icons";
import { formatDate } from "@/lib/format";
import type { AssignmentStatus } from "@/lib/types";
import { NewAssignment } from "./new-assignment";

export default async function AssignmentsPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser("FACULTY");
  const course = await requireOwnedCourse((await params).id, user.id);
  const [assignments, syllabus, studentCount] = await Promise.all([
    db.assignment.findMany({ where: { courseId: course.id }, orderBy: { createdAt: "desc" }, include: { _count: { select: { versions: true } } } }),
    db.syllabus.findUnique({ where: { courseId: course.id } }),
    db.courseStudent.count({ where: { courseId: course.id, student: { disabled: false } } }),
  ]);
  const generating = assignments.some((a) => a.status === "GENERATING");

  return (
    <div className="space-y-6">
      <AutoRefresh active={generating} />
      <NewAssignment
        courseId={course.id}
        topics={parseJson<string[]>(syllabus?.topics, [])}
        studentCount={studentCount}
        aiEnabled={aiEnabled()}
        defaultOpen={assignments.length === 0}
      />

      {assignments.length === 0 ? (
        <EmptyState title="No assignments yet">Generate the first one above.</EmptyState>
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => (
            <Link key={a.id} href={`/faculty/courses/${course.id}/assignments/${a.id}`} className="group block">
              <Card className="flex flex-col gap-3 transition-shadow group-hover:shadow-lift sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-brand-ink">{a.code}</span>
                    <h3 className="font-semibold">{a.title}</h3>
                    <AssignmentBadge status={a.status as AssignmentStatus} />
                    {a.generator === "offline" && <Badge tone="gray">offline generator</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-ink-muted">
                    {parseJson<string[]>(a.topics, []).join(" · ")} · {a.totalMarks} marks · due {formatDate(a.dueAt.toISOString())}
                  </p>
                  {a.status === "GENERATING" && (
                    <div className="mt-3 h-1.5 max-w-sm overflow-hidden rounded-full bg-surface-muted">
                      <div className="h-full rounded-full bg-gradient-to-r from-brand to-accent transition-all" style={{ width: `${Math.min(100, (a.progress / Math.max(studentCount, 1)) * 100)}%` }} />
                    </div>
                  )}
                  {a.error && <p className="mt-2 text-sm text-danger">{a.error}</p>}
                </div>
                <span className="text-sm text-ink-muted">
                  {a._count.versions} / {studentCount} versions
                </span>
                <ArrowRight className="hidden h-5 w-5 text-ink-subtle transition-transform group-hover:translate-x-1 sm:block" />
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
