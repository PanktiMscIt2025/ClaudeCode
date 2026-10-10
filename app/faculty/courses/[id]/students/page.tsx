import { demoStudents } from "@/lib/demo-data";
import { StudentList } from "./student-list";

export default async function StudentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StudentList courseId={id} initial={demoStudents} />;
}
