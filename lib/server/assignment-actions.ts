"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "./db";
import { audit } from "./audit";
import { requireUser } from "./auth";
import { findOwnedCourse } from "./courses";
import { enqueue } from "./jobs";
import { regenerateVersion } from "./generation";
import { SIMILARITY_LIMIT } from "./similarity";
import type { ActionResult } from "./course-actions";

const listSchema = z.array(z.string().trim().min(1).max(200)).max(60);

export async function saveSyllabusAction(courseId: string, input: { topics: string[]; outcomes: string[] }): Promise<ActionResult> {
  const user = await requireUser("FACULTY");
  const course = await findOwnedCourse(courseId, user.id);
  if (!course) return { ok: false, error: "Course not found." };
  const topics = listSchema.safeParse(input.topics);
  const outcomes = listSchema.safeParse(input.outcomes);
  if (!topics.success || !outcomes.success) return { ok: false, error: "Topics and outcomes must be short text items." };
  const existing = await db.syllabus.findUnique({ where: { courseId } });
  if (!existing) return { ok: false, error: "Upload a syllabus first." };
  await db.syllabus.update({ where: { courseId }, data: { topics: JSON.stringify(topics.data), outcomes: JSON.stringify(outcomes.data) } });
  revalidatePath(`/faculty/courses/${courseId}/syllabus`);
  return { ok: true };
}

const createSchema = z.object({
  courseId: z.string().min(1),
  title: z.string().trim().min(3, "Give the assignment a title.").max(150),
  topics: z.array(z.string().trim().min(1).max(200)).min(1, "Pick at least one topic.").max(15),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  questionCount: z.number().int().min(1, "At least one question.").max(8, "At most 8 questions."),
  totalMarks: z.number().int().min(5).max(100),
  dueAt: z.string().refine((s) => !Number.isNaN(Date.parse(s)), "Pick a valid due date."),
});

export async function createAssignmentAction(input: z.input<typeof createSchema>): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser("FACULTY");
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const d = parsed.data;
  const course = await findOwnedCourse(d.courseId, user.id);
  if (!course) return { ok: false, error: "Course not found." };
  if (new Date(d.dueAt) < new Date()) return { ok: false, error: "The due date must be in the future." };
  const students = await db.courseStudent.count({ where: { courseId: course.id, student: { disabled: false } } });
  if (!students) return { ok: false, error: "Import students first. Each student gets their own version." };

  const count = await db.assignment.count({ where: { courseId: course.id } });
  const assignment = await db.assignment.create({
    data: {
      courseId: course.id,
      code: `A${count + 1}`,
      title: d.title,
      topics: JSON.stringify(d.topics),
      difficulty: d.difficulty,
      questionCount: d.questionCount,
      totalMarks: d.totalMarks,
      dueAt: new Date(d.dueAt),
      status: "GENERATING",
    },
  });
  await enqueue("GENERATE_ASSIGNMENT", { assignmentId: assignment.id });
  revalidatePath(`/faculty/courses/${course.id}/assignments`);
  return { ok: true, id: assignment.id };
}

async function ownedAssignment(assignmentId: string) {
  const user = await requireUser("FACULTY");
  const assignment = await db.assignment.findFirst({ where: { id: assignmentId, course: { facultyId: user.id } } });
  return assignment ? { user, assignment } : null;
}

const reviewPath = (a: { courseId: string; id: string }) => `/faculty/courses/${a.courseId}/assignments/${a.id}`;

export async function regenerateVersionAction(versionId: string): Promise<ActionResult> {
  const v = await db.studentAssignment.findUnique({ where: { id: versionId } });
  const ctx = v && (await ownedAssignment(v.assignmentId));
  if (!v || !ctx) return { ok: false, error: "Version not found." };
  if (ctx.assignment.status === "PUBLISHED") return { ok: false, error: "Published versions can't be changed: students may already be working on them." };
  if (ctx.assignment.status === "GENERATING") return { ok: false, error: "Wait for generation to finish." };
  try {
    await regenerateVersion(versionId);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Regeneration failed." };
  }
  revalidatePath(reviewPath(ctx.assignment));
  return { ok: true };
}

export async function publishAssignmentAction(assignmentId: string): Promise<ActionResult> {
  const ctx = await ownedAssignment(assignmentId);
  if (!ctx) return { ok: false, error: "Assignment not found." };
  if (ctx.assignment.status !== "REVIEW") return { ok: false, error: "Only reviewed drafts can be published." };
  const versions = await db.studentAssignment.findMany({ where: { assignmentId }, select: { similarity: true } });
  if (!versions.length) return { ok: false, error: "There are no versions to publish." };
  if (versions.some((v) => v.similarity > SIMILARITY_LIMIT)) return { ok: false, error: "Regenerate the versions flagged as too similar first." };
  await db.assignment.update({ where: { id: assignmentId }, data: { status: "PUBLISHED", publishedAt: new Date() } });
  await audit(ctx.user.id, "ASSIGNMENT_PUBLISHED", `assignment:${assignmentId}`, { versions: versions.length });
  revalidatePath(reviewPath(ctx.assignment));
  return { ok: true };
}

/** Create versions for students added after generation. */
export async function generateMissingAction(assignmentId: string): Promise<ActionResult> {
  const ctx = await ownedAssignment(assignmentId);
  if (!ctx) return { ok: false, error: "Assignment not found." };
  if (ctx.assignment.status === "GENERATING") return { ok: false, error: "Generation is already running." };
  if (ctx.assignment.status !== "PUBLISHED") await db.assignment.update({ where: { id: assignmentId }, data: { status: "GENERATING" } });
  await enqueue("GENERATE_ASSIGNMENT", { assignmentId });
  revalidatePath(reviewPath(ctx.assignment));
  return { ok: true };
}

export async function deleteAssignmentAction(assignmentId: string): Promise<ActionResult> {
  const ctx = await ownedAssignment(assignmentId);
  if (!ctx) return { ok: false, error: "Assignment not found." };
  if (ctx.assignment.status === "PUBLISHED") return { ok: false, error: "Published assignments can't be deleted." };
  if (ctx.assignment.status === "GENERATING") return { ok: false, error: "Wait for generation to finish." };
  await db.assignment.delete({ where: { id: assignmentId } });
  await audit(ctx.user.id, "ASSIGNMENT_DELETED", `assignment:${assignmentId}`, { title: ctx.assignment.title });
  revalidatePath(`/faculty/courses/${ctx.assignment.courseId}/assignments`);
  return { ok: true };
}
