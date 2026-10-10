import { redirect } from "next/navigation";

export default async function CourseIndex({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/faculty/courses/${id}/students`);
}
