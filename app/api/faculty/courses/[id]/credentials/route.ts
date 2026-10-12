import { db } from "@/lib/server/db";
import { audit } from "@/lib/server/audit";
import { findOwnedCourse } from "@/lib/server/courses";
import { credentialsWorkbook } from "@/lib/server/excel";
import { jsonError, routeUser, xlsxResponse } from "@/lib/server/http";
import { generateTempPassword, hashPassword } from "@/lib/server/password";

/**
 * Issue fresh temporary passwords to students in this course who have never signed in
 * (still on a temporary password) and download them. Used when the original sheet is lost.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await routeUser(req, "FACULTY");
  if (user instanceof Response) return user;
  const course = await findOwnedCourse((await params).id, user.id);
  if (!course) return jsonError(404, "Course not found.");

  const students = await db.user.findMany({
    where: { role: "STUDENT", mustChangePassword: true, disabled: false, enrollments: { some: { courseId: course.id } } },
    orderBy: { loginId: "asc" },
  });
  if (!students.length) return jsonError(400, "Every active student has already set their own password.");

  const creds = students.map((s) => ({ id: s.id, name: s.name, enrollmentNo: s.loginId, password: generateTempPassword() }));
  const hashes = await Promise.all(creds.map((c) => hashPassword(c.password)));
  await db.$transaction([
    ...creds.map((c, i) => db.user.update({ where: { id: c.id }, data: { passwordHash: hashes[i] } })),
    db.session.deleteMany({ where: { userId: { in: creds.map((c) => c.id) } } }),
  ]);
  await audit(user.id, "TEMP_PASSWORDS_REISSUED", `course:${course.id}`, { count: creds.length });
  return xlsxResponse(await credentialsWorkbook(`${course.code} · ${course.name}`, creds), `${course.code}_credentials.xlsx`);
}
