"use client";

import { Button } from "@/components/ui";
import { Download } from "@/components/icons";
import type { Assignment, StudentAssignment } from "@/lib/types";

/** Downloads the student's own assignment as a plain-text file. Phase 4 swaps this for a server-rendered PDF. */
export function DownloadInstructions({ assignment, sa }: { assignment: Assignment; sa: StudentAssignment }) {
  function download() {
    const lines = [
      assignment.title,
      `Version: ${sa.version}`,
      `Due: ${new Date(assignment.dueAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`,
      `Total marks: ${assignment.totalMarks}`,
      "",
      "SCENARIO",
      sa.scenario,
      "",
      "QUESTIONS",
      ...sa.questions.flatMap((q) => [`Q${q.number} (${q.marks} marks): ${q.text}`, `   Deliverable: ${q.deliverable}`]),
      "",
      "SUBMISSION INSTRUCTIONS",
      sa.instructions,
      "",
      "RUBRIC",
      ...assignment.rubric.map((r) => `- ${r.criterion} (${r.maxMarks}): ${r.description}`),
    ];
    const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${sa.version}_instructions.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Button variant="secondary" className="w-full" onClick={download}>
      <Download className="h-4 w-4" /> Download instructions
    </Button>
  );
}
