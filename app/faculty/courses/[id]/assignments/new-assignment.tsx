"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Alert, Button, Card, CardTitle, Field, Input } from "@/components/ui";
import { Segmented } from "@/components/segmented";
import { Check, Plus, Sparkle, X } from "@/components/icons";
import type { Difficulty } from "@/lib/types";
import { cn } from "@/lib/format";
import { createAssignmentAction } from "@/lib/server/assignment-actions";

function defaultDue() {
  const d = new Date(Date.now() + 14 * 86_400_000);
  d.setHours(18, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T18:00`;
}

export function NewAssignment({
  courseId,
  topics,
  studentCount,
  aiEnabled,
  defaultOpen,
}: {
  courseId: string;
  topics: string[];
  studentCount: number;
  aiEnabled: boolean;
  defaultOpen: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(defaultOpen);
  const [title, setTitle] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [custom, setCustom] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("MEDIUM");
  const [questionCount, setQuestionCount] = useState(3);
  const [totalMarks, setTotalMarks] = useState(30);
  const [dueAt, setDueAt] = useState(defaultDue);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const allTopics = Array.from(new Set([...topics, ...picked]));

  function toggle(t: string) {
    setPicked((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]));
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await createAssignmentAction({
        courseId,
        title,
        topics: picked,
        difficulty,
        questionCount,
        totalMarks,
        dueAt: new Date(dueAt).toISOString(),
      });
      if (!res.ok) return setError(res.error);
      router.push(`/faculty/courses/${courseId}/assignments/${res.id}`);
    });
  }

  if (!open) {
    return (
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}>
          <Sparkle className="h-4 w-4" /> New assignment
        </Button>
      </div>
    );
  }

  return (
    <Card>
      <CardTitle
        action={
          <button onClick={() => setOpen(false)} className="rounded-lg p-1 text-ink-subtle hover:bg-surface-muted" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        }
      >
        Generate a new assignment
      </CardTitle>
      <div className="space-y-6">
        <Field id="title" label="Title">
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Assignment 1: Relational design for a real business" maxLength={150} />
        </Field>

        <div>
          <p className="mb-2 text-sm font-medium">Topics</p>
          {allTopics.length === 0 && (
            <p className="mb-3 text-sm text-ink-muted">Upload a syllabus to pick from its topics, or add topics yourself below.</p>
          )}
          <div className="flex flex-wrap gap-2">
            {allTopics.map((t) => {
              const on = picked.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(t)}
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
          <form
            className="mt-3 flex max-w-md gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const t = custom.trim();
              if (t && !picked.includes(t)) setPicked((p) => [...p, t]);
              setCustom("");
            }}
          >
            <Input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Add a topic" aria-label="Add a topic" maxLength={200} />
            <Button type="submit" variant="secondary" disabled={!custom.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </form>
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
            <Input id="qc" type="number" min={1} max={8} value={questionCount} onChange={(e) => setQuestionCount(Number(e.target.value))} />
          </Field>
          <Field id="tm" label="Total marks" hint="Default 30">
            <Input id="tm" type="number" min={5} max={100} value={totalMarks} onChange={(e) => setTotalMarks(Number(e.target.value))} />
          </Field>
          <Field id="due" label="Due">
            <Input id="due" type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
          </Field>
        </div>

        {error && (
          <Alert tone="red">
            <span role="alert">{error}</span>
          </Alert>
        )}

        <div className="flex flex-col gap-3 rounded-2xl bg-surface-muted p-4 sm:flex-row sm:items-center">
          <p className="flex-1 text-sm text-ink-muted">
            Creates <span className="font-semibold text-ink">{studentCount} unique versions</span> (one per student) that share one rubric, so marking
            stays comparable. Nothing is visible to students until you publish.
            {!aiEnabled && " No AI key is configured, so the built-in template generator will be used."}
          </p>
          <Button size="lg" onClick={submit} disabled={pending || !picked.length || title.trim().length < 3 || studentCount === 0}>
            <Sparkle className="h-5 w-5" /> {pending ? "Starting…" : "Generate drafts"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
