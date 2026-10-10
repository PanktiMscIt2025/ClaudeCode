"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "./db";
import { audit } from "./audit";
import { requireUser } from "./auth";
import { enqueue } from "./jobs";
import { releaseSubmissionFile } from "./evaluation";
import { findOwnedSubmission } from "./faculty-data";
import type { ActionResult } from "./course-actions";

const saveSchema = z.object({
  criteria: z.array(z.object({ id: z.string(), finalMarks: z.number().finite() })).max(20),
  feedback: z.string().max(4000),
  approve: z.boolean(),
});

/** Save faculty marks/feedback, optionally approving (which publishes them to the student). Audit-logged. */
export async function saveEvaluationAction(submissionId: string, input: z.input<typeof saveSchema>): Promise<ActionResult<{ total: number }>> {
  const user = await requireUser("FACULTY");
  const parsed = saveSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid marks." };
  const sub = await findOwnedSubmission(submissionId, user.id);
  if (!sub?.evaluation) return { ok: false, error: "Evaluation not found." };
  if (sub.studentAssignment.submissions[0]?.id !== sub.id) return { ok: false, error: "A newer submission exists. Review the latest one instead." };

  const ev = sub.evaluation;
  const updates = new Map(parsed.data.criteria.map((c) => [c.id, c.finalMarks]));
  const changes: { criterion: string; from: number; to: number }[] = [];
  for (const c of ev.criteria) {
    const v = updates.get(c.id);
    if (v === undefined) continue;
    if (v < 0 || v > c.maxMarks || Math.round(v * 2) !== v * 2) return { ok: false, error: `${c.criterion}: marks must be between 0 and ${c.maxMarks}, in steps of 0.5.` };
    if (v !== c.finalMarks) changes.push({ criterion: c.criterion, from: c.finalMarks, to: v });
  }
  const total = ev.criteria.reduce((s, c) => s + (updates.get(c.id) ?? c.finalMarks), 0);
  const approve = parsed.data.approve;

  await db.$transaction(async (tx) => {
    for (const ch of changes) {
      const c = ev.criteria.find((x) => x.criterion === ch.criterion)!;
      await tx.evaluationCriterion.update({ where: { id: c.id }, data: { finalMarks: ch.to } });
    }
    await tx.evaluation.update({
      where: { id: ev.id },
      data: {
        finalTotal: total,
        feedback: parsed.data.feedback,
        ...(approve ? { status: "APPROVED", approvedById: user.id, approvedAt: new Date() } : {}),
      },
    });
    if (approve && sub.status !== "EVALUATED") await tx.submission.update({ where: { id: sub.id }, data: { status: "EVALUATED" } });
    if (changes.length || parsed.data.feedback !== ev.feedback || approve) {
      await audit(
        user.id,
        approve ? "GRADE_APPROVED" : ev.status === "APPROVED" ? "APPROVED_GRADE_CHANGED" : "GRADE_UPDATED",
        `submission:${sub.id}`,
        { student: sub.studentAssignment.student.loginId, aiTotal: ev.aiTotal, from: ev.finalTotal, to: total, changes, feedbackChanged: parsed.data.feedback !== ev.feedback },
        tx,
      );
    }
  });
  if (approve) await releaseSubmissionFile(sub.id);
  revalidatePath(`/faculty/submissions/${sub.id}`);
  revalidatePath("/faculty");
  return { ok: true, total };
}

export async function rerunEvaluationAction(submissionId: string): Promise<ActionResult> {
  const user = await requireUser("FACULTY");
  const sub = await findOwnedSubmission(submissionId, user.id);
  if (!sub) return { ok: false, error: "Submission not found." };
  if (sub.evaluation?.status === "APPROVED") return { ok: false, error: "Approved marks can't be re-evaluated." };
  if (!sub.storedPath) return { ok: false, error: "The original file is no longer stored." };
  await db.submission.update({ where: { id: sub.id }, data: { status: "QUEUED", reviewReason: null } });
  await enqueue("EVALUATE_SUBMISSION", { submissionId: sub.id });
  await audit(user.id, "EVALUATION_RERUN", `submission:${sub.id}`, {});
  revalidatePath(`/faculty/submissions/${sub.id}`);
  return { ok: true };
}
