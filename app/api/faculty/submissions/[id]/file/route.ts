import { db } from "@/lib/server/db";
import { jsonError, routeUser } from "@/lib/server/http";
import { findOwnedSubmission } from "@/lib/server/faculty-data";

/** Download the original ZIP (faculty of that course only; stored files are never served directly). */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await routeUser(req, "FACULTY");
  if (user instanceof Response) return user;
  const sub = await findOwnedSubmission((await params).id, user.id);
  const file = sub && (await db.submissionFile.findUnique({ where: { submissionId: sub.id } }));
  if (!sub || !file) return jsonError(404, "File not available.");
  const name = `${sub.studentAssignment.student.loginId}_${sub.studentAssignment.assignment.code}.zip`.replace(/[^\w.\-]/g, "_");
  return new Response(new Uint8Array(file.data), {
    headers: { "Content-Type": "application/zip", "Content-Disposition": `attachment; filename="${name}"`, "Cache-Control": "no-store" },
  });
}
