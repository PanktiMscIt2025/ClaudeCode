"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Alert, Badge, Button, Card, CardTitle } from "@/components/ui";
import { AssignmentBadge } from "@/components/status";
import { Modal } from "@/components/modal";
import { useToast } from "@/components/toast";
import { Check, Eye, Refresh, Sparkle } from "@/components/icons";
import type { AssignmentStatus, Question, RubricCriterion } from "@/lib/types";
import { cn, formatDate } from "@/lib/format";
import { deleteAssignmentAction, generateMissingAction, publishAssignmentAction, regenerateVersionAction } from "@/lib/server/assignment-actions";

export interface VersionView {
  id: string;
  version: string;
  studentName: string;
  enrollmentNo: string;
  title: string;
  domain: string;
  scenario: string;
  questions: Question[];
  instructions: string;
  answers: { question: number; answer: string; keyPoints: string[] }[];
  similarity: number;
}

interface AssignmentInfo {
  id: string;
  code: string;
  title: string;
  status: AssignmentStatus;
  difficulty: string;
  questionCount: number;
  totalMarks: number;
  dueAt: string;
  topics: string[];
  rubric: RubricCriterion[];
  generator: string;
  progress: number;
  error: string | null;
}

export function ReviewBoard({
  assignment: a,
  studentCount,
  versions,
  similarityLimit,
}: {
  assignment: AssignmentInfo;
  studentCount: number;
  versions: VersionView[];
  similarityLimit: number;
}) {
  const toast = useToast();
  const router = useRouter();
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmPublish, setConfirmPublish] = useState(false);
  const [, startTransition] = useTransition();

  const flagged = versions.filter((v) => v.similarity > similarityLimit).length;
  const missing = Math.max(0, studentCount - versions.length);
  const editable = a.status === "REVIEW";

  function run(key: string, fn: () => Promise<{ ok: true } | { ok: false; error: string }>, success: string, after?: () => void) {
    setBusy(key);
    startTransition(async () => {
      const res = await fn();
      setBusy(null);
      if (!res.ok) return toast(res.error, "error");
      toast(success);
      after?.();
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-bold text-brand-ink">{a.code}</span>
            <AssignmentBadge status={a.status} />
            {a.generator === "offline" && <Badge tone="gray">offline generator</Badge>}
          </div>
          <h2 className="mt-2 font-display text-2xl font-bold">{a.title}</h2>
          <p className="text-sm text-ink-muted">
            {a.difficulty.toLowerCase()} · {a.questionCount} questions · {a.totalMarks} marks · due {formatDate(a.dueAt)}
          </p>
          <p className="mt-1 text-sm text-ink-subtle">{a.topics.join(" · ")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {a.status !== "PUBLISHED" && a.status !== "GENERATING" && (
            <Button variant="ghost" disabled={!!busy} onClick={() => run("delete", () => deleteAssignmentAction(a.id), "Draft deleted", () => router.push("."))}>
              Delete draft
            </Button>
          )}
          {missing > 0 && a.status !== "GENERATING" && (
            <Button variant="secondary" disabled={!!busy} onClick={() => run("missing", () => generateMissingAction(a.id), "Generating missing versions")}>
              <Sparkle className="h-4 w-4" /> Generate {missing} missing
            </Button>
          )}
          {editable && (
            <Button disabled={flagged > 0 || versions.length === 0 || !!busy} onClick={() => setConfirmPublish(true)}>
              <Check className="h-4 w-4" /> Publish to students
            </Button>
          )}
        </div>
      </div>

      {a.status === "GENERATING" && (
        <Card className="text-center">
          <span className="mx-auto flex h-14 w-14 animate-pulse items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-accent text-white">
            <Sparkle className="h-7 w-7" />
          </span>
          <h3 className="mt-4 font-display text-xl font-bold">Writing unique scenarios…</h3>
          <p className="mt-1 text-sm text-ink-muted">
            {a.progress} of {studentCount} versions ready. They are written in small batches to keep AI costs low; you can leave this page.
          </p>
          <div className="mx-auto mt-5 h-2 max-w-md overflow-hidden rounded-full bg-surface-muted">
            <div className="h-full rounded-full bg-gradient-to-r from-brand to-accent transition-all duration-500" style={{ width: `${Math.min(100, (a.progress / Math.max(studentCount, 1)) * 100)}%` }} />
          </div>
        </Card>
      )}

      {a.error && <Alert tone="red" title="Generation problem">{a.error}</Alert>}
      {a.status === "PUBLISHED" && missing > 0 && (
        <Alert tone="blue">{missing} student(s) joined after generation. Versions you generate now become visible to them immediately.</Alert>
      )}
      {flagged > 0 && editable && (
        <Alert tone="amber" title={`${flagged} version${flagged > 1 ? "s are" : " is"} too similar to another`}>
          Regenerate the flagged versions so that every student gets a distinct scenario. Publishing is blocked until then.
        </Alert>
      )}

      {a.rubric.length > 0 && (
        <Card>
          <CardTitle action={<span className="text-xs text-ink-subtle">Shared by every version</span>}>Rubric</CardTitle>
          <ul className="grid gap-3 sm:grid-cols-2">
            {a.rubric.map((r) => (
              <li key={r.criterion} className="flex items-start justify-between gap-3 rounded-xl bg-surface-muted p-3">
                <div>
                  <p className="text-sm font-semibold">{r.criterion}</p>
                  <p className="text-xs text-ink-muted">{r.description}</p>
                </div>
                <span className="font-display text-lg font-bold tabular-nums">{r.maxMarks}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {versions.map((v) => {
          const tooSimilar = v.similarity > similarityLimit;
          return (
            <Card key={v.id} className={cn("flex flex-col", tooSimilar && "ring-2 ring-sun")}>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-sm font-bold text-brand-ink">{v.version}</span>
                <Badge tone={tooSimilar ? "amber" : "green"}>{Math.round(v.similarity * 100)}% similar</Badge>
              </div>
              <p className="mt-1 text-xs text-ink-subtle">
                {v.studentName} · {v.enrollmentNo}
              </p>
              {v.title && <p className="mt-3 text-sm font-semibold">{v.title}</p>}
              <p className="mt-1 line-clamp-4 text-sm leading-relaxed text-ink-muted">{v.scenario}</p>
              <div className="mt-auto flex gap-2 pt-4">
                <Button variant="secondary" className="h-9 flex-1 text-xs" onClick={() => setOpen(v.id)}>
                  <Eye className="h-4 w-4" /> Preview
                </Button>
                {editable && (
                  <Button
                    variant={tooSimilar ? "primary" : "ghost"}
                    className="h-9 text-xs"
                    disabled={!!busy}
                    onClick={() => run(v.id, () => regenerateVersionAction(v.id), `${v.version} regenerated`)}
                  >
                    <Refresh className={cn("h-4 w-4", busy === v.id && "animate-spin")} /> {busy === v.id ? "Working…" : "Regenerate"}
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {versions.map((v) => (
        <Modal key={v.id} open={open === v.id} onClose={() => setOpen(null)} title={`${v.version} · ${v.studentName}`}>
          <div className="max-h-[65vh] space-y-4 overflow-y-auto pr-1 text-sm">
            <p className="leading-relaxed">{v.scenario}</p>
            <ol className="space-y-3">
              {v.questions.map((q) => (
                <li key={q.number}>
                  <p>
                    <span className="font-bold text-brand-ink">Q{q.number}</span> <span className="text-ink-subtle">({q.marks} marks)</span> {q.text}
                  </p>
                  <p className="mt-1 text-xs text-mint">Deliverable: {q.deliverable}</p>
                </li>
              ))}
            </ol>
            <p className="rounded-xl bg-surface-muted p-3 text-xs text-ink-muted">{v.instructions}</p>
            <div>
              <p className="text-xs font-bold tracking-wide text-ink-subtle uppercase">Model solution (faculty only)</p>
              <ul className="mt-2 space-y-2">
                {v.answers.map((ans) => (
                  <li key={ans.question} className="rounded-xl ring-1 ring-line p-3">
                    <p className="font-semibold">Q{ans.question}</p>
                    <p className="mt-1 text-ink-muted">{ans.answer}</p>
                    {ans.keyPoints?.length > 0 && (
                      <ul className="mt-2 list-disc space-y-0.5 pl-5 text-xs text-ink-muted">
                        {ans.keyPoints.map((k) => (
                          <li key={k}>{k}</li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Modal>
      ))}

      <Modal open={confirmPublish} onClose={() => setConfirmPublish(false)} title="Publish to students?">
        <p className="text-sm text-ink-muted">
          Each of the {versions.length} students will see their own version immediately. Published versions are saved exactly as issued and can no
          longer be regenerated.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmPublish(false)}>
            Cancel
          </Button>
          <Button
            disabled={!!busy}
            onClick={() => run("publish", () => publishAssignmentAction(a.id), `Published to ${versions.length} students`, () => setConfirmPublish(false))}
          >
            <Check className="h-4 w-4" /> Publish
          </Button>
        </div>
      </Modal>
    </div>
  );
}
