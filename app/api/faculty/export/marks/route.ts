import { db } from "@/lib/server/db";
import { marksWorkbook, type MarksRow } from "@/lib/server/excel";
import { jsonError, routeUser, xlsxResponse } from "@/lib/server/http";
import { parseJson } from "@/lib/server/json";
import type { RubricCriterion } from "@/lib/types";

const STATUS: Record<string, string> = {
  QUEUED: "Queued",
  EVALUATING: "Evaluating",
  EVALUATED: "Provisional",
  NEEDS_REVIEW: "Needs review",
  FAILED: "Evaluation failed",
};

export async function GET(req: Request) {
  const user = await routeUser(req, "FACULTY");
  if (user instanceof Response) return user;
  const url = new URL(req.url);
  const assignmentId = url.searchParams.get("assignmentId") ?? "";
  const approvedOnly = url.searchParams.get("scope") === "approved";

  const a = await db.assignment.findFirst({
    where: { id: assignmentId, status: "PUBLISHED", course: { facultyId: user.id } },
    include: {
      course: true,
      versions: {
        include: {
          student: { select: { name: true, loginId: true } },
          submissions: { orderBy: { submittedAt: "desc" }, take: 1, include: { evaluation: { include: { criteria: true } } } },
        },
        orderBy: { student: { loginId: "asc" } },
      },
    },
  });
  if (!a) return jsonError(404, "Assignment not found.");

  const rows: MarksRow[] = a.versions
    .map((v) => {
      const s = v.submissions[0];
      const ev = s?.evaluation;
      const approved = ev?.status === "APPROVED";
      return {
        name: v.student.name,
        enrollmentNo: v.student.loginId,
        version: v.version,
        submittedAt: s?.submittedAt ?? null,
        criteria: new Map((ev?.criteria ?? []).map((c) => [c.criterion, c.finalMarks])),
        total: ev ? ev.finalTotal : null,
        status: !s ? "Not submitted" : approved ? "Approved" : STATUS[s.status] ?? s.status,
        approvedTotal: approved ? ev!.finalTotal : null,
        feedback: ev?.feedback ?? "",
      };
    })
    .filter((r) => !approvedOnly || r.approvedTotal !== null);

  const buf = await marksWorkbook(
    { courseLabel: `${a.course.code} · ${a.course.name}`, title: a.title, code: a.code, totalMarks: a.totalMarks, rubric: parseJson<RubricCriterion[]>(a.rubric, []) },
    rows,
  );
  const date = new Date().toISOString().slice(0, 10);
  return xlsxResponse(buf, `marks_${a.course.code}_${a.code}_${date}.xlsx`);
}
