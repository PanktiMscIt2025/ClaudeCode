import Link from "next/link";
import { requireUser } from "@/lib/server/auth";
import { requireOwnedCourse } from "@/lib/server/courses";
import { CourseTabs } from "./course-tabs";

export default async function CourseLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const user = await requireUser("FACULTY");
  const course = await requireOwnedCourse((await params).id, user.id);

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
