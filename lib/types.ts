// Domain types shared by UI and (later) API routes. Mirrors the Prisma schema in PLAN.md.

export type Role = "FACULTY" | "STUDENT";

export type SubmissionStatus = "NOT_SUBMITTED" | "QUEUED" | "EVALUATING" | "EVALUATED" | "NEEDS_REVIEW" | "FAILED";
export type EvaluationStatus = "PROVISIONAL" | "APPROVED";
export type AssignmentStatus = "DRAFT" | "GENERATING" | "REVIEW" | "PUBLISHED";
export type Difficulty = "EASY" | "MEDIUM" | "HARD";

export interface Course {
  id: string;
  code: string;
  name: string;
  studentCount: number;
  assignmentCount: number;
}

export interface Student {
  id: string;
  name: string;
  enrollmentNo: string;
  disabled: boolean;
  mustChangePassword: boolean;
}

export interface RubricCriterion {
  criterion: string;
  maxMarks: number;
  description: string;
}

export interface Question {
  number: number;
  text: string;
  marks: number;
  deliverable: string;
}

export interface Assignment {
  id: string;
  courseId: string;
  title: string;
  topics: string[];
  difficulty: Difficulty;
  questionCount: number;
  totalMarks: number;
  status: AssignmentStatus;
  dueAt: string;
  rubric: RubricCriterion[];
}

export interface StudentAssignment {
  id: string;
  assignmentId: string;
  studentId: string;
  version: string;
  scenario: string;
  questions: Question[];
  instructions: string;
}

export interface CriterionScore {
  criterion: string;
  maxMarks: number;
  aiMarks: number;
  finalMarks: number;
  comment: string;
}

export interface Evaluation {
  aiTotal: number;
  finalTotal: number;
  status: EvaluationStatus;
  feedback: string;
  evidence: string[];
  criteria: CriterionScore[];
}

export interface Submission {
  id: string;
  studentAssignmentId: string;
  fileName: string;
  sizeBytes: number;
  submittedAt: string;
  status: SubmissionStatus;
  files: string[];
  /** Why the system flagged this submission for manual review. */
  reviewReason?: string;
  /** Files rejected during safe extraction (executables, nested archives, …). */
  rejectedFiles?: string[];
  evaluation?: Evaluation;
}

/** One row of the faculty review table. */
export interface ReviewRow {
  submissionId: string | null;
  enrollmentNo: string;
  studentName: string;
  assignmentTitle: string;
  version: string;
  status: SubmissionStatus;
  score: number | null;
  reviewStatus: EvaluationStatus | null;
}

export interface ImportPreviewRow {
  row: number;
  name: string;
  enrollmentNo: string;
  action: "CREATE" | "UPDATE" | "SKIP";
  issue?: string;
}
