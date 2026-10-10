import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { ArrowRight, Book, Users } from "@/components/icons";
import { demoCourses } from "@/lib/demo-data";
import { CreateCourseButton } from "./create-course";

const gradients = ["from-brand to-[#9b5cf0]", "from-accent to-[#ff9a5a]", "from-mint to-[#38b2d8]"];

export default function CoursesPage() {
  return (
    <div>
      <PageHeader title="Courses" description="Each course has its own students, syllabus, and assignments." actions={<CreateCourseButton />} />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {demoCourses.map((c, i) => (
          <Link
            key={c.id}
            href={`/faculty/courses/${c.id}/students`}
            className="group overflow-hidden rounded-3xl bg-surface shadow-soft ring-1 ring-line transition-all hover:-translate-y-1 hover:shadow-lift"
          >
            <div className={`relative h-24 bg-gradient-to-br ${gradients[i % gradients.length]}`}>
              <div className="bg-dots absolute inset-0 opacity-30" />
              <span className="absolute bottom-3 left-5 rounded-lg bg-white/20 px-2 py-0.5 font-mono text-xs font-semibold text-white backdrop-blur">
                {c.code}
              </span>
            </div>
            <div className="p-5">
              <h2 className="font-display text-lg leading-snug font-bold">{c.name}</h2>
              <div className="mt-4 flex items-center gap-4 text-sm text-ink-muted">
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" /> {c.studentCount} students
                </span>
                <span className="flex items-center gap-1.5">
                  <Book className="h-4 w-4" /> {c.assignmentCount} assignments
                </span>
              </div>
              <p className="mt-4 flex items-center gap-1 text-sm font-semibold text-brand-ink">
                Open course <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
