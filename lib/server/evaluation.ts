import { db } from "./db";
import { aiEnabled, aiEvaluate, AiError, type AiEvaluation } from "./ai";
import { offlineEvaluate } from "./offline";
import { parseJson } from "./json";
import { withTempZip } from "./storage";
import { extractSubmission, ZipRejected } from "./zip";
import type { Question, RubricCriterion } from "@/lib/types";

const half = (n: number) => Math.round(n * 2) / 2;

/** Align AI criteria to the rubric by name and clamp every mark to [0, max]. AI output is never trusted blindly. */
export function alignCriteria(rubric: RubricCriterion[], result: AiEvaluation) {
  const byName = new Map(result.criteria.map((c) => [c.criterion.trim().toLowerCase(), c]));
  return rubric.map((r, i) => {
    const c = byName.get(r.criterion.trim().toLowerCase()) ?? result.criteria[i];
    const marks = c ? Math.min(r.maxMarks, Math.max(0, half(Number(c.marks) || 0))) : 0;
    return { position: i, criterion: r.criterion, maxMarks: r.maxMarks, aiMarks: marks, finalMarks: marks, comment: c?.comment?.slice(0, 500) ?? "Not assessed" };
  });
}

/** Job: evaluate one submission against the student's exact assignment version. */
export async function runEvaluation(submissionId: string) {
  const sub = await db.submission.findUnique({
    where: { id: submissionId },
    include: { studentAssignment: true, evaluation: true },
  });
  if (!sub || sub.evaluation?.status === "APPROVED") return;
  await db.submission.update({ where: { id: sub.id }, data: { status: "EVALUATING" } });

  const sa = sub.studentAssignment;
  const rubric = parseJson<RubricCriterion[]>(sa.rubric, []);
  const questions = parseJson<Question[]>(sa.questions, []);
  const modelSolution = parseJson<unknown>(sa.modelSolution, {});
  const file = await db.submissionFile.findUnique({ where: { submissionId: sub.id } });
  if (!file) throw new Error("The uploaded file is missing from storage.");

  let extracted;
  try {
    extracted = await withTempZip(file.data, extractSubmission);
  } catch (e) {
    if (!(e instanceof ZipRejected)) throw e;
    await saveResult(sub.id, rubric, null, { files: [], rejected: [], text: "", reviewReason: e.message });
    return;
  }

  const notes: string[] = [];
  if (extracted.rejected.length) notes.push(`${extracted.rejected.length} file(s) were blocked or unsupported`);
  if (extracted.unreadable.length) notes.push(`no text could be read from: ${extracted.unreadable.slice(0, 5).join(", ")}`);
  if (extracted.images.length && !extracted.text) notes.push("the submission only contains images");
  if (extracted.truncated) notes.push("the submission was long, so only part of it was evaluated");

  const base = {
    files: [...extracted.accepted, ...extracted.images],
    rejected: extracted.rejected,
    text: extracted.text,
  };

  if (!extracted.text.trim()) {
    await saveResult(sub.id, rubric, null, { ...base, reviewReason: `No readable documents or source files were found (${notes.join("; ") || "empty ZIP"}). Please review manually.` });
    return;
  }

  const input = { scenario: sa.scenario, questions, rubric, modelSolution, submissionText: extracted.text };
  let result: AiEvaluation;
  try {
    result = aiEnabled() ? await aiEvaluate(input) : offlineEvaluate(input);
  } catch (e) {
    if (e instanceof AiError && /rate-limited/.test(e.message)) throw e; // let the queue retry later
    if (!(e instanceof AiError)) throw e;
    result = offlineEvaluate(input);
    result.reviewReason = `AI evaluation failed (${e.message}); marks are an offline estimate.`;
  }

  const reasons = [result.readable ? "" : "The evaluator could not find answers to the assignment in the submission.", result.reviewReason.trim(), notes.length ? `Note: ${notes.join("; ")}.` : ""].filter(Boolean);
  await saveResult(sub.id, rubric, result, { ...base, reviewReason: reasons.join(" ") || null, needsReview: !result.readable || Boolean(result.reviewReason.trim()) });
}

async function saveResult(
  submissionId: string,
  rubric: RubricCriterion[],
  result: AiEvaluation | null,
  info: { files: string[]; rejected: string[]; text: string; reviewReason: string | null; needsReview?: boolean },
) {
  const criteria = result
    ? alignCriteria(rubric, result)
    : rubric.map((r, i) => ({ position: i, criterion: r.criterion, maxMarks: r.maxMarks, aiMarks: 0, finalMarks: 0, comment: "Needs manual marking" }));
  const total = half(criteria.reduce((s, c) => s + c.aiMarks, 0));
  const needsReview = !result || info.needsReview;

  await db.$transaction(async (tx) => {
    await tx.evaluation.deleteMany({ where: { submissionId } });
    await tx.evaluation.create({
      data: {
        submissionId,
        aiTotal: total,
        finalTotal: total,
        feedback: result?.feedback.slice(0, 4000) ?? "",
        evidence: JSON.stringify((result?.evidence ?? []).slice(0, 12).map((e) => e.slice(0, 400))),
        status: "PROVISIONAL",
        criteria: { create: criteria },
      },
    });
    await tx.submission.update({
      where: { id: submissionId },
      data: {
        status: needsReview ? "NEEDS_REVIEW" : "EVALUATED",
        reviewReason: info.reviewReason,
        files: JSON.stringify(info.files),
        rejectedFiles: JSON.stringify(info.rejected),
        extractedText: info.text.slice(0, 150_000) || null,
      },
    });
  });
}

export async function markEvaluationFailed(submissionId: string, error: string) {
  await db.submission
    .update({ where: { id: submissionId }, data: { status: "FAILED", reviewReason: `Automatic evaluation failed: ${error}` } })
    .catch(() => {});
}

/** Retention: the original ZIP is kept for faculty review and deleted once marks are approved. */
export async function releaseSubmissionFile(submissionId: string) {
  if (process.env.KEEP_SUBMISSION_FILES === "true") return;
  await db.submissionFile.deleteMany({ where: { submissionId } });
}
