import { db } from "@/lib/server/db";
import { aiEnabled, aiExtractSyllabus, AiError } from "@/lib/server/ai";
import { findOwnedCourse } from "@/lib/server/courses";
import { jsonError, mb, routeUser, tooLarge } from "@/lib/server/http";
import { offlineExtractSyllabus } from "@/lib/server/offline";
import { extractDocumentText, ExtractError } from "@/lib/server/text-extract";

export const maxDuration = 120;

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await routeUser(req, "FACULTY");
  if (user instanceof Response) return user;
  const course = await findOwnedCourse((await params).id, user.id);
  if (!course) return jsonError(404, "Course not found.");

  const maxBytes = mb("MAX_SYLLABUS_MB", 10);
  if (tooLarge(req, maxBytes)) return jsonError(413, `The file is larger than ${maxBytes / 1024 / 1024} MB.`);
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return jsonError(400, "Choose a PDF or DOCX file.");
  if (file.size > maxBytes) return jsonError(413, `The file is larger than ${maxBytes / 1024 / 1024} MB.`);

  let text: string;
  try {
    text = await extractDocumentText(await file.arrayBuffer(), file.name);
  } catch (e) {
    return jsonError(400, e instanceof ExtractError ? e.message : "We couldn't read this file.");
  }
  if (text.length < 50) return jsonError(400, "No readable text found. If this is a scanned PDF, upload the original Word or text-based PDF instead.");

  let info;
  try {
    info = aiEnabled() ? await aiExtractSyllabus(text) : offlineExtractSyllabus(text);
  } catch (e) {
    if (!(e instanceof AiError)) throw e;
    info = offlineExtractSyllabus(text); // fall back so the upload still succeeds; faculty can edit topics
  }
  const topics = Array.from(new Set(info.topics.map((t) => t.trim()).filter(Boolean))).slice(0, 40);
  const outcomes = info.outcomes.map((o) => o.trim()).filter(Boolean).slice(0, 15);

  const syllabus = await db.syllabus.upsert({
    where: { courseId: course.id },
    create: { courseId: course.id, fileName: file.name, extractedText: text, topics: JSON.stringify(topics), outcomes: JSON.stringify(outcomes) },
    update: { fileName: file.name, extractedText: text, topics: JSON.stringify(topics), outcomes: JSON.stringify(outcomes), uploadedAt: new Date() },
  });
  return Response.json({ fileName: syllabus.fileName, uploadedAt: syllabus.uploadedAt, topics, outcomes, generator: aiEnabled() ? "ai" : "offline" });
}
