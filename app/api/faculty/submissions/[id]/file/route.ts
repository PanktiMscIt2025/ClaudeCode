import { readFile } from "node:fs/promises";
import { jsonError, routeUser } from "@/lib/server/http";
import { findOwnedSubmission } from "@/lib/server/faculty-data";
import { safeStoredPath } from "@/lib/server/storage";

/** Download the original ZIP (faculty of that course only; private storage is never served directly). */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await routeUser(req, "FACULTY");
  if (user instanceof Response) return user;
  const sub = await findOwnedSubmission((await params).id, user.id);
  const full = sub?.storedPath && safeStoredPath(sub.storedPath);
  if (!sub || !full) return jsonError(404, "File not available.");
  const data = await readFile(full).catch(() => null);
  if (!data) return jsonError(404, "File not available.");
  const name = `${sub.studentAssignment.student.loginId}_${sub.studentAssignment.assignment.code}.zip`.replace(/[^\w.\-]/g, "_");
  return new Response(new Uint8Array(data), {
    headers: { "Content-Type": "application/zip", "Content-Disposition": `attachment; filename="${name}"`, "Cache-Control": "no-store" },
  });
}
