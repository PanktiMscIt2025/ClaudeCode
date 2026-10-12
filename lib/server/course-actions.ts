"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "./db";
import { audit } from "./audit";
import { requireUser } from "./auth";
import { findOwnedCourse } from "./courses";
import { generateTempPassword, hashPassword } from "./password";

export type ActionResult<T = object> = ({ ok: true } & T) | { ok: false; error: string };

const courseSchema = z.object({
  code: z.string().trim().min(1, "Enter a course code.").max(30).regex(/^[\w\- .]+$/, "Use letters, numbers, spaces, - or _ in the code."),
  name: z.string().trim().min(1, "Enter a course name.").max(120),
});

export async function createCourseAction(input: { code: string; name: string }): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser("FACULTY");
  const parsed = courseSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const code = parsed.data.code.toUpperCase();
  const exists = await db.course.findUnique({ where: { facultyId_code: { facultyId: user.id, code } } });
  if (exists) return { ok: false, error: `You already have a course with code ${code}.` };
  const course = await db.course.create({ data: { code, name: parsed.data.name, facultyId: user.id } });
  revalidatePath("/faculty", "layout");
  return { ok: true, id: course.id };
}

/** The student must be enrolled in a course owned by the acting faculty member. */
async function ownedStudent(courseId: string, studentId: string) {
  const user = await requireUser("FACULTY");
  const course = await findOwnedCourse(courseId, user.id);
  if (!course) return null;
  const enrollment = await db.courseStudent.findUnique({
    where: { courseId_studentId: { courseId, studentId } },
    include: { student: true },
  });
  if (!enrollment || enrollment.student.role !== "STUDENT") return null;
  return { user, course, student: enrollment.student };
}

export async function resetStudentPasswordAction(courseId: string, studentId: string): Promise<ActionResult<{ password: string }>> {
  const ctx = await ownedStudent(courseId, studentId);
  if (!ctx) return { ok: false, error: "Student not found in this course." };
  const password = generateTempPassword();
  await db.$transaction(async (tx) => {
    await tx.user.update({ where: { id: studentId }, data: { passwordHash: await hashPassword(password), mustChangePassword: true } });
    await tx.session.deleteMany({ where: { userId: studentId } });
    await audit(ctx.user.id, "PASSWORD_RESET", `user:${studentId}`, { enrollmentNo: ctx.student.loginId, courseId }, tx);
  });
  revalidatePath(`/faculty/courses/${courseId}/students`);
  // Shown to faculty once; only the hash is stored.
  return { ok: true, password };
}

export async function setStudentDisabledAction(courseId: string, studentId: string, disabled: boolean): Promise<ActionResult> {
  const ctx = await ownedStudent(courseId, studentId);
  if (!ctx) return { ok: false, error: "Student not found in this course." };
  await db.$transaction(async (tx) => {
    await tx.user.update({ where: { id: studentId }, data: { disabled } });
    if (disabled) await tx.session.deleteMany({ where: { userId: studentId } });
    await audit(ctx.user.id, disabled ? "ACCOUNT_DISABLED" : "ACCOUNT_ENABLED", `user:${studentId}`, { enrollmentNo: ctx.student.loginId, courseId }, tx);
  });
  revalidatePath(`/faculty/courses/${courseId}/students`);
  return { ok: true };
}
