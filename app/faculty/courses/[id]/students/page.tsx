import { db } from "@/lib/server/db";
import { requireUser } from "@/lib/server/auth";
import { requireOwnedCourse } from "@/lib/server/courses";
import { StudentList } from "./student-list";

export default async function StudentsPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser("FACULTY");
  const course = await requireOwnedCourse((await params).id, user.id);
  const enrollments = await db.courseStudent.findMany({
    where: { courseId: course.id },
    include: { student: { select: { id: true, name: true, loginId: true, disabled: true, mustChangePassword: true } } },
    orderBy: { student: { loginId: "asc" } },
  });
  const students = enrollments.map((e) => ({
    id: e.student.id,
    name: e.student.name,
    enrollmentNo: e.student.loginId,
    disabled: e.student.disabled,
    mustChangePassword: e.student.mustChangePassword,
  }));
  return <StudentList courseId={course.id} courseCode={course.code} initial={students} />;
}
