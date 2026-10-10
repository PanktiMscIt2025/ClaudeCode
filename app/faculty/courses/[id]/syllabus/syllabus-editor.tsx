"use client";

import { useState } from "react";
import { Button, ButtonLink, Card, CardTitle, Input } from "@/components/ui";
import { FileDrop } from "@/components/file-drop";
import { useToast } from "@/components/toast";
import { Check, File, Plus, Sparkle, X } from "@/components/icons";
import { cn, formatDate } from "@/lib/format";

interface Syllabus {
  fileName: string;
  uploadedAt: string;
  topics: string[];
  outcomes: string[];
}

export function SyllabusEditor({ initial }: { initial: Syllabus }) {
  const toast = useToast();
  const [syllabus, setSyllabus] = useState(initial);
  const [file, setFile] = useState<File | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [newTopic, setNewTopic] = useState("");
  const [excluded, setExcluded] = useState<Set<string>>(new Set());

  async function extract() {
    if (!file) return;
    setExtracting(true);
    // Phase 4: POST /api/courses/:id/syllabus → text extraction (unpdf/mammoth) + Claude topic extraction.
    await new Promise((r) => setTimeout(r, 900));
    setSyllabus((s) => ({ ...s, fileName: file.name, uploadedAt: new Date().toISOString() }));
    setExtracting(false);
    setFile(null);
    toast("Syllabus processed: review the topics below");
  }

  function addTopic(e: React.FormEvent) {
    e.preventDefault();
    const t = newTopic.trim();
    if (!t || syllabus.topics.includes(t)) return;
    setSyllabus((s) => ({ ...s, topics: [...s.topics, t] }));
    setNewTopic("");
  }

  function toggle(t: string) {
    setExcluded((ex) => {
      const next = new Set(ex);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="min-w-0 space-y-6">
        <Card>
          <CardTitle action={<span className="text-xs text-ink-subtle">Click a topic to include or exclude it</span>}>Topics</CardTitle>
          <div className="flex flex-wrap gap-2">
            {syllabus.topics.map((t) => {
              const off = excluded.has(t);
              return (
                <button
                  key={t}
                  onClick={() => toggle(t)}
                  aria-pressed={!off}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all",
                    off ? "bg-surface-muted text-ink-subtle line-through" : "bg-brand-soft text-brand-ink hover:bg-brand hover:text-white",
                  )}
                >
                  {off ? <X className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                  {t}
                </button>
              );
            })}
          </div>
          <form onSubmit={addTopic} className="mt-5 flex gap-2">
            <Input value={newTopic} onChange={(e) => setNewTopic(e.target.value)} placeholder="Add a topic the extraction missed" aria-label="New topic" />
            <Button type="submit" variant="secondary" disabled={!newTopic.trim()}>
              <Plus className="h-4 w-4" /> Add
            </Button>
          </form>
        </Card>

        <Card>
          <CardTitle>Learning outcomes</CardTitle>
          <ul className="space-y-3">
            {syllabus.outcomes.map((o) => {
              const [code, ...rest] = o.split(":");
              return (
                <li key={o} className="flex gap-3">
                  <span className="shrink-0 rounded-lg bg-accent-soft px-2 py-0.5 text-xs font-bold text-accent">{code}</span>
                  <span className="text-sm text-ink">{rest.join(":").trim()}</span>
                </li>
              );
            })}
          </ul>
        </Card>

        <div className="flex justify-end">
          <ButtonLink href="./assignments">
            <Sparkle className="h-4 w-4" /> Generate assignments from these topics
          </ButtonLink>
        </div>
      </div>

      <aside className="space-y-4">
        <Card>
          <p className="text-xs font-semibold tracking-wide text-ink-subtle uppercase">Current syllabus</p>
          <div className="mt-3 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-danger-soft text-danger">
              <File className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{syllabus.fileName}</p>
              <p className="text-xs text-ink-subtle">Uploaded {formatDate(syllabus.uploadedAt)}</p>
            </div>
          </div>
        </Card>
        <Card>
          <h2 className="font-semibold">Replace syllabus</h2>
          <p className="mt-1 mb-4 text-sm text-ink-muted">PDF or DOCX. Topics and outcomes are extracted automatically, and you can edit them afterwards.</p>
          <FileDrop accept={[".pdf", ".docx"]} maxBytes={10 * 1024 * 1024} onFile={setFile} />
          <Button className="mt-4 w-full" disabled={!file || extracting} onClick={extract}>
            <Sparkle className="h-4 w-4" />
            {extracting ? "Extracting topics…" : "Upload & extract"}
          </Button>
        </Card>
      </aside>
    </div>
  );
}
