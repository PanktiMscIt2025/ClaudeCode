"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert, Button, ButtonLink, Card } from "@/components/ui";
import { FileDrop } from "@/components/file-drop";
import { Check, Shield, Zip } from "@/components/icons";
import { formatBytes, formatDate } from "@/lib/format";

const MAX_BYTES = 20 * 1024 * 1024;

interface Result {
  fileName: string;
  sizeBytes: number;
  files: string[];
  rejected: string[];
}

/** XHR instead of fetch so we can show real upload progress. */
function upload(body: FormData, onProgress: (pct: number) => void): Promise<Result> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/student/submissions");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      let data: Result & { error?: string };
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        return reject(new Error("Unexpected server response. Please try again."));
      }
      if (xhr.status >= 200 && xhr.status < 300) resolve(data);
      else reject(new Error(data.error ?? "Upload failed."));
    };
    xhr.onerror = () => reject(new Error("Network error: check your connection and try again."));
    xhr.send(body);
  });
}

export function SubmitForm({
  studentAssignmentId,
  deliverables,
  previous,
  closed,
  marksPublished,
}: {
  studentAssignmentId: string;
  deliverables: string[];
  previous: { fileName: string; submittedAt: string } | null;
  closed: boolean;
  marksPublished: boolean;
}) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Result | null>(null);

  async function submit() {
    if (!file) return;
    setError(null);
    setProgress(0);
    const body = new FormData();
    body.set("studentAssignmentId", studentAssignmentId);
    body.set("file", file);
    try {
      setDone(await upload(body, setProgress));
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
      setProgress(null);
    }
  }

  if (done) {
    return (
      <Card className="animate-rise text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-mint text-white shadow-soft">
          <Check className="h-8 w-8" />
        </span>
        <h2 className="mt-5 font-display text-2xl font-bold">Submitted!</h2>
        <p className="mt-2 text-ink-muted">
          We received <span className="font-semibold text-ink">{done.fileName}</span> ({formatBytes(done.sizeBytes)}) with {done.files.length} file
          {done.files.length === 1 ? "" : "s"}.
        </p>
        {done.rejected.length > 0 && (
          <div className="mx-auto mt-4 max-w-md text-left">
            <Alert tone="amber" title="Some files were skipped">
              <ul className="list-disc pl-4">
                {done.rejected.slice(0, 6).map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </Alert>
          </div>
        )}
        <p className="mt-3 text-sm text-ink-subtle">It&apos;s now being checked. Your teacher reviews the evaluation before marks are published.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <ButtonLink href="/student/history" variant="secondary">
            View history
          </ButtonLink>
          <ButtonLink href="/student">Back to home</ButtonLink>
        </div>
      </Card>
    );
  }

  if (marksPublished) {
    return <Alert tone="green" title="Marks published">Your teacher has already published marks for this assignment, so it can&apos;t be resubmitted.</Alert>;
  }
  if (closed) {
    return <Alert tone="amber" title="Submissions are closed">The deadline for this assignment has passed. Contact your faculty if you need help.</Alert>;
  }

  return (
    <div className="space-y-5">
      {previous && (
        <Alert tone="blue" title="You've already submitted">
          {previous.fileName} on {formatDate(previous.submittedAt)}. Uploading again replaces it: only your latest submission is evaluated.
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
          Read for marking: .pdf, .docx, .txt, .md and source code (.sql, .py, .java, .js, .c, .cpp …). Executables and nested ZIPs are rejected.
          Scanned images can&apos;t be read automatically.
        </p>
      </Card>

      <Card>
        <h2 className="mb-3 font-semibold">2. Choose your ZIP</h2>
        <FileDrop accept={[".zip"]} maxBytes={MAX_BYTES} onFile={setFile} hint="One .zip file, up to 20 MB" />
      </Card>

      <Card>
        <label className="flex cursor-pointer items-start gap-3 text-sm">
          <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-0.5 h-5 w-5 rounded accent-[var(--brand)]" />
          <span>I confirm this is my own work and the ZIP contains the files listed above.</span>
        </label>

        {error && (
          <div className="mt-4">
            <Alert tone="red">
              <span role="alert">{error}</span>
            </Alert>
          </div>
        )}

        {progress !== null ? (
          <div className="mt-5" aria-live="polite">
            <div className="flex items-center gap-3 text-sm">
              <Zip className="h-5 w-5 text-brand-ink" />
              <span className="flex-1 truncate font-medium">{file?.name}</span>
              <span className="tabular-nums text-ink-muted">{progress < 100 ? `${progress}%` : "Checking…"}</span>
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
        <Link href={`/student/assignment?sa=${studentAssignmentId}`} className="font-semibold text-brand-ink hover:underline">
          Re-read your assignment
        </Link>
      </p>
    </div>
  );
}
