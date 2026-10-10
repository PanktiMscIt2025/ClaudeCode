"use client";

import { useMemo, useState } from "react";
import { Badge, Button, ButtonLink, EmptyState, Input, Table, Td, Th } from "@/components/ui";
import { Modal } from "@/components/modal";
import { useToast } from "@/components/toast";
import { Ban, Check, Key, Plus, Search } from "@/components/icons";
import type { Student } from "@/lib/types";

export function StudentList({ courseId, initial }: { courseId: string; initial: Student[] }) {
  const toast = useToast();
  const [students, setStudents] = useState(initial);
  const [q, setQ] = useState("");
  const [reset, setReset] = useState<{ student: Student; password: string } | null>(null);
  const [confirmReset, setConfirmReset] = useState<Student | null>(null);

  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    return n ? students.filter((s) => `${s.name} ${s.enrollmentNo}`.toLowerCase().includes(n)) : students;
  }, [students, q]);

  function doReset(student: Student) {
    // Phase 3: POST /api/courses/:id/students/:sid/reset → returns the one-time password; audit-logged.
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    const bytes = crypto.getRandomValues(new Uint8Array(12));
    const password = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
    setStudents((list) => list.map((s) => (s.id === student.id ? { ...s, mustChangePassword: true } : s)));
    setConfirmReset(null);
    setReset({ student, password });
  }

  function toggleDisabled(student: Student) {
    // Phase 3: POST /api/courses/:id/students/:sid/disable
    setStudents((list) => list.map((s) => (s.id === student.id ? { ...s, disabled: !s.disabled } : s)));
    toast(student.disabled ? `${student.name} can sign in again` : `${student.name}'s account disabled`);
  }

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
          <Input type="search" placeholder="Search students" value={q} onChange={(e) => setQ(e.target.value)} className="pl-10" aria-label="Search students" />
        </div>
        <ButtonLink href={`/faculty/courses/${courseId}/import`}>
          <Plus className="h-4 w-4" /> Import from Excel
        </ButtonLink>
      </div>

      {students.length === 0 ? (
        <EmptyState title="No students yet">Import an Excel sheet of names and enrollment numbers to create their accounts.</EmptyState>
      ) : (
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
                    <Button variant="ghost" className="h-8 px-2.5 text-xs" onClick={() => setConfirmReset(s)} disabled={s.disabled}>
                      <Key className="h-4 w-4" /> Reset password
                    </Button>
                    <Button variant="ghost" className="h-8 px-2.5 text-xs" onClick={() => toggleDisabled(s)}>
                      {s.disabled ? <Check className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                      {s.disabled ? "Enable" : "Disable"}
                    </Button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
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
          <Button onClick={() => confirmReset && doReset(confirmReset)}>Reset password</Button>
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
              if (reset) navigator.clipboard?.writeText(reset.password);
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
    </div>
  );
}
