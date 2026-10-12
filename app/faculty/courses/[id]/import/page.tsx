import { requireUser } from "@/lib/server/auth";
import { requireOwnedCourse } from "@/lib/server/courses";
import { ImportWizard } from "./import-wizard";

export default async function ImportPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser("FACULTY");
  const course = await requireOwnedCourse((await params).id, user.id);
  return <ImportWizard courseId={course.id} courseCode={course.code} />;
}
