"use client";

import Link from "next/link";
import { useState } from "react";
import { Alert, Badge, Button, Card, Textarea } from "@/components/ui";
import { SubmissionBadge } from "@/components/status";
import { ScoreRing } from "@/components/visuals";
import { useToast } from "@/components/toast";
import { Ban, Check, File, Sparkle, Zip } from "@/components/icons";
import type { Assignment, CriterionScore, Student, StudentAssignment, Submission } from "@/lib/types";
import { cn, formatBytes, formatDate } from "@/lib/format";

export function EvaluationReview({
  submission,
  sa,
  assignment,
  student,
}: {
  submission: Submission;
  sa: StudentAssignment;
  assignment: Assignment;
  student: Student;
}) {
  const toast = useToast();
  const ev = submission.evaluation;
  const [criteria, setCriteria] = useState<CriterionScore[]>(ev?.criteria ?? assignment.rubric.map((r) => ({ criterion: r.criterion, maxMarks: r.maxMarks, aiMarks: 0, finalMarks: 0, comment: "" })));
  const [feedback, setFeedback] = useState(ev?.feedback ?? "");
  const [approved, setApproved] = useState(ev?.status === "APPROVED");
  const [tab, setTab] = useState<"scenario" | "evidence">("evidence");

  const total = criteria.reduce((s, c) => s + (Number.isFinite(c.finalMarks) ? c.finalMarks : 0), 0);
  const aiTotal = ev?.aiTotal ?? 0;
  const edited = criteria.some((c) => c.finalMarks !== c.aiMarks);
  const invalid = criteria.some((c) => c.finalMarks < 0 || c.finalMarks > c.maxMarks || !Number.isFinite(c.finalMarks));

  function setMark(i: number, value: string) {
    const n = value === "" ? NaN : Number(value);
    setCriteria((cs) => cs.map((c, j) => (j === i ? { ...c, finalMarks: n } : c)));
    setApproved(false);
  }

  function approve() {
    // Phase 5: POST /api/submissions/:id/evaluation { criteria, feedback, approve: true } → audit-logged.
    setApproved(true);
    toast(`Marks approved for ${student.name}: ${total} / ${assignment.totalMarks}`);
  }

  return (
    <div>
      <nav className="mb-2 text-sm text-ink-subtle" aria-label="Breadcrumb">
        <Link href="/faculty/submissions" className="hover:text-ink">
          Submissions
        </Link>{" "}
        / <span className="font-mono">{student.enrollmentNo}</span>
      </nav>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">{student.name}</h1>
          <p className="mt-1 text-ink-muted">
            {assignment.title} · <span className="font-mono">{sa.version}</span> · submitted {formatDate(submission.submittedAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SubmissionBadge status={submission.status} />
          {approved ? <Badge tone="green">Approved</Badge> : <Badge tone="amber">Provisional</Badge>}
        </div>
      </div>

      {submission.reviewReason && (
        <div className="mb-6">
          <Alert tone="amber" title="Flagged for manual review">
            {submission.reviewReason}
          </Alert>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        {/* Left: what the student submitted */}
        <div className="min-w-0 space-y-6">
          <Card>
            <h2 className="font-semibold">Submitted files</h2>
            <div className="mt-3 flex items-center gap-3 rounded-xl bg-surface-muted p-3">
              <Zip className="h-5 w-5 shrink-0 text-brand-ink" />
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{submission.fileName}</span>
              <span className="text-xs text-ink-subtle">{formatBytes(submission.sizeBytes)}</span>
            </div>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {submission.files.map((f) => (
                <li key={f} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm ring-1 ring-line">
                  <File className="h-4 w-4 text-ink-subtle" /> {f}
                </li>
              ))}
              {submission.rejectedFiles?.map((f) => (
                <li key={f} className="flex items-center gap-2 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
                  <Ban className="h-4 w-4" /> {f} <span className="ml-auto text-xs">blocked</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <div className="mb-4 inline-flex rounded-xl bg-surface-muted p-1">
              {(
                [
                  ["evidence", "AI evidence"],
                  ["scenario", "Student's version"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={cn("rounded-lg px-3.5 py-1.5 text-sm font-semibold", tab === id ? "bg-surface shadow-soft" : "text-ink-muted")}
                  aria-pressed={tab === id}
                >
                  {label}
                </button>
              ))}
            </div>
            {tab === "evidence" ? (
              ev?.evidence.length ? (
                <ul className="space-y-2">
                  {ev.evidence.map((e) => (
                    <li key={e} className="flex gap-3 rounded-xl bg-surface-muted p-3 text-sm">
                      <Sparkle className="mt-0.5 h-4 w-4 shrink-0 text-brand-ink" />
                      <span className="font-mono text-xs leading-relaxed text-ink">{e}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-ink-muted">No evidence recorded.</p>
              )
            ) : (
              <div className="space-y-4">
                <p className="text-sm leading-relaxed">{sa.scenario}</p>
                <ol className="space-y-2">
                  {sa.questions.map((q) => (
                    <li key={q.number} className="text-sm">
                      <span className="font-bold text-brand-ink">Q{q.number}</span> <span className="text-ink-subtle">({q.marks})</span> {q.text}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </Card>
        </div>

        {/* Right: marking panel */}
        <div className="lg:sticky lg:top-10 lg:self-start">
          <div className="overflow-hidden rounded-2xl bg-surface shadow-soft ring-1 ring-line">
            <div className="flex items-center gap-4 border-b border-line p-5">
              <ScoreRing value={total} max={assignment.totalMarks} size={72} stroke={8} label />
              <div>
                <p className="text-sm font-semibold">Total</p>
                <p className="text-xs text-ink-subtle">
                  AI suggested {aiTotal} / {assignment.totalMarks}
                  {edited && <span className="ml-1 font-semibold text-accent">· edited</span>}
                </p>
              </div>
            </div>

            <div className="divide-y divide-line">
              {criteria.map((c, i) => {
                const bad = c.finalMarks < 0 || c.finalMarks > c.maxMarks || !Number.isFinite(c.finalMarks);
                return (
                  <div key={c.criterion} className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <label htmlFor={`m${i}`} className="text-sm font-medium">
                        {c.criterion}
                      </label>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <input
                          id={`m${i}`}
                          type="number"
                          inputMode="decimal"
                          min={0}
                          max={c.maxMarks}
                          step={0.5}
                          value={Number.isFinite(c.finalMarks) ? c.finalMarks : ""}
                          onChange={(e) => setMark(i, e.target.value)}
                          aria-invalid={bad}
                          className={cn(
                            "h-9 w-16 rounded-lg bg-surface px-2 text-center font-semibold tabular-nums ring-1 focus:ring-2 focus:outline-none",
                            bad ? "text-danger ring-danger" : c.finalMarks !== c.aiMarks ? "ring-accent focus:ring-accent" : "ring-line focus:ring-ring",
                          )}
                        />
                        <span className="text-sm text-ink-subtle">/ {c.maxMarks}</span>
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-ink-subtle">
                      AI: {c.aiMarks}
                      {c.comment && ` · ${c.comment}`}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-line p-5">
              <label htmlFor="feedback" className="text-sm font-medium">
                Feedback to student
              </label>
              <Textarea
                id="feedback"
                rows={5}
                value={feedback}
                onChange={(e) => {
                  setFeedback(e.target.value);
                  setApproved(false);
                }}
                className="mt-1.5"
              />
              {invalid && <p className="mt-2 text-xs text-danger">Each mark must be between 0 and its maximum.</p>}
              <div className="mt-4 flex gap-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    setCriteria((cs) => cs.map((c) => ({ ...c, finalMarks: c.aiMarks })));
                    setFeedback(ev?.feedback ?? "");
                    setApproved(false);
                  }}
                  disabled={!edited}
                >
                  Reset to AI
                </Button>
                <Button className="flex-1" onClick={approve} disabled={invalid || approved}>
                  <Check className="h-4 w-4" /> {approved ? "Approved" : "Approve marks"}
                </Button>
              </div>
              <p className="mt-3 text-xs text-ink-subtle">Approving publishes marks and feedback to the student. Every change is recorded in the audit log.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
