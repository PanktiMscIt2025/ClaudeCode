"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Alert, Button, ButtonLink, Card, CardTitle, EmptyState, Input } from "@/components/ui";
import { FileDrop } from "@/components/file-drop";
import { useToast } from "@/components/toast";
import { File, Plus, Sparkle, X } from "@/components/icons";
import { formatDate } from "@/lib/format";
import { saveSyllabusAction } from "@/lib/server/assignment-actions";

interface Syllabus {
  fileName: string;
  uploadedAt: string;
  topics: string[];
  outcomes: string[];
}

export function SyllabusEditor({ courseId, initial, aiEnabled }: { courseId: string; initial: Syllabus | null; aiEnabled: boolean }) {
  const toast = useToast();
  const router = useRouter();
  const [syllabus, setSyllabus] = useState(initial);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newTopic, setNewTopic] = useState("");
  const [dirty, setDirty] = useState(false);
  const [saving, startSaving] = useTransition();

  async function upload() {
    if (!file) return;
    setUploading(true);
    setError(null);
    const body = new FormData();
    body.set("file", file);
    try {
      const res = await fetch(`/api/faculty/courses/${courseId}/syllabus`, { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed.");
      setSyllabus({ fileName: data.fileName, uploadedAt: data.uploadedAt, topics: data.topics, outcomes: data.outcomes });
      setFile(null);
      setDirty(false);
      toast(`Found ${data.topics.length} topics: review them below`);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  function update(next: Partial<Syllabus>) {
    setSyllabus((s) => (s ? { ...s, ...next } : s));
    setDirty(true);
  }

  function addTopic(e: React.FormEvent) {
    e.preventDefault();
    const t = newTopic.trim();
    if (!t || !syllabus || syllabus.topics.includes(t)) return;
    update({ topics: [...syllabus.topics, t] });
    setNewTopic("");
  }

  function save() {
    if (!syllabus) return;
    startSaving(async () => {
      const res = await saveSyllabusAction(courseId, { topics: syllabus.topics, outcomes: syllabus.outcomes });
      if (!res.ok) return toast(res.error, "error");
      setDirty(false);
      toast("Syllabus saved");
    });
  }

  const uploader = (
    <Card>
      <h2 className="font-semibold">{syllabus ? "Replace syllabus" : "Upload syllabus"}</h2>
      <p className="mt-1 mb-4 text-sm text-ink-muted">
        PDF or DOCX. Topics and learning outcomes are extracted {aiEnabled ? "with AI" : "automatically"}, and you can edit them afterwards.
      </p>
      <FileDrop accept={[".pdf", ".docx"]} maxBytes={10 * 1024 * 1024} onFile={setFile} />
      {error && (
        <div className="mt-4">
          <Alert tone="red">
            <span role="alert">{error}</span>
          </Alert>
        </div>
      )}
      <Button className="mt-4 w-full" disabled={!file || uploading} onClick={upload}>
        <Sparkle className="h-4 w-4" />
        {uploading ? "Reading syllabus…" : "Upload & extract"}
      </Button>
      {!aiEnabled && <p className="mt-3 text-xs text-ink-subtle">No AI key configured: using the built-in extractor. Review topics carefully.</p>}
    </Card>
  );

  if (!syllabus) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <EmptyState title="No syllabus yet">Upload the course syllabus to pick topics for assignment generation.</EmptyState>
        {uploader}
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="min-w-0 space-y-6">
        <Card>
          <CardTitle action={<span className="text-xs text-ink-subtle">{syllabus.topics.length} topics</span>}>Topics</CardTitle>
          <div className="flex flex-wrap gap-2">
            {syllabus.topics.map((t) => (
              <span key={t} className="inline-flex items-center gap-1 rounded-full bg-brand-soft py-1.5 pr-1.5 pl-3.5 text-sm font-medium text-brand-ink">
                {t}
                <button
                  onClick={() => update({ topics: syllabus.topics.filter((x) => x !== t) })}
                  className="rounded-full p-0.5 hover:bg-brand hover:text-white"
                  aria-label={`Remove ${t}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
          </div>
          <form onSubmit={addTopic} className="mt-5 flex gap-2">
            <Input value={newTopic} onChange={(e) => setNewTopic(e.target.value)} placeholder="Add a topic the extraction missed" aria-label="New topic" maxLength={200} />
            <Button type="submit" variant="secondary" disabled={!newTopic.trim()}>
              <Plus className="h-4 w-4" /> Add
            </Button>
          </form>
        </Card>

        <Card>
          <CardTitle>Learning outcomes</CardTitle>
          {syllabus.outcomes.length === 0 ? (
            <p className="text-sm text-ink-muted">No outcomes found.</p>
          ) : (
            <ul className="space-y-3">
              {syllabus.outcomes.map((o) => {
                const m = /^([A-Z]{1,4}\s*\d+)\s*[:.-]\s*(.*)$/i.exec(o);
                return (
                  <li key={o} className="flex items-start gap-3">
                    {m && <span className="shrink-0 rounded-lg bg-accent-soft px-2 py-0.5 text-xs font-bold text-accent">{m[1]}</span>}
                    <span className="flex-1 text-sm text-ink">{m ? m[2] : o}</span>
                    <button
                      onClick={() => update({ outcomes: syllabus.outcomes.filter((x) => x !== o) })}
                      className="rounded-full p-0.5 text-ink-subtle hover:bg-surface-muted hover:text-ink"
                      aria-label="Remove outcome"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <div className="flex flex-wrap justify-end gap-2">
          {dirty && (
            <Button variant="secondary" onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          )}
          <ButtonLink href={`/faculty/courses/${courseId}/assignments`}>
            <Sparkle className="h-4 w-4" /> Generate assignments
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
        {uploader}
      </aside>
    </div>
  );
}
