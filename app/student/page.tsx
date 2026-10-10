import Link from "next/link";
import type { ComponentType, SVGProps } from "react";
import { Badge, ButtonLink, Card } from "@/components/ui";
import { ProgressSteps, ScoreRing } from "@/components/visuals";
import { ArrowRight, Book, Chart, Clock, History, Key, Upload } from "@/components/icons";
import { demoCurrentStudent, studentView } from "@/lib/demo-data";
import { studentStep, studentSteps, studentStatusText } from "@/lib/student-status";
import { cn, dueLabel, formatDate } from "@/lib/format";

export default function StudentHome() {
  const student = demoCurrentStudent;
  const views = studentView(student.id);
  const current = views[0];
  const published = views.find((v) => v.latest?.evaluation?.status === "APPROVED");
  const due = current ? dueLabel(current.assignment.dueAt) : null;
  const step = studentStep(current?.latest);

  return (
    <div className="space-y-8">
      <div className="animate-rise">
        <p className="text-sm font-semibold text-ink-subtle">{student.enrollmentNo}</p>
        <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Hi {student.name.split(" ")[0]} 👋</h1>
        <p className="mt-1 text-ink-muted">Here&apos;s where things stand.</p>
      </div>

      {current ? (
        <section className="relative overflow-hidden rounded-3xl bg-surface shadow-lift ring-1 ring-line">
          <div className="h-1.5 bg-gradient-to-r from-brand via-[#9b5cf0] to-accent" />
          <div className="p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="blue">Current assignment</Badge>
              {due && (
                <Badge tone={due.closed ? "gray" : due.urgent ? "red" : "amber"}>
                  <Clock className="h-3.5 w-3.5" />
                  {due.text}
                </Badge>
              )}
            </div>
            <h2 className="mt-4 font-display text-2xl leading-tight font-bold sm:text-3xl">{current.assignment.title}</h2>
            <p className="mt-2 line-clamp-2 max-w-2xl text-ink-muted">{current.sa.scenario}</p>
            <p className="mt-2 text-xs text-ink-subtle">
              Your version: <span className="font-semibold text-ink-muted">{current.sa.version}</span> · Due {formatDate(current.assignment.dueAt)}
            </p>

            <div className="mt-8 max-w-xl">
              <ProgressSteps steps={studentSteps} current={step} />
            </div>

            <div className="mt-8 flex flex-col gap-3 rounded-2xl bg-surface-muted p-4 sm:flex-row sm:items-center">
              <p className="flex-1 text-sm">
                <span className="text-ink-subtle">Status: </span>
                <span className="font-semibold">{studentStatusText(current.latest)}</span>
              </p>
              {current.latest ? (
                <ButtonLink href="/student/history" variant="secondary">
                  View submission
                </ButtonLink>
              ) : (
                <ButtonLink href="/student/submit">
                  <Upload className="h-4 w-4" /> Upload ZIP
                </ButtonLink>
              )}
              <ButtonLink href="/student/assignment" variant={current.latest ? "primary" : "secondary"}>
                Open assignment <ArrowRight className="h-4 w-4" />
              </ButtonLink>
            </div>
          </div>
        </section>
      ) : (
        <Card>
          <p className="font-display text-lg font-bold">No assignment yet</p>
          <p className="mt-1 text-ink-muted">Your teacher hasn&apos;t published an assignment for you. Check back later.</p>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.2fr_1fr]">
        <div className="grid min-w-0 grid-cols-2 gap-3 sm:gap-4">
          <QuickLink href="/student/assignment" icon={Book} title="Read scenario" body="Questions & instructions" tone="bg-brand-soft text-brand-ink" />
          <QuickLink href="/student/submit" icon={Upload} title="Submit work" body="Upload one ZIP file" tone="bg-mint-soft text-mint" />
          <QuickLink href="/student/history" icon={History} title="History" body="All your uploads" tone="bg-sun-soft text-sun" />
          <QuickLink href="/student/account" icon={Key} title="Password" body="Change your password" tone="bg-accent-soft text-accent" />
        </div>

        <Card className="flex flex-col">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">Latest marks</h2>
            <Chart className="h-5 w-5 text-ink-subtle" />
          </div>
          {published?.latest?.evaluation ? (
            <div className="mt-5 flex flex-1 items-center gap-5">
              <ScoreRing value={published.latest.evaluation.finalTotal} max={published.assignment.totalMarks} size={96} stroke={9} label />
              <div className="min-w-0">
                <p className="truncate font-semibold">{published.assignment.title}</p>
                <p className="mt-1 line-clamp-2 text-sm text-ink-muted">{published.latest.evaluation.feedback}</p>
                <Link href="/student/marks" className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand-ink hover:underline">
                  See full feedback <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-ink-muted">No marks published yet. They&apos;ll appear here after your teacher reviews them.</p>
          )}
        </Card>
      </div>
    </div>
  );
}

function QuickLink({
  href,
  icon: Icon,
  title,
  body,
  tone,
}: {
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  body: string;
  tone: string;
}) {
  return (
    <Link
      href={href}
      className="group min-w-0 rounded-2xl bg-surface p-4 shadow-soft ring-1 ring-line transition-all hover:-translate-y-0.5 hover:shadow-lift sm:p-5"
    >
      <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl", tone)}>
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-3 font-semibold">{title}</p>
      <p className="text-xs text-ink-subtle sm:text-sm">{body}</p>
    </Link>
  );
}
