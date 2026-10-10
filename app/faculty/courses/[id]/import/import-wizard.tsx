"use client";

import { useMemo, useState } from "react";
import { Alert, Badge, Button, ButtonLink, Card, Field, Select, Table, Td, Th } from "@/components/ui";
import { FileDrop } from "@/components/file-drop";
import { Segmented } from "@/components/segmented";
import { useToast } from "@/components/toast";
import { Check, Download, Sheet, Sparkle } from "@/components/icons";
import { demoImportPreview } from "@/lib/demo-data";
import type { ImportPreviewRow } from "@/lib/types";
import { cn } from "@/lib/format";

type Step = "upload" | "map" | "preview" | "done";
const STEPS: { id: Step; label: string }[] = [
  { id: "upload", label: "Upload" },
  { id: "map", label: "Columns" },
  { id: "preview", label: "Preview" },
  { id: "done", label: "Done" },
];

// Phase 3: returned by POST /api/courses/:id/import/preview after ExcelJS parses the sheet.
const DETECTED_HEADERS = ["Sr. No.", "Student Name", "Enrollment Number", "Division"];

export function ImportWizard({ courseId }: { courseId: string }) {
  const toast = useToast();
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [reading, setReading] = useState(false);
  const [nameCol, setNameCol] = useState("Student Name");
  const [enrCol, setEnrCol] = useState("Enrollment Number");
  const [updateNames, setUpdateNames] = useState(true);
  const [filter, setFilter] = useState<"ALL" | ImportPreviewRow["action"]>("ALL");
  const [committing, setCommitting] = useState(false);

  // "Update names" off turns name changes into skips, so existing records stay untouched.
  const rows = useMemo(
    () =>
      demoImportPreview.map((r) =>
        r.action === "UPDATE" && !updateNames ? { ...r, action: "SKIP" as const, issue: "Name differs (updates turned off)" } : r,
      ),
    [updateNames],
  );
  const counts = {
    CREATE: rows.filter((r) => r.action === "CREATE").length,
    UPDATE: rows.filter((r) => r.action === "UPDATE").length,
    SKIP: rows.filter((r) => r.action === "SKIP").length,
  };
  const visible = filter === "ALL" ? rows : rows.filter((r) => r.action === filter);
  const stepIndex = STEPS.findIndex((s) => s.id === step);

  async function readFile() {
    setReading(true);
    await new Promise((r) => setTimeout(r, 600));
    setReading(false);
    // Headers matched confidently → go straight to preview; otherwise the mapping screen.
    setStep("preview");
  }

  async function commit() {
    setCommitting(true);
    // Phase 3: POST /api/courses/:id/import/commit (single DB transaction).
    await new Promise((r) => setTimeout(r, 700));
    setCommitting(false);
    setStep("done");
  }

  return (
    <div className="mx-auto max-w-4xl">
      <ol className="mb-8 flex items-center gap-2 sm:gap-3" aria-label="Import progress">
        {STEPS.map((s, i) => (
          <li key={s.id} className="flex flex-1 items-center gap-2 sm:gap-3">
            <span
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                i < stepIndex ? "bg-brand text-white" : i === stepIndex ? "bg-brand-soft text-brand-ink ring-2 ring-brand" : "bg-surface-muted text-ink-subtle",
              )}
              aria-current={i === stepIndex ? "step" : undefined}
            >
              {i < stepIndex ? <Check className="h-4 w-4" /> : i + 1}
            </span>
            <span className={cn("hidden text-sm font-semibold sm:inline", i <= stepIndex ? "text-ink" : "text-ink-subtle")}>{s.label}</span>
            {i < STEPS.length - 1 && <span className={cn("h-0.5 flex-1 rounded-full", i < stepIndex ? "bg-brand" : "bg-line")} />}
          </li>
        ))}
      </ol>

      {step === "upload" && (
        <div className="grid gap-6 md:grid-cols-[1.4fr_1fr]">
          <Card>
            <h2 className="font-display text-xl font-bold">Upload your class list</h2>
            <p className="mt-1 text-sm text-ink-muted">One sheet with student names and enrollment numbers. Extra columns are ignored.</p>
            <div className="mt-5">
              <FileDrop accept={[".xlsx", ".xls"]} maxBytes={5 * 1024 * 1024} onFile={setFile} hint=".xlsx or .xls, up to 5 MB" />
            </div>
            <Button size="lg" className="mt-5 w-full" disabled={!file || reading} onClick={readFile}>
              {reading ? "Reading sheet…" : "Continue"}
            </Button>
          </Card>
          <div className="space-y-4">
            <Card className="bg-surface-muted shadow-none">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <Sheet className="h-4 w-4 text-mint" /> Expected format
              </p>
              <table className="mt-3 w-full overflow-hidden rounded-xl bg-surface text-left text-xs ring-1 ring-line">
                <thead className="bg-mint-soft text-mint">
                  <tr>
                    <th className="px-3 py-2">Student Name</th>
                    <th className="px-3 py-2">Enrollment Number</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {[
                    ["Rahul Patel", "ENR001"],
                    ["Priya Shah", "ENR002"],
                    ["Amit Kumar", "ENR003"],
                  ].map(([n, e]) => (
                    <tr key={e}>
                      <td className="px-3 py-2">{n}</td>
                      <td className="px-3 py-2 font-mono">{e}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
            <ul className="space-y-2 text-sm text-ink-muted">
              {[
                "Enrollment number becomes the student's login ID",
                "A random temporary password is generated for each new student",
                "Re-uploading the same file never creates duplicates or resets passwords",
              ].map((t) => (
                <li key={t} className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-mint" /> {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {step === "map" && (
        <Card>
          <h2 className="font-display text-xl font-bold">Match your columns</h2>
          <p className="mt-1 text-sm text-ink-muted">Tell us which column holds each field. We found these headers in {file?.name ?? "your file"}.</p>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <Field id="nameCol" label="Student name column">
              <Select id="nameCol" value={nameCol} onChange={(e) => setNameCol(e.target.value)}>
                {DETECTED_HEADERS.map((h) => (
                  <option key={h}>{h}</option>
                ))}
              </Select>
            </Field>
            <Field id="enrCol" label="Enrollment number column">
              <Select id="enrCol" value={enrCol} onChange={(e) => setEnrCol(e.target.value)}>
                {DETECTED_HEADERS.map((h) => (
                  <option key={h}>{h}</option>
                ))}
              </Select>
            </Field>
          </div>
          {nameCol === enrCol && (
            <div className="mt-4">
              <Alert tone="red">Name and enrollment number must come from different columns.</Alert>
            </div>
          )}
          <div className="mt-6 flex justify-between">
            <Button variant="ghost" onClick={() => setStep("upload")}>
              Back
            </Button>
            <Button onClick={() => setStep("preview")} disabled={nameCol === enrCol}>
              Preview records
            </Button>
          </div>
        </Card>
      )}

      {step === "preview" && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-brand-soft p-4 text-sm">
            <Sparkle className="h-5 w-5 shrink-0 text-brand-ink" />
            <p className="flex-1 text-ink">
              Columns detected: <span className="font-semibold">“{nameCol}”</span> → name, <span className="font-semibold">“{enrCol}”</span> →
              enrollment no.
            </p>
            <button onClick={() => setStep("map")} className="font-semibold text-brand-ink hover:underline">
              Change
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {(
              [
                ["CREATE", "New accounts", "text-mint bg-mint-soft"],
                ["UPDATE", "Updates", "text-brand-ink bg-brand-soft"],
                ["SKIP", "Skipped", "text-sun bg-sun-soft"],
              ] as const
            ).map(([k, label, tone]) => (
              <button
                key={k}
                onClick={() => setFilter(filter === k ? "ALL" : k)}
                className={cn("rounded-2xl p-4 text-left transition-all", tone, filter === k ? "ring-2 ring-current" : "hover:-translate-y-0.5")}
                aria-pressed={filter === k}
              >
                <p className="font-display text-3xl font-bold tabular-nums">{counts[k]}</p>
                <p className="text-sm font-semibold">{label}</p>
              </button>
            ))}
          </div>

          <Card className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-4">
            <div>
              <p className="text-sm font-semibold">Update names of existing students?</p>
              <p className="text-xs text-ink-subtle">Passwords are never changed by a re-import.</p>
            </div>
            <Segmented
              label="Update existing names"
              value={updateNames ? "yes" : "no"}
              onChange={(v) => setUpdateNames(v === "yes")}
              options={[
                { value: "yes", label: "Update" },
                { value: "no", label: "Keep as is" },
              ]}
            />
          </Card>

          <Table>
            <thead>
              <tr>
                <Th>Row</Th>
                <Th>Name</Th>
                <Th>Enrollment no.</Th>
                <Th>Result</Th>
                <Th>Note</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {visible.map((r) => (
                <tr key={r.row}>
                  <Td className="text-ink-subtle tabular-nums">{r.row}</Td>
                  <Td className="font-medium">{r.name || <span className="text-danger italic">missing</span>}</Td>
                  <Td className="font-mono">{r.enrollmentNo}</Td>
                  <Td>
                    <Badge tone={r.action === "CREATE" ? "green" : r.action === "UPDATE" ? "blue" : "amber"}>
                      {r.action === "CREATE" ? "Create" : r.action === "UPDATE" ? "Update" : "Skip"}
                    </Badge>
                  </Td>
                  <Td className="whitespace-normal text-ink-muted">{r.issue ?? "—"}</Td>
                </tr>
              ))}
            </tbody>
          </Table>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <Button variant="ghost" onClick={() => setStep("upload")}>
              Choose another file
            </Button>
            <Button size="lg" onClick={commit} disabled={committing || counts.CREATE + counts.UPDATE === 0}>
              {committing ? "Importing…" : `Import ${counts.CREATE + counts.UPDATE} students`}
            </Button>
          </div>
        </div>
      )}

      {step === "done" && (
        <div className="space-y-5">
          <Card className="text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-mint text-white shadow-soft">
              <Check className="h-8 w-8" />
            </span>
            <h2 className="mt-5 font-display text-2xl font-bold">Import complete</h2>
            <p className="mt-2 text-ink-muted">
              {counts.CREATE} accounts created · {counts.UPDATE} updated · {counts.SKIP} skipped
            </p>
          </Card>

          <Alert tone="amber" title="Download the credentials now">
            The temporary passwords for the {counts.CREATE} new students are shown only once. The file isn&apos;t saved anywhere. Share it securely
            and delete it after distribution.
          </Alert>

          <div className="grid gap-3 sm:grid-cols-2">
            <Button size="lg" onClick={() => toast("Credential sheet: generated by the server once the backend is connected", "info")}>
              <Download className="h-5 w-5" /> Credentials (.xlsx)
            </Button>
            <Button size="lg" variant="secondary" onClick={() => toast("Error report: generated by the server once the backend is connected", "info")}>
              <Download className="h-5 w-5" /> Error report ({counts.SKIP} rows)
            </Button>
          </div>
          <div className="text-center">
            <ButtonLink href={`/faculty/courses/${courseId}/students`} variant="ghost">
              Go to student list →
            </ButtonLink>
          </div>
        </div>
      )}
    </div>
  );
}
