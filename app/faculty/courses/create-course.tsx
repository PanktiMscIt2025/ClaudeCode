"use client";

import { useState } from "react";
import { Button, Field, Input } from "@/components/ui";
import { Modal } from "@/components/modal";
import { Plus } from "@/components/icons";
import { useToast } from "@/components/toast";

export function CreateCourseButton() {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;
    // Phase 2: POST /api/courses
    toast(`Course ${code.trim().toUpperCase()} created`);
    setOpen(false);
    setCode("");
    setName("");
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> New course
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Create a course">
        <form onSubmit={submit} className="space-y-4">
          <Field id="code" label="Course code" hint="e.g. MSCIT-201">
            <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} required autoFocus />
          </Field>
          <Field id="name" label="Course name">
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Database Management Systems" required />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!code.trim() || !name.trim()}>
              Create course
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
