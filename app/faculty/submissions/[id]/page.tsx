import { notFound } from "next/navigation";
import { submissionDetail } from "@/lib/demo-data";
import { EvaluationReview } from "./evaluation-review";

export default async function SubmissionReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = submissionDetail(id);
  if (!detail) notFound();
  return <EvaluationReview {...detail} />;
}
