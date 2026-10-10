"use client";

import { useState } from "react";
import { Alert, Badge, Button, Card, CardTitle, Field, Input } from "@/components/ui";
import { AssignmentBadge } from "@/components/status";
import { Segmented } from "@/components/segmented";
import { useToast } from "@/components/toast";
import { Check, Eye, Refresh, Sparkle, X } from "@/components/icons";
import type { Assignment, Difficulty, Student, StudentAssignment } from "@/lib/types";
import { cn, formatDate } from "@/lib/format";

interface Draft {
  student: Student;
  version: string;
  scenario: string;
  similarity: number; // highest similarity to any other version, 0–1
  questions: StudentAssignment["questions"];
}

export function AssignmentStudio({
  assignments,
  topics,
  students,
  sampleVersions,
}: {
  assignments: Assignment[];
  topics: string[];
  students: Student[];
  sampleVersions: StudentAssignment[];
}) {
  const toast = useToast();
  const [mode, setMode] = useState<"list" | "form" | "generating" | "review">("list");
  const [title, setTitle] = useState("Assignment 2: Transactions in Practice");
  const [picked, setPicked] = useState<Set<string>>(new Set(topics.slice(3, 5)));
  const [difficulty, setDifficulty] = useState<Difficulty>("MEDIUM");
  const [questionCount, setQuestionCount] = useState(3);
  const [totalMarks, setTotalMarks] = useState(30);
  const [dueAt, setDueAt] = useState("2026-11-05T18:00");
  const [progress, setProgress] = useState(0);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [openDraft, setOpenDraft] = useState<string | null>(null);

  async function generate() {
    setMode("generating");
    setProgress(0);
    // Phase 4: POST /api/assignments → background job generates versions in batches; UI polls status.
    for (let i = 1; i <= students.length; i++) {
      await new Promise((r) => setTimeout(r, 450));
      setProgress(i);
    }
    setDrafts(
      students.map((s, i) => {
        const sample = sampleVersions[i % sampleVersions.length];
        return {
          student: s,
          version: `A2-V${String(i + 1).padStart(2, "0")}`,
          scenario: sample.scenario,
          questions: sample.questions,
          similarity: [0.18, 0.22, 0.71][i % 3],
        };
      }),
    );
    setMode("review");
  }

  function regenerate(version: string) {
    setDrafts((d) => d.map((x) => (x.version === version ? { ...x, similarity: 0.15 } : x)));
    toast(`${version} regenerated`);
  }

  const flagged = drafts.filter((d) => d.similarity > 0.6).length;

  if (mode === "generating") {
    return (
      <Card className="mx-auto max-w-lg text-center">
        <span className="mx-auto flex h-16 w-16 animate-pulse items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-accent text-white">
          <Sparkle className="h-8 w-8" />
        </span>
        <h2 className="mt-5 font-display text-2xl font-bold">Writing unique scenarios…</h2>
        <p className="mt-1 text-sm text-ink-muted">
          {progress} of {students.length} versions ready. Each includes questions, a model solution, and a rubric.
        </p>
        <div className="mt-6 h-2 overflow-hidden rounded-full bg-surface-muted">
          <div className="h-full rounded-full bg-gradient-to-r from-brand to-accent transition-all duration-300" style={{ width: `${(progress / students.length) * 100}%` }} />
        </div>
        <p className="mt-4 text-xs text-ink-subtle">Generated in small batches to keep AI costs low. You can leave this page; we&apos;ll keep going.</p>
      </Card>
    );
  }

  if (mode === "review") {
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Badge tone="amber">Awaiting your review</Badge>
            <h2 className="mt-2 font-display text-2xl font-bold">{title}</h2>
            <p className="text-sm text-ink-muted">
              {drafts.length} versions · {difficulty.toLowerCase()} · {questionCount} questions · {totalMarks} marks
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setMode("form")}>
              Edit settings
            </Button>
            <Button
              disabled={flagged > 0}
              onClick={() => {
                toast(`Published to ${drafts.length} students`);
                setMode("list");
              }}
            >
              <Check className="h-4 w-4" /> Publish to students
            </Button>
          </div>
        </div>

        {flagged > 0 && (
          <Alert tone="amber" title={`${flagged} version${flagged > 1 ? "s are" : " is"} too similar to another`}>
            Regenerate flagged versions before publishing so that every student gets a distinct scenario.
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {drafts.map((d) => {
            const isOpen = openDraft === d.version;
            const tooSimilar = d.similarity > 0.6;
            return (
              <Card key={d.version} className={cn("flex flex-col", tooSimilar && "ring-2 ring-sun")}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-sm font-bold text-brand-ink">{d.version}</span>
                  <Badge tone={tooSimilar ? "amber" : "green"}>{Math.round(d.similarity * 100)}% similar</Badge>
                </div>
                <p className="mt-1 text-xs text-ink-subtle">
                  {d.student.name} · {d.student.enrollmentNo}
                </p>
                <p className={cn("mt-3 text-sm leading-relaxed text-ink", !isOpen && "line-clamp-3")}>{d.scenario}</p>
                {isOpen && (
                  <ol className="mt-4 space-y-2 border-t border-line pt-4">
                    {d.questions.map((q) => (
                      <li key={q.number} className="text-sm">
                        <span className="font-bold text-brand-ink">Q{q.number}</span> <span className="text-ink-subtle">({q.marks})</span> {q.text}
                      </li>
                    ))}
                    <li className="rounded-xl bg-surface-muted p-3 text-xs text-ink-muted">
                      Model solution and rubric are attached and visible only to faculty.
                    </li>
                  </ol>
                )}
                <div className="mt-auto flex gap-2 pt-4">
                  <Button variant="secondary" className="h-9 flex-1 text-xs" onClick={() => setOpenDraft(isOpen ? null : d.version)}>
                    <Eye className="h-4 w-4" /> {isOpen ? "Hide" : "Preview"}
                  </Button>
                  <Button variant={tooSimilar ? "primary" : "ghost"} className="h-9 text-xs" onClick={() => regenerate(d.version)}>
                    <Refresh className="h-4 w-4" /> Regenerate
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {mode === "form" ? (
        <Card>
          <CardTitle
            action={
              <button onClick={() => setMode("list")} className="rounded-lg p-1 text-ink-subtle hover:bg-surface-muted" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            }
          >
            Generate a new assignment
          </CardTitle>
          <div className="space-y-6">
            <Field id="title" label="Title">
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </Field>

            <div>
              <p className="mb-2 text-sm font-medium">Topics</p>
              <div className="flex flex-wrap gap-2">
                {topics.map((t) => {
                  const on = picked.has(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      aria-pressed={on}
                      onClick={() =>
                        setPicked((p) => {
                          const n = new Set(p);
                          if (n.has(t)) n.delete(t);
                          else n.add(t);
                          return n;
                        })
                      }
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium ring-1 transition-all",
                        on ? "bg-brand text-white ring-brand" : "bg-surface text-ink-muted ring-line hover:ring-brand",
                      )}
                    >
                      {on && <Check className="h-3.5 w-3.5" />}
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="mb-1.5 text-sm font-medium">Difficulty</p>
                <Segmented
                  label="Difficulty"
                  value={difficulty}
                  onChange={setDifficulty}
                  options={[
                    { value: "EASY", label: "Easy" },
                    { value: "MEDIUM", label: "Medium" },
                    { value: "HARD", label: "Hard" },
                  ]}
                />
              </div>
              <Field id="qc" label="Questions">
                <Input id="qc" type="number" min={1} max={10} value={questionCount} onChange={(e) => setQuestionCount(Number(e.target.value))} />
              </Field>
              <Field id="tm" label="Total marks" hint="Default 30">
                <Input id="tm" type="number" min={1} max={100} value={totalMarks} onChange={(e) => setTotalMarks(Number(e.target.value))} />
              </Field>
              <Field id="due" label="Due">
                <Input id="due" type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
              </Field>
            </div>

            <div className="flex flex-col gap-3 rounded-2xl bg-surface-muted p-4 sm:flex-row sm:items-center">
              <p className="flex-1 text-sm text-ink-muted">
                Creates <span className="font-semibold text-ink">{students.length} unique versions</span> (one per student) with comparable difficulty.
                Nothing is visible to students until you publish.
              </p>
              <Button size="lg" onClick={generate} disabled={picked.size === 0 || !title.trim() || questionCount < 1 || totalMarks < 1}>
                <Sparkle className="h-5 w-5" /> Generate drafts
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="flex justify-end">
          <Button onClick={() => setMode("form")}>
            <Sparkle className="h-4 w-4" /> New assignment
          </Button>
        </div>
      )}

      <div className="space-y-3">
        {assignments.map((a) => (
          <Card key={a.id} className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold">{a.title}</h3>
                <AssignmentBadge status={a.status} />
              </div>
              <p className="mt-1 text-sm text-ink-muted">
                {a.topics.join(" · ")} · {a.totalMarks} marks · due {formatDate(a.dueAt)}
              </p>
            </div>
            <Badge tone="gray">{a.difficulty.toLowerCase()}</Badge>
          </Card>
        ))}
      </div>
    </div>
  );
}
