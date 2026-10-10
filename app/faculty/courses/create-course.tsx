"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Alert, Button, Field, Input } from "@/components/ui";
import { Modal } from "@/components/modal";
import { Plus } from "@/components/icons";
import { useToast } from "@/components/toast";
import { createCourseAction } from "@/lib/server/course-actions";

export function CreateCourseButton() {
  const toast = useToast();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await createCourseAction({ code, name });
      if (!res.ok) return setError(res.error);
      toast(`Course ${code.trim().toUpperCase()} created`);
      setOpen(false);
      setCode("");
      setName("");
      router.push(`/faculty/courses/${res.id}/import`);
    });
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> New course
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Create a course">
        <form onSubmit={submit} className="space-y-4">
          <Field id="code" label="Course code" hint="e.g. MSCIT-201">
            <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} required maxLength={30} autoFocus />
          </Field>
          <Field id="name" label="Course name">
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Database Management Systems" required maxLength={120} />
          </Field>
          {error && <Alert tone="red">{error}</Alert>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!code.trim() || !name.trim() || pending}>
              {pending ? "Creating…" : "Create course"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
