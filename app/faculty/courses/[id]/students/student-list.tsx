"use client";

import { useMemo, useState, useTransition } from "react";
import { Alert, Badge, Button, ButtonLink, EmptyState, Input, Table, Td, Th } from "@/components/ui";
import { Modal } from "@/components/modal";
import { useToast } from "@/components/toast";
import { Ban, Check, Download, Key, Plus, Search } from "@/components/icons";
import type { Student } from "@/lib/types";
import { fetchDownload } from "@/lib/download";
import { resetStudentPasswordAction, setStudentDisabledAction } from "@/lib/server/course-actions";

export function StudentList({ courseId, courseCode, initial }: { courseId: string; courseCode: string; initial: Student[] }) {
  const toast = useToast();
  const [q, setQ] = useState("");
  const [reset, setReset] = useState<{ student: Student; password: string } | null>(null);
  const [confirmReset, setConfirmReset] = useState<Student | null>(null);
  const [confirmReissue, setConfirmReissue] = useState(false);
  const [pending, startTransition] = useTransition();
  const students = initial;
  const notSignedIn = students.filter((s) => s.mustChangePassword && !s.disabled).length;

  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    return n ? students.filter((s) => `${s.name} ${s.enrollmentNo}`.toLowerCase().includes(n)) : students;
  }, [students, q]);

  function doReset(student: Student) {
    startTransition(async () => {
      const res = await resetStudentPasswordAction(courseId, student.id);
      setConfirmReset(null);
      if (!res.ok) return toast(res.error, "error");
      setReset({ student, password: res.password });
    });
  }

  function toggleDisabled(student: Student) {
    startTransition(async () => {
      const res = await setStudentDisabledAction(courseId, student.id, !student.disabled);
      if (!res.ok) return toast(res.error, "error");
      toast(student.disabled ? `${student.name} can sign in again` : `${student.name}'s account disabled`);
    });
  }

  function reissue() {
    startTransition(async () => {
      try {
        await fetchDownload(`/api/faculty/courses/${courseId}/credentials`, `${courseCode}_credentials.xlsx`, { method: "POST" });
        toast("New credential sheet downloaded");
      } catch (e) {
        toast((e as Error).message, "error");
      }
      setConfirmReissue(false);
    });
  }

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
          <Input type="search" placeholder="Search students" value={q} onChange={(e) => setQ(e.target.value)} className="pl-10" aria-label="Search students" />
        </div>
        {notSignedIn > 0 && (
          <Button variant="secondary" onClick={() => setConfirmReissue(true)} disabled={pending}>
            <Download className="h-4 w-4" /> Credential sheet
          </Button>
        )}
        <ButtonLink href={`/faculty/courses/${courseId}/import`}>
          <Plus className="h-4 w-4" /> Import from Excel
        </ButtonLink>
      </div>

      {students.length === 0 ? (
        <EmptyState title="No students yet">Import an Excel sheet of names and enrollment numbers to create their accounts.</EmptyState>
      ) : (
        <>
          <p className="mb-3 text-sm text-ink-muted">
            {students.length} students · {notSignedIn} still on a temporary password
          </p>
          <Table>
            <thead>
              <tr>
                <Th>Enrollment no.</Th>
                <Th>Name</Th>
                <Th>Account</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((s) => (
                <tr key={s.id} className={s.disabled ? "opacity-60" : undefined}>
                  <Td className="font-mono text-ink-muted">{s.enrollmentNo}</Td>
                  <Td className="font-medium">{s.name}</Td>
                  <Td>
                    {s.disabled ? (
                      <Badge tone="red">Disabled</Badge>
                    ) : s.mustChangePassword ? (
                      <Badge tone="amber">Temporary password</Badge>
                    ) : (
                      <Badge tone="green">Active</Badge>
                    )}
                  </Td>
                  <Td className="text-right">
                    <div className="inline-flex gap-1">
                      <Button variant="ghost" className="h-8 px-2.5 text-xs" onClick={() => setConfirmReset(s)} disabled={s.disabled || pending}>
                        <Key className="h-4 w-4" /> Reset password
                      </Button>
                      <Button variant="ghost" className="h-8 px-2.5 text-xs" onClick={() => toggleDisabled(s)} disabled={pending}>
                        {s.disabled ? <Check className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                        {s.disabled ? "Enable" : "Disable"}
                      </Button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </>
      )}

      <p className="mt-4 text-xs text-ink-subtle">
        Temporary passwords are shown only once, when accounts are created or reset. They are never stored in readable form.
      </p>

      <Modal open={!!confirmReset} onClose={() => setConfirmReset(null)} title="Reset password?">
        <p className="text-sm text-ink-muted">
          {confirmReset?.name} ({confirmReset?.enrollmentNo}) will get a new temporary password and must choose their own at next sign-in. Their
          current password stops working immediately.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmReset(null)}>
            Cancel
          </Button>
          <Button onClick={() => confirmReset && doReset(confirmReset)} disabled={pending}>
            {pending ? "Resetting…" : "Reset password"}
          </Button>
        </div>
      </Modal>

      <Modal open={!!reset} onClose={() => setReset(null)} title="New temporary password">
        <p className="text-sm text-ink-muted">
          Give this to <span className="font-semibold text-ink">{reset?.student.name}</span>. It won&apos;t be shown again.
        </p>
        <div className="mt-4 flex items-center gap-2 rounded-2xl bg-surface-muted p-4">
          <code className="flex-1 font-mono text-lg font-semibold tracking-wider select-all">{reset?.password}</code>
          <Button
            variant="secondary"
            className="h-9"
            onClick={() => {
              if (reset) navigator.clipboard?.writeText(reset.password).catch(() => {});
              toast("Copied to clipboard");
            }}
          >
            Copy
          </Button>
        </div>
        <div className="mt-6 flex justify-end">
          <Button onClick={() => setReset(null)}>Done</Button>
        </div>
      </Modal>

      <Modal open={confirmReissue} onClose={() => setConfirmReissue(false)} title="Download a new credential sheet?">
        <p className="text-sm text-ink-muted">
          Passwords aren&apos;t stored, so the original sheet can&apos;t be downloaded again. This issues{" "}
          <span className="font-semibold text-ink">new temporary passwords</span> to the {notSignedIn} students who haven&apos;t signed in yet and
          downloads them as Excel.
        </p>
        <div className="mt-4">
          <Alert tone="amber">Any temporary passwords you already handed out to these students will stop working.</Alert>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmReissue(false)}>
            Cancel
          </Button>
          <Button onClick={reissue} disabled={pending}>
            <Download className="h-4 w-4" /> {pending ? "Preparing…" : "Issue & download"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
