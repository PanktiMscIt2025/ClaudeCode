import { db } from "@/lib/server/db";
import { jsonError, mb, routeUser, tooLarge } from "@/lib/server/http";
import { enqueue } from "@/lib/server/jobs";
import { checkLimit, recordHit } from "@/lib/server/rate-limit";
import { withTempZip } from "@/lib/server/storage";
import { scanZip, ZipRejected } from "@/lib/server/zip";

export const maxDuration = 60;

export async function POST(req: Request) {
  const user = await routeUser(req, "STUDENT");
  if (user instanceof Response) return user;

  const maxBytes = mb("MAX_ZIP_MB", 20);
  const maxLabel = `${Math.round(maxBytes / 1024 / 1024)} MB`;
  if (tooLarge(req, maxBytes)) return jsonError(413, `The ZIP is larger than ${maxLabel}.`);
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const saId = form?.get("studentAssignmentId");
  if (!(file instanceof File) || typeof saId !== "string") return jsonError(400, "Choose a ZIP file to upload.");
  if (!file.name.toLowerCase().endsWith(".zip")) return jsonError(400, "Only .zip files are accepted.");
  if (file.size === 0) return jsonError(400, "The file is empty.");
  if (file.size > maxBytes) return jsonError(413, `The ZIP is larger than ${maxLabel}.`);

  // Only the student's own, published, still-open version.
  const sa = await db.studentAssignment.findFirst({
    where: { id: saId, studentId: user.id, assignment: { status: "PUBLISHED" } },
    include: { assignment: true, submissions: { include: { evaluation: { select: { status: true } } } } },
  });
  if (!sa) return jsonError(404, "Assignment not found.");
  if (sa.assignment.dueAt < new Date()) return jsonError(400, "The deadline for this assignment has passed.");
  if (sa.submissions.some((s) => s.evaluation?.status === "APPROVED")) return jsonError(400, "Your marks for this assignment are already published.");

  const key = `submit:${user.id}:${sa.id}`;
  if (!checkLimit(key, 5, 60 * 60 * 1000).allowed) return jsonError(429, "Too many uploads. Please wait a while before trying again.");

  const data = new Uint8Array(await file.arrayBuffer());
  const magic = String.fromCharCode(...data.slice(0, 4));
  if (magic !== "PK\u0003\u0004" && magic !== "PK\u0005\u0006") return jsonError(400, "This file is not a valid ZIP archive.");

  let scan;
  try {
    scan = await withTempZip(data, scanZip);
  } catch (e) {
    if (e instanceof ZipRejected) return jsonError(400, e.message);
    throw e;
  }
  if (!scan.accepted.length && !scan.images.length) {
    return jsonError(400, scan.rejected.length ? `None of the files can be evaluated: ${scan.rejected.slice(0, 3).join("; ")}` : "The ZIP is empty.");
  }

  recordHit(key);
  const submission = await db.submission.create({
    data: {
      studentAssignmentId: sa.id,
      fileName: file.name.replace(/[^\w.\- ()]/g, "_").slice(0, 120),
      sizeBytes: file.size,
      file: { create: { data } },
      files: JSON.stringify([...scan.accepted, ...scan.images]),
      rejectedFiles: JSON.stringify(scan.rejected),
    },
  });
  await enqueue("EVALUATE_SUBMISSION", { submissionId: submission.id });

  return Response.json({
    id: submission.id,
    fileName: submission.fileName,
    sizeBytes: submission.sizeBytes,
    files: [...scan.accepted, ...scan.images],
    rejected: scan.rejected,
  });
}
