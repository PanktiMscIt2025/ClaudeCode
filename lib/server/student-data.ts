import "server-only";
import { db } from "./db";
import { parseJson } from "./json";
import type { Assignment, AssignmentStatus, Difficulty, Question, RubricCriterion, StudentAssignment, Submission, SubmissionStatus } from "@/lib/types";

export interface StudentAssignmentView {
  assignment: Assignment & { courseName: string; courseCode: string };
  sa: StudentAssignment;
  submissions: Submission[];
  latest?: Submission;
}

/**
 * Everything a student may see, scoped to their own user id: published versions issued to them and
 * their own submissions. Evaluations are included only once faculty have approved them, so
 * provisional AI marks never reach the student's browser.
 */
export async function getStudentViews(studentId: string): Promise<StudentAssignmentView[]> {
  const rows = await db.studentAssignment.findMany({
    where: { studentId, assignment: { status: "PUBLISHED" } },
    include: {
      assignment: { include: { course: { select: { name: true, code: true } } } },
      submissions: { orderBy: { submittedAt: "desc" }, include: { evaluation: { include: { criteria: { orderBy: { position: "asc" } } } } } },
    },
  });

  const now = Date.now();
  return rows
    .map((r) => {
      const a = r.assignment;
      const submissions: Submission[] = r.submissions.map((s) => ({
        id: s.id,
        studentAssignmentId: s.studentAssignmentId,
        fileName: s.fileName,
        sizeBytes: s.sizeBytes,
        submittedAt: s.submittedAt.toISOString(),
        status: s.status as SubmissionStatus,
        files: parseJson<string[]>(s.files, []),
        evaluation:
          s.evaluation?.status === "APPROVED"
            ? {
                aiTotal: s.evaluation.finalTotal, // students only ever see the approved figure
                finalTotal: s.evaluation.finalTotal,
                status: "APPROVED",
                feedback: s.evaluation.feedback,
                evidence: [],
                criteria: s.evaluation.criteria.map((c) => ({ criterion: c.criterion, maxMarks: c.maxMarks, aiMarks: c.finalMarks, finalMarks: c.finalMarks, comment: c.comment })),
              }
            : undefined,
      }));
      return {
        assignment: {
          id: a.id,
          courseId: a.courseId,
          courseName: a.course.name,
          courseCode: a.course.code,
          title: a.title,
          topics: parseJson<string[]>(a.topics, []),
          difficulty: a.difficulty as Difficulty,
          questionCount: a.questionCount,
          totalMarks: a.totalMarks,
          status: a.status as AssignmentStatus,
          dueAt: a.dueAt.toISOString(),
          rubric: parseJson<RubricCriterion[]>(r.rubric, []),
        },
        sa: {
          id: r.id,
          assignmentId: r.assignmentId,
          studentId: r.studentId,
          version: r.version,
          scenario: r.scenario,
          questions: parseJson<Question[]>(r.questions, []),
          instructions: r.instructions,
        },
        submissions,
        latest: submissions[0],
      };
    })
    .sort((x, y) => {
      // Open assignments first (soonest due), then closed ones (most recent first).
      const xo = Date.parse(x.assignment.dueAt) >= now;
      const yo = Date.parse(y.assignment.dueAt) >= now;
      if (xo !== yo) return xo ? -1 : 1;
      return xo ? x.assignment.dueAt.localeCompare(y.assignment.dueAt) : y.assignment.dueAt.localeCompare(x.assignment.dueAt);
    });
}
