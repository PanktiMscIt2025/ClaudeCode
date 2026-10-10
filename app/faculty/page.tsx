import Link from "next/link";
import { ButtonLink, Card, CardTitle, StatCard } from "@/components/ui";
import { ReviewTable } from "@/components/review-table";
import { AutoRefresh } from "@/components/auto-refresh";
import { Alert as AlertIcon, ArrowRight, Book, Check, Download, Folder, Sparkle, Users } from "@/components/icons";
import { db } from "@/lib/server/db";
import { requireUser } from "@/lib/server/auth";
import { getReviewRows } from "@/lib/server/faculty-data";
import { cn } from "@/lib/format";

export default async function FacultyDashboard() {
  const user = await requireUser("FACULTY");
  const [rows, courseCount, studentCount, assignmentCount, firstCourse] = await Promise.all([
    getReviewRows(user.id),
    db.course.count({ where: { facultyId: user.id } }),
    db.user.count({ where: { role: "STUDENT", enrollments: { some: { course: { facultyId: user.id } } } } }),
    db.assignment.count({ where: { status: "PUBLISHED", course: { facultyId: user.id } } }),
    db.course.findFirst({ where: { facultyId: user.id }, orderBy: { createdAt: "asc" }, include: { syllabus: { select: { id: true } }, _count: { select: { students: true, assignments: true } } } }),
  ]);

  const submitted = rows.filter((r) => r.status !== "NOT_SUBMITTED").length;
  const evaluated = rows.filter((r) => r.score !== null).length;
  const toReview = rows.filter((r) => r.status === "NEEDS_REVIEW" || r.status === "FAILED" || r.reviewStatus === "PROVISIONAL").length;
  const approved = rows.filter((r) => r.reviewStatus === "APPROVED");
  const avg = approved.length ? (approved.reduce((s, r) => s + (r.score ?? 0), 0) / approved.length).toFixed(1) : "—";
  const hour = Number(new Date().toLocaleString("en-IN", { hour: "numeric", hour12: false, timeZone: "Asia/Kolkata" }));
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const steps = [
    { done: courseCount > 0, label: "Create a course", href: "/faculty/courses", icon: Folder },
    { done: (firstCourse?._count.students ?? 0) > 0, label: "Import students from Excel", href: firstCourse ? `/faculty/courses/${firstCourse.id}/import` : "/faculty/courses", icon: Users },
    { done: Boolean(firstCourse?.syllabus), label: "Upload the syllabus", href: firstCourse ? `/faculty/courses/${firstCourse.id}/syllabus` : "/faculty/courses", icon: Book },
    { done: assignmentCount > 0, label: "Generate & publish an assignment", href: firstCourse ? `/faculty/courses/${firstCourse.id}/assignments` : "/faculty/courses", icon: Sparkle },
  ];
  const onboarding = steps.some((s) => !s.done);

  return (
    <div className="space-y-8">
      <AutoRefresh active={rows.some((r) => r.status === "QUEUED" || r.status === "EVALUATING")} ms={5000} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-ink-subtle">{greeting},</p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">{user.name}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href="/faculty/export" variant="secondary">
            <Download className="h-4 w-4" /> Export marks
          </ButtonLink>
          <ButtonLink href={firstCourse ? `/faculty/courses/${firstCourse.id}/assignments` : "/faculty/courses"}>
            <Sparkle className="h-4 w-4" /> New assignment
          </ButtonLink>
        </div>
      </div>

      {onboarding && (
        <Card>
          <CardTitle>Get started</CardTitle>
          <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <li key={s.label}>
                <Link
                  href={s.href}
                  className={cn("flex h-full items-center gap-3 rounded-2xl p-4 ring-1 transition-shadow hover:shadow-soft", s.done ? "bg-mint-soft ring-mint/20" : "bg-surface ring-line")}
                >
                  <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold", s.done ? "bg-mint text-white" : "bg-brand-soft text-brand-ink")}>
                    {s.done ? <Check className="h-4 w-4" /> : i + 1}
                  </span>
                  <span className={cn("text-sm font-semibold", s.done && "text-mint")}>{s.label}</span>
                </Link>
              </li>
            ))}
          </ol>
        </Card>
      )}

      {toReview > 0 && (
        <Link href="/faculty/submissions" className="group flex items-center gap-4 rounded-2xl bg-sun-soft p-4 ring-1 ring-sun/20 transition-shadow hover:shadow-soft">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface text-sun">
            <AlertIcon className="h-5 w-5" />
          </span>
          <p className="flex-1 text-sm">
            <span className="font-semibold text-ink">
              {toReview} evaluation{toReview === 1 ? " needs" : "s need"} your review.
            </span>{" "}
            <span className="text-ink-muted">AI marks stay provisional and hidden from students until you approve them.</span>
          </p>
          <ArrowRight className="h-5 w-5 text-sun transition-transform group-hover:translate-x-1" />
        </Link>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Students" value={studentCount} hint={`in ${courseCount} course${courseCount === 1 ? "" : "s"}`} />
        <StatCard label="Assignments" value={assignmentCount} hint="published" />
        <StatCard label="Submitted" value={submitted} hint={`of ${rows.length} issued versions`} />
        <StatCard label="Pending" value={rows.length - submitted} hint="not yet submitted" />
        <StatCard label="Evaluated" value={evaluated} />
        <StatCard label="Needs review" value={toReview} tone={toReview ? "amber" : undefined} />
        <StatCard label="Approved" value={approved.length} />
        <StatCard label="Average approved" value={avg} hint="marks" />
      </div>

      <Card>
        <CardTitle
          action={
            <Link href="/faculty/submissions" className="text-sm font-semibold text-brand-ink hover:underline">
              View all
            </Link>
          }
        >
          Student marks
        </CardTitle>
        {rows.length === 0 ? (
          <p className="text-sm text-ink-muted">Marks appear here once you publish an assignment and students submit.</p>
        ) : (
          <ReviewTable rows={rows} />
        )}
      </Card>
    </div>
  );
}

