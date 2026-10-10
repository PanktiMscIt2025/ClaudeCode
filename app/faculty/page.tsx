import Link from "next/link";
import { ButtonLink, Card, CardTitle, StatCard } from "@/components/ui";
import { ReviewTable } from "@/components/review-table";
import { Alert as AlertIcon, ArrowRight, Download, Plus, Sparkle } from "@/components/icons";
import { demoAssignments, demoFaculty, demoReviewRows, demoStudents } from "@/lib/demo-data";

export default function FacultyDashboard() {
  const rows = demoReviewRows;
  const submitted = rows.filter((r) => r.status !== "NOT_SUBMITTED").length;
  const evaluated = rows.filter((r) => r.status === "EVALUATED").length;
  const toReview = rows.filter((r) => r.status === "NEEDS_REVIEW" || r.reviewStatus === "PROVISIONAL").length;
  const scored = rows.filter((r) => r.score !== null);
  const avg = scored.length ? (scored.reduce((s, r) => s + (r.score ?? 0), 0) / scored.length).toFixed(1) : "—";
  const hour = Number(new Date().toLocaleString("en-IN", { hour: "numeric", hour12: false, timeZone: "Asia/Kolkata" }));
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-ink-subtle">{greeting},</p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">{demoFaculty.name}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href="/faculty/export" variant="secondary">
            <Download className="h-4 w-4" /> Export marks
          </ButtonLink>
          <ButtonLink href="/faculty/courses/c1/assignments">
            <Sparkle className="h-4 w-4" /> New assignment
          </ButtonLink>
        </div>
      </div>

      {toReview > 0 && (
        <Link
          href="/faculty/submissions"
          className="group flex items-center gap-4 rounded-2xl bg-sun-soft p-4 ring-1 ring-sun/20 transition-shadow hover:shadow-soft"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface text-sun">
            <AlertIcon className="h-5 w-5" />
          </span>
          <p className="flex-1 text-sm">
            <span className="font-semibold text-ink">{toReview} evaluations need your review.</span>{" "}
            <span className="text-ink-muted">AI marks stay provisional and hidden from students until you approve them.</span>
          </p>
          <ArrowRight className="h-5 w-5 text-sun transition-transform group-hover:translate-x-1" />
        </Link>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Students" value={demoStudents.length} />
        <StatCard label="Assignments" value={demoAssignments.length} />
        <StatCard label="Submitted" value={submitted} hint={`of ${rows.length} for current assignment`} />
        <StatCard label="Pending" value={rows.length - submitted} hint="not yet submitted" />
        <StatCard label="Evaluated" value={evaluated} />
        <StatCard label="Needs review" value={toReview} tone="amber" />
        <StatCard label="Average score" value={avg} hint="out of 30" />
        <Card className="flex flex-col justify-center gap-2 p-4 sm:p-5">
          <Link href="/faculty/courses" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-ink hover:underline">
            <Plus className="h-4 w-4" /> Create course
          </Link>
          <Link href="/faculty/courses/c1/import" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-ink hover:underline">
            <Plus className="h-4 w-4" /> Import students
          </Link>
        </Card>
      </div>

      <Card>
        <CardTitle
          action={
            <Link href="/faculty/submissions" className="text-sm font-semibold text-brand-ink hover:underline">
              View all
            </Link>
          }
        >
          Assignment 1 · DBMS (MSCIT-201)
        </CardTitle>
        <ReviewTable rows={rows} />
      </Card>
    </div>
  );
}
