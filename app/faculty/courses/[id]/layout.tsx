import Link from "next/link";
import { notFound } from "next/navigation";
import { demoCourses } from "@/lib/demo-data";
import { CourseTabs } from "./course-tabs";

export default async function CourseLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  const course = demoCourses.find((c) => c.id === id);
  if (!course) notFound();

  return (
    <div>
      <nav className="mb-2 text-sm text-ink-subtle" aria-label="Breadcrumb">
        <Link href="/faculty/courses" className="hover:text-ink">
          Courses
        </Link>{" "}
        / <span className="font-mono">{course.code}</span>
      </nav>
      <h1 className="font-display text-3xl font-extrabold tracking-tight">{course.name}</h1>
      <CourseTabs courseId={course.id} />
      <div className="mt-8">{children}</div>
    </div>
  );
}
