"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Alert, Badge, Button, ButtonLink, Card, Textarea } from "@/components/ui";
import { SubmissionBadge } from "@/components/status";
import { ScoreRing } from "@/components/visuals";
import { useToast } from "@/components/toast";
import { Ban, Check, Download, File, Refresh, Sparkle, Zip } from "@/components/icons";
import type { Question, SubmissionStatus } from "@/lib/types";
import { cn, formatBytes, formatDate } from "@/lib/format";
import { rerunEvaluationAction, saveEvaluationAction } from "@/lib/server/evaluation-actions";

interface Criterion {
  id: string;
  criterion: string;
  maxMarks: number;
  aiMarks: number;
  finalMarks: number;
  comment: string;
}

export function EvaluationReview({
  submission,
  student,
  assignment,
  evaluation: ev,
}: {
  submission: {
    id: string;
    fileName: string;
    sizeBytes: number;
    submittedAt: string;
    status: SubmissionStatus;
    files: string[];
    rejected: string[];
    extractedText: string;
    reviewReason: string | null;
    hasFile: boolean;
    isLatest: boolean;
    history: { id: string; submittedAt: string }[];
  };
  student: { name: string; enrollmentNo: string };
  assignment: { title: string; code: string; totalMarks: number; version: string; scenario: string; questions: Question[] };
  evaluation: { aiTotal: number; status: "PROVISIONAL" | "APPROVED"; feedback: string; aiFeedback: string; evidence: string[]; criteria: Criterion[] } | null;
}) {
  const toast = useToast();
  const router = useRouter();
  const [criteria, setCriteria] = useState<Criterion[]>(ev?.criteria ?? []);
  const [feedback, setFeedback] = useState(ev?.feedback ?? "");
  const [tab, setTab] = useState<"evidence" | "content" | "scenario">("evidence");
  const [pending, startTransition] = useTransition();
  const approved = ev?.status === "APPROVED";

  const total = criteria.reduce((s, c) => s + (Number.isFinite(c.finalMarks) ? c.finalMarks : 0), 0);
  const edited = criteria.some((c) => c.finalMarks !== c.aiMarks);
  const dirty = Boolean(ev) && (criteria.some((c, i) => c.finalMarks !== ev!.criteria[i].finalMarks) || feedback !== ev!.feedback);
  const invalid = criteria.some((c) => !Number.isFinite(c.finalMarks) || c.finalMarks < 0 || c.finalMarks > c.maxMarks || Math.round(c.finalMarks * 2) !== c.finalMarks * 2);
  const evaluating = submission.status === "QUEUED" || submission.status === "EVALUATING";

  function setMark(i: number, value: string) {
    const n = value === "" ? NaN : Number(value);
    setCriteria((cs) => cs.map((c, j) => (j === i ? { ...c, finalMarks: n } : c)));
  }

  function save(approve: boolean) {
    startTransition(async () => {
      const res = await saveEvaluationAction(submission.id, { criteria: criteria.map((c) => ({ id: c.id, finalMarks: c.finalMarks })), feedback, approve });
      if (!res.ok) return toast(res.error, "error");
      toast(approve ? `Marks approved for ${student.name}: ${res.total} / ${assignment.totalMarks}` : "Changes saved");
      router.refresh();
    });
  }

  function rerun() {
    startTransition(async () => {
      const res = await rerunEvaluationAction(submission.id);
      if (!res.ok) return toast(res.error, "error");
      toast("Evaluation queued again");
      router.refresh();
    });
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
            {assignment.code} · {assignment.title} · <span className="font-mono">{assignment.version}</span> · submitted {formatDate(submission.submittedAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SubmissionBadge status={submission.status} />
          {ev && (approved ? <Badge tone="green">Approved</Badge> : <Badge tone="amber">Provisional</Badge>)}
        </div>
      </div>

      {!submission.isLatest && (
        <div className="mb-6">
          <Alert tone="blue">
            This is an older submission.{" "}
            <Link href={`/faculty/submissions/${submission.history[0].id}`} className="font-semibold underline">
              Open the latest one
            </Link>
            .
          </Alert>
        </div>
      )}
      {submission.reviewReason && (
        <div className="mb-6">
          <Alert tone="amber" title="Flagged for review">
            {submission.reviewReason}
          </Alert>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        <div className="min-w-0 space-y-6">
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-semibold">Submitted files</h2>
              {submission.hasFile && (
                <a href={`/api/faculty/submissions/${submission.id}/file`} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-ink hover:underline">
                  <Download className="h-4 w-4" /> Original ZIP
                </a>
              )}
            </div>
            <div className="mt-3 flex items-center gap-3 rounded-xl bg-surface-muted p-3">
              <Zip className="h-5 w-5 shrink-0 text-brand-ink" />
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{submission.fileName}</span>
              <span className="text-xs text-ink-subtle">{formatBytes(submission.sizeBytes)}</span>
            </div>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {submission.files.map((f) => (
                <li key={f} className="flex min-w-0 items-center gap-2 rounded-lg px-3 py-2 text-sm ring-1 ring-line">
                  <File className="h-4 w-4 shrink-0 text-ink-subtle" /> <span className="truncate">{f}</span>
                </li>
              ))}
              {submission.rejected.map((f) => (
                <li key={f} className="flex min-w-0 items-center gap-2 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger sm:col-span-2">
                  <Ban className="h-4 w-4 shrink-0" /> <span className="truncate">{f}</span>
                </li>
              ))}
            </ul>
            {submission.history.length > 1 && (
              <p className="mt-4 text-xs text-ink-subtle">
                {submission.history.length} submissions in total ·{" "}
                {submission.history.map((h, i) => (
                  <span key={h.id}>
                    {i > 0 && " · "}
                    {h.id === submission.id ? (
                      <span className="font-semibold text-ink">{formatDate(h.submittedAt)}</span>
                    ) : (
                      <Link href={`/faculty/submissions/${h.id}`} className="underline">
                        {formatDate(h.submittedAt)}
                      </Link>
                    )}
                  </span>
                ))}
              </p>
            )}
          </Card>

          <Card>
            <div className="mb-4 inline-flex flex-wrap rounded-xl bg-surface-muted p-1">
              {(
                [
                  ["evidence", "Evaluation evidence"],
                  ["content", "Submitted text"],
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
            {tab === "evidence" &&
              (ev?.evidence.length ? (
                <ul className="space-y-2">
                  {ev.evidence.map((e) => (
                    <li key={e} className="flex gap-3 rounded-xl bg-surface-muted p-3 text-sm">
                      <Sparkle className="mt-0.5 h-4 w-4 shrink-0 text-brand-ink" />
                      <span className="text-xs leading-relaxed text-ink">{e}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-ink-muted">{evaluating ? "Evaluation in progress…" : "No evidence recorded."}</p>
              ))}
            {tab === "content" && (
              <pre className="max-h-[480px] overflow-auto rounded-xl bg-surface-muted p-4 text-xs leading-relaxed whitespace-pre-wrap text-ink">
                {submission.extractedText || "No readable text was extracted."}
              </pre>
            )}
            {tab === "scenario" && (
              <div className="space-y-4">
                <p className="text-sm leading-relaxed">{assignment.scenario}</p>
                <ol className="space-y-2">
                  {assignment.questions.map((q) => (
                    <li key={q.number} className="text-sm">
                      <span className="font-bold text-brand-ink">Q{q.number}</span> <span className="text-ink-subtle">({q.marks})</span> {q.text}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </Card>
        </div>

        <div className="lg:sticky lg:top-10 lg:self-start">
          {!ev ? (
            <Card className="text-center">
              <span className="mx-auto flex h-14 w-14 animate-pulse items-center justify-center rounded-2xl bg-brand-soft text-brand-ink">
                <Sparkle className="h-7 w-7" />
              </span>
              <p className="mt-4 font-semibold">{evaluating ? "Evaluating…" : "No evaluation yet"}</p>
              <p className="mt-1 text-sm text-ink-muted">
                {evaluating ? "This page updates automatically." : "The automatic evaluation didn't finish."}
              </p>
              {!evaluating && submission.hasFile && (
                <Button className="mt-4" onClick={rerun} disabled={pending}>
                  <Refresh className="h-4 w-4" /> Run evaluation again
                </Button>
              )}
            </Card>
          ) : (
            <div className="overflow-hidden rounded-2xl bg-surface shadow-soft ring-1 ring-line">
              <div className="flex items-center gap-4 border-b border-line p-5">
                <ScoreRing value={total} max={assignment.totalMarks} size={72} stroke={8} label />
                <div>
                  <p className="text-sm font-semibold">Total</p>
                  <p className="text-xs text-ink-subtle">
                    AI suggested {ev.aiTotal} / {assignment.totalMarks}
                    {edited && <span className="ml-1 font-semibold text-accent">· edited</span>}
                  </p>
                </div>
              </div>

              <div className="divide-y divide-line">
                {criteria.map((c, i) => {
                  const bad = !Number.isFinite(c.finalMarks) || c.finalMarks < 0 || c.finalMarks > c.maxMarks;
                  return (
                    <div key={c.id} className="p-5">
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
                            disabled={!submission.isLatest}
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
                <Textarea id="feedback" rows={5} value={feedback} onChange={(e) => setFeedback(e.target.value)} className="mt-1.5" maxLength={4000} disabled={!submission.isLatest} />
                {invalid && <p className="mt-2 text-xs text-danger">Each mark must be between 0 and its maximum, in steps of 0.5.</p>}
                {submission.isLatest && (
                  <>
                    <div className="mt-4 flex gap-2">
                      <Button
                        variant="secondary"
                        className="flex-1"
                        onClick={() => setCriteria((cs) => cs.map((c) => ({ ...c, finalMarks: c.aiMarks })))}
                        disabled={!edited || pending}
                      >
                        Reset to AI
                      </Button>
                      {approved ? (
                        <Button className="flex-1" onClick={() => save(false)} disabled={invalid || !dirty || pending}>
                          {pending ? "Saving…" : "Update marks"}
                        </Button>
                      ) : (
                        <Button className="flex-1" onClick={() => save(true)} disabled={invalid || pending || evaluating}>
                          <Check className="h-4 w-4" /> {pending ? "Saving…" : "Approve marks"}
                        </Button>
                      )}
                    </div>
                    {!approved && (
                      <div className="mt-2 flex gap-2">
                        <Button variant="ghost" className="flex-1 text-xs" onClick={() => save(false)} disabled={invalid || !dirty || pending}>
                          Save without approving
                        </Button>
                        {submission.hasFile && (
                          <Button variant="ghost" className="flex-1 text-xs" onClick={rerun} disabled={pending || evaluating}>
                            <Refresh className="h-4 w-4" /> Re-run AI
                          </Button>
                        )}
                      </div>
                    )}
                  </>
                )}
                <p className="mt-3 text-xs text-ink-subtle">
                  {approved
                    ? "These marks are published to the student. Changes are recorded in the audit log."
                    : "Approving publishes marks and feedback to the student. Every change is recorded in the audit log."}
                </p>
                {approved && (
                  <ButtonLink href="/faculty/submissions" variant="ghost" className="mt-2 w-full">
                    Back to submissions
                  </ButtonLink>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
