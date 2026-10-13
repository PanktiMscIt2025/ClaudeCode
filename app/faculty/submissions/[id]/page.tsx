import { notFound } from "next/navigation";
import { requireUser } from "@/lib/server/auth";
import { findOwnedSubmission } from "@/lib/server/faculty-data";
import { parseJson } from "@/lib/server/json";
import { AutoRefresh } from "@/components/auto-refresh";
import type { Question, SubmissionStatus } from "@/lib/types";
import { EvaluationReview } from "./evaluation-review";

export default async function SubmissionReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser("FACULTY");
  const sub = await findOwnedSubmission((await params).id, user.id);
  if (!sub) notFound();
  const sa = sub.studentAssignment;
  const ev = sub.evaluation;
  const pending = sub.status === "QUEUED" || sub.status === "EVALUATING";

  return (
    <>
      <AutoRefresh active={pending} />
      <EvaluationReview
        key={`${sub.id}:${ev?.id ?? "none"}:${ev?.updatedAt.toISOString() ?? ""}`}
        submission={{
          id: sub.id,
          fileName: sub.fileName,
          sizeBytes: sub.sizeBytes,
          submittedAt: sub.submittedAt.toISOString(),
          status: sub.status as SubmissionStatus,
          files: parseJson<string[]>(sub.files, []),
          rejected: parseJson<string[]>(sub.rejectedFiles, []),
          extractedText: sub.extractedText ?? "",
          reviewReason: sub.reviewReason,
          hasFile: Boolean(sub.file),
          isLatest: sa.submissions[0]?.id === sub.id,
          history: sa.submissions.map((s) => ({ id: s.id, submittedAt: s.submittedAt.toISOString() })),
        }}
        student={{ name: sa.student.name, enrollmentNo: sa.student.loginId }}
        assignment={{ title: sa.assignment.title, code: sa.assignment.code, totalMarks: sa.assignment.totalMarks, version: sa.version, scenario: sa.scenario, questions: parseJson<Question[]>(sa.questions, []) }}
        evaluation={
          ev
            ? {
                aiTotal: ev.aiTotal,
                status: ev.status as "PROVISIONAL" | "APPROVED",
                feedback: ev.feedback,
                aiFeedback: ev.feedback,
                evidence: parseJson<string[]>(ev.evidence, []),
                criteria: ev.criteria.map((c) => ({ id: c.id, criterion: c.criterion, maxMarks: c.maxMarks, aiMarks: c.aiMarks, finalMarks: c.finalMarks, comment: c.comment })),
              }
            : null
        }
      />
    </>
  );
}
