import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/server/db";
import { requireUser } from "@/lib/server/auth";
import { parseJson } from "@/lib/server/json";
import { SIMILARITY_LIMIT } from "@/lib/server/similarity";
import { AutoRefresh } from "@/components/auto-refresh";
import type { AssignmentStatus, Question, RubricCriterion } from "@/lib/types";
import { ReviewBoard, type VersionView } from "./review-board";

export default async function AssignmentReviewPage({ params }: { params: Promise<{ id: string; aid: string }> }) {
  const user = await requireUser("FACULTY");
  const { id, aid } = await params;
  const assignment = await db.assignment.findFirst({
    where: { id: aid, courseId: id, course: { facultyId: user.id } },
    include: {
      versions: { include: { student: { select: { name: true, loginId: true } } }, orderBy: { version: "asc" } },
      course: { select: { _count: { select: { students: { where: { student: { disabled: false } } } } } } },
    },
  });
  if (!assignment) notFound();

  const versions: VersionView[] = assignment.versions.map((v) => {
    const ms = parseJson<{ title?: string; domain?: string; answers?: { question: number; answer: string; keyPoints: string[] }[] }>(v.modelSolution, {});
    return {
      id: v.id,
      version: v.version,
      studentName: v.student.name,
      enrollmentNo: v.student.loginId,
      title: ms.title ?? "",
      domain: ms.domain ?? "",
      scenario: v.scenario,
      questions: parseJson<Question[]>(v.questions, []),
      instructions: v.instructions,
      answers: ms.answers ?? [],
      similarity: v.similarity,
    };
  });

  return (
    <div>
      <AutoRefresh active={assignment.status === "GENERATING"} />
      <nav className="mb-4 text-sm text-ink-subtle">
        <Link href={`/faculty/courses/${id}/assignments`} className="hover:text-ink">
          ← All assignments
        </Link>
      </nav>
      <ReviewBoard
        assignment={{
          id: assignment.id,
          code: assignment.code,
          title: assignment.title,
          status: assignment.status as AssignmentStatus,
          difficulty: assignment.difficulty,
          questionCount: assignment.questionCount,
          totalMarks: assignment.totalMarks,
          dueAt: assignment.dueAt.toISOString(),
          topics: parseJson<string[]>(assignment.topics, []),
          rubric: parseJson<RubricCriterion[]>(assignment.rubric, []),
          generator: assignment.generator,
          progress: assignment.progress,
          error: assignment.error,
        }}
        studentCount={assignment.course._count.students}
        versions={versions}
        similarityLimit={SIMILARITY_LIMIT}
      />
    </div>
  );
}
