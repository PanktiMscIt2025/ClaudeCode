"use client";

import { useState } from "react";
import { Alert, Button, Card, Field, Select, Table, Td, Th } from "@/components/ui";
import { Segmented } from "@/components/segmented";
import { useToast } from "@/components/toast";
import { Check, Download, Sheet } from "@/components/icons";
import type { FacultyRow } from "@/lib/server/faculty-data";
import { fetchDownload } from "@/lib/download";

const BASE_COLUMNS = ["Sr. No.", "Student name", "Enrollment number", "Assignment title", "Assignment version", "Submission date"];
const END_COLUMNS = ["Total", "Percentage", "Evaluation status", "Faculty-approved marks", "Feedback summary"];

export function ExportPanel({
  courses,
  assignments,
  rows,
}: {
  courses: { id: string; label: string }[];
  assignments: { id: string; courseId: string; title: string; totalMarks: number; criteria: string[] }[];
  rows: FacultyRow[];
}) {
  const toast = useToast();
  const [courseId, setCourseId] = useState(courses[0]?.id ?? "");
  const courseAssignments = assignments.filter((a) => a.courseId === courseId);
  const [assignmentId, setAssignmentId] = useState(courseAssignments[0]?.id ?? "");
  const [scope, setScope] = useState<"all" | "approved">("all");
  const [busy, setBusy] = useState(false);

  const assignment = assignments.find((a) => a.id === assignmentId);
  const forAssignment = rows.filter((r) => r.assignmentId === assignmentId);
  const preview = scope === "approved" ? forAssignment.filter((r) => r.reviewStatus === "APPROVED") : forAssignment;
  const pending = forAssignment.filter((r) => r.status !== "NOT_SUBMITTED" && r.reviewStatus !== "APPROVED").length;

  async function download() {
    setBusy(true);
    try {
      await fetchDownload(`/api/faculty/export/marks?assignmentId=${encodeURIComponent(assignmentId)}&scope=${scope}`, "marks.xlsx");
      toast("Marks workbook downloaded");
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <Card className="space-y-5 lg:self-start">
        <Field id="course" label="Course">
          <Select
            id="course"
            value={courseId}
            onChange={(e) => {
              setCourseId(e.target.value);
              setAssignmentId(assignments.find((a) => a.courseId === e.target.value)?.id ?? "");
            }}
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field id="assignment" label="Assignment">
          <Select id="assignment" value={assignmentId} onChange={(e) => setAssignmentId(e.target.value)}>
            {courseAssignments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.title}
              </option>
            ))}
          </Select>
        </Field>
        <div>
          <p className="mb-1.5 text-sm font-medium">Include</p>
          <Segmented
            label="Rows to include"
            value={scope}
            onChange={setScope}
            options={[
              { value: "all", label: "All students" },
              { value: "approved", label: "Approved only" },
            ]}
          />
        </div>
        {pending > 0 && scope === "all" && <Alert tone="amber">{pending} evaluations are still provisional. They&apos;re labelled as such in the sheet.</Alert>}
        <Button size="lg" className="w-full" disabled={!assignmentId || busy} onClick={download}>
          <Download className="h-5 w-5" /> {busy ? "Preparing…" : "Download .xlsx"}
        </Button>
      </Card>

      <div className="min-w-0 space-y-6">
        <Card>
          <h2 className="flex items-center gap-2 font-semibold">
            <Sheet className="h-5 w-5 text-mint" /> Columns in the workbook
          </h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {[...BASE_COLUMNS, ...(assignment?.criteria ?? []), ...END_COLUMNS].map((c) => (
              <li key={c} className="flex items-center gap-2 text-sm text-ink-muted">
                <Check className="h-4 w-4 shrink-0 text-mint" /> {c}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-ink-subtle">Bold header row with filters, sized columns, and numeric score cells you can sort and total in Excel, plus a summary sheet.</p>
        </Card>

        <div>
          <h2 className="mb-3 text-sm font-semibold text-ink-muted">Preview ({preview.length} rows)</h2>
          <Table>
            <thead>
              <tr>
                <Th>#</Th>
                <Th>Student</Th>
                <Th>Enrollment</Th>
                <Th>Version</Th>
                <Th className="text-right">Total</Th>
                <Th className="text-right">%</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {preview.map((r, i) => (
                <tr key={r.enrollmentNo + r.version}>
                  <Td className="text-ink-subtle">{i + 1}</Td>
                  <Td className="font-medium">{r.studentName}</Td>
                  <Td className="font-mono text-ink-muted">{r.enrollmentNo}</Td>
                  <Td>{r.version}</Td>
                  <Td className="text-right tabular-nums">{r.score ?? "—"}</Td>
                  <Td className="text-right tabular-nums">{r.score !== null && assignment ? ((r.score / assignment.totalMarks) * 100).toFixed(1) : "—"}</Td>
                  <Td className="text-ink-muted">{r.status === "NOT_SUBMITTED" ? "Not submitted" : r.reviewStatus === "APPROVED" ? "Approved" : "Provisional"}</Td>
                </tr>
              ))}
              {preview.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-ink-subtle">
                    No approved marks yet.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      </div>
    </div>
  );
}
