import { Badge } from "@/components/ui";
import type { AssignmentStatus, EvaluationStatus, SubmissionStatus } from "@/lib/types";

const submissionLabels: Record<SubmissionStatus, [string, "gray" | "blue" | "green" | "amber" | "red"]> = {
  NOT_SUBMITTED: ["Not submitted", "gray"],
  QUEUED: ["Queued", "blue"],
  EVALUATING: ["Evaluating", "blue"],
  EVALUATED: ["Evaluated", "green"],
  NEEDS_REVIEW: ["Needs review", "amber"],
  FAILED: ["Failed", "red"],
};

export function SubmissionBadge({ status }: { status: SubmissionStatus }) {
  const [label, tone] = submissionLabels[status];
  return <Badge tone={tone}>{label}</Badge>;
}

export function ReviewBadge({ status }: { status: EvaluationStatus | null }) {
  if (!status) return <span className="text-slate-400">—</span>;
  return status === "APPROVED" ? <Badge tone="green">Approved</Badge> : <Badge tone="amber">Provisional</Badge>;
}

export function AssignmentBadge({ status }: { status: AssignmentStatus }) {
  const map = {
    DRAFT: ["Draft", "gray"],
    GENERATING: ["Generating", "blue"],
    REVIEW: ["Awaiting review", "amber"],
    PUBLISHED: ["Published", "green"],
  } as const;
  const [label, tone] = map[status];
  return <Badge tone={tone}>{label}</Badge>;
}
