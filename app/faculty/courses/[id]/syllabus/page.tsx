import { db } from "@/lib/server/db";
import { requireUser } from "@/lib/server/auth";
import { requireOwnedCourse } from "@/lib/server/courses";
import { parseJson } from "@/lib/server/json";
import { aiEnabled } from "@/lib/server/ai";
import { SyllabusEditor } from "./syllabus-editor";

export default async function SyllabusPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser("FACULTY");
  const course = await requireOwnedCourse((await params).id, user.id);
  const s = await db.syllabus.findUnique({ where: { courseId: course.id } });
  return (
    <SyllabusEditor
      courseId={course.id}
      aiEnabled={aiEnabled()}
      initial={
        s
          ? { fileName: s.fileName, uploadedAt: s.uploadedAt.toISOString(), topics: parseJson<string[]>(s.topics, []), outcomes: parseJson<string[]>(s.outcomes, []) }
          : null
      }
    />
  );
}
