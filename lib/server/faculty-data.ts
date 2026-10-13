import "server-only";
import { db } from "./db";
import type { EvaluationStatus, ReviewRow, SubmissionStatus } from "@/lib/types";

export interface FacultyRow extends ReviewRow {
  courseId: string;
  courseCode: string;
  assignmentId: string;
  submittedAt: string | null;
}

/**
 * One row per issued version of every published assignment in this faculty member's courses,
 * with the latest submission (if any). Optionally filtered to a course or assignment.
 */
export async function getReviewRows(facultyId: string, filter: { courseId?: string; assignmentId?: string } = {}): Promise<FacultyRow[]> {
  const versions = await db.studentAssignment.findMany({
    where: {
      assignment: { status: "PUBLISHED", course: { facultyId }, ...(filter.courseId ? { courseId: filter.courseId } : {}), ...(filter.assignmentId ? { id: filter.assignmentId } : {}) },
    },
    include: {
      student: { select: { name: true, loginId: true } },
      assignment: { select: { id: true, code: true, title: true, courseId: true, course: { select: { code: true } } } },
      submissions: { orderBy: { submittedAt: "desc" }, take: 1, include: { evaluation: { select: { finalTotal: true, status: true } } } },
    },
    orderBy: [{ assignment: { createdAt: "desc" } }, { student: { loginId: "asc" } }],
  });
  return versions.map((v) => {
    const s = v.submissions[0];
    return {
      submissionId: s?.id ?? null,
      enrollmentNo: v.student.loginId,
      studentName: v.student.name,
      assignmentTitle: `${v.assignment.code} · ${v.assignment.title}`,
      version: v.version,
      status: (s?.status ?? "NOT_SUBMITTED") as SubmissionStatus,
      score: s?.evaluation ? s.evaluation.finalTotal : null,
      reviewStatus: (s?.evaluation?.status ?? null) as EvaluationStatus | null,
      courseId: v.assignment.courseId,
      courseCode: v.assignment.course.code,
      assignmentId: v.assignment.id,
      submittedAt: s?.submittedAt.toISOString() ?? null,
    };
  });
}

/** A submission the faculty member may see (it belongs to one of their courses). */
export function findOwnedSubmission(submissionId: string, facultyId: string) {
  return db.submission.findFirst({
    where: { id: submissionId, studentAssignment: { assignment: { course: { facultyId } } } },
    include: {
      evaluation: { include: { criteria: { orderBy: { position: "asc" } } } },
      file: { select: { submissionId: true } },
      studentAssignment: {
        include: {
          student: { select: { name: true, loginId: true } },
          assignment: { select: { id: true, code: true, title: true, totalMarks: true, courseId: true } },
          submissions: { orderBy: { submittedAt: "desc" }, select: { id: true, submittedAt: true, status: true } },
        },
      },
    },
  });
}
