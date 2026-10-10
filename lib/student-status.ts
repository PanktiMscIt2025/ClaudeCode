import type { Submission } from "./types";

export const studentSteps = ["Assigned", "Submitted", "Evaluated", "Marks out"];

/** Index of the active step in `studentSteps` for a student's latest submission. */
export function studentStep(latest?: Submission): number {
  if (!latest) return 1;
  if (latest.evaluation?.status === "APPROVED") return 4;
  if (latest.status === "EVALUATED" || latest.status === "NEEDS_REVIEW") return 3;
  return 2;
}

/** Plain-language status for students. AI marks are never shown until faculty approve. */
export function studentStatusText(latest?: Submission): string {
  if (!latest) return "Not submitted yet";
  if (latest.evaluation?.status === "APPROVED") return "Marks published";
  if (latest.status === "QUEUED" || latest.status === "EVALUATING") return "Received: being checked";
  return "Submitted: waiting for teacher review";
}
