"use client";

import Link from "next/link";
import { useState } from "react";
import { Alert, Button, ButtonLink, Card } from "@/components/ui";
import { FileDrop } from "@/components/file-drop";
import { Check, Shield, Zip } from "@/components/icons";
import { formatBytes, formatDate } from "@/lib/format";

const MAX_BYTES = 20 * 1024 * 1024;

export function SubmitForm({
  deliverables,
  previous,
  closed,
}: {
  deliverables: string[];
  previous: { fileName: string; submittedAt: string } | null;
  closed: boolean;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  async function submit() {
    if (!file) return;
    // Phase 5: POST multipart to /api/student/submissions with upload progress via XHR.
    setProgress(0);
    for (let p = 10; p <= 100; p += 15) {
      await new Promise((r) => setTimeout(r, 120));
      setProgress(Math.min(p, 100));
    }
    setDone(true);
  }

  if (done && file) {
    return (
      <Card className="animate-rise text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-mint text-white shadow-soft">
          <Check className="h-8 w-8" />
        </span>
        <h2 className="mt-5 font-display text-2xl font-bold">Submitted!</h2>
        <p className="mt-2 text-ink-muted">
          We received <span className="font-semibold text-ink">{file.name}</span> ({formatBytes(file.size)}).
        </p>
        <p className="mt-1 text-sm text-ink-subtle">
          It&apos;s now being checked. Your teacher will review the evaluation before marks are published.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <ButtonLink href="/student/history" variant="secondary">
            View history
          </ButtonLink>
          <ButtonLink href="/student">Back to home</ButtonLink>
        </div>
      </Card>
    );
  }

  if (closed) {
    return <Alert tone="amber" title="Submissions are closed">The deadline for this assignment has passed. Contact your faculty if you need help.</Alert>;
  }

  return (
    <div className="space-y-5">
      {previous && (
        <Alert tone="blue" title="You've already submitted">
          {previous.fileName} on {formatDate(previous.submittedAt)}. Uploading again replaces it, and only your latest submission is evaluated.
        </Alert>
      )}

      <Card>
        <h2 className="font-semibold">1. Check your ZIP contains</h2>
        <ul className="mt-3 space-y-2">
          {deliverables.map((d) => (
            <li key={d} className="flex items-center gap-2.5 text-sm">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-soft text-brand-ink">
                <Check className="h-3 w-3" />
              </span>
              {d}
            </li>
          ))}
        </ul>
        <p className="mt-4 flex items-start gap-2 rounded-xl bg-surface-muted p-3 text-xs text-ink-muted">
          <Shield className="mt-0.5 h-4 w-4 shrink-0" />
          Allowed inside the ZIP: .pdf, .docx, .txt, .md, images, and source code (.sql, .py, .java, .js, .c, .cpp …).
          Executables and nested ZIPs are rejected.
        </p>
      </Card>

      <Card>
        <h2 className="mb-3 font-semibold">2. Choose your ZIP</h2>
        <FileDrop accept={[".zip"]} maxBytes={MAX_BYTES} onFile={setFile} hint="One .zip file, up to 20 MB" />
      </Card>

      <Card>
        <label className="flex cursor-pointer items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-0.5 h-5 w-5 rounded accent-[var(--brand)]"
          />
          <span>I confirm this is my own work and the ZIP contains the files listed above.</span>
        </label>

        {progress !== null ? (
          <div className="mt-5" aria-live="polite">
            <div className="flex items-center gap-3 text-sm">
              <Zip className="h-5 w-5 text-brand-ink" />
              <span className="flex-1 truncate font-medium">{file?.name}</span>
              <span className="tabular-nums text-ink-muted">{progress}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-muted">
              <div className="h-full rounded-full bg-gradient-to-r from-brand to-mint transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        ) : (
          <Button size="lg" className="mt-5 w-full" disabled={!file || !confirmed} onClick={submit}>
            Submit assignment
          </Button>
        )}
        {!file && <p className="mt-3 text-center text-xs text-ink-subtle">Choose a ZIP file to continue.</p>}
      </Card>

      <p className="text-center text-sm text-ink-subtle">
        Not sure what to include?{" "}
        <Link href="/student/assignment" className="font-semibold text-brand-ink hover:underline">
          Re-read your assignment
        </Link>
      </p>
    </div>
  );
}
