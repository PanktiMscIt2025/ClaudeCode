import "server-only";
import { notFound } from "next/navigation";
import { db } from "./db";

export function getFacultyCourses(facultyId: string) {
  return db.course.findMany({
    where: { facultyId },
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { students: true, assignments: true } } },
  });
}

/** A course owned by this faculty member, or null. Every course-scoped action goes through this. */
export function findOwnedCourse(courseId: string, facultyId: string) {
  return db.course.findFirst({ where: { id: courseId, facultyId } });
}

export async function requireOwnedCourse(courseId: string, facultyId: string) {
  const course = await findOwnedCourse(courseId, facultyId);
  if (!course) notFound();
  return course;
}
