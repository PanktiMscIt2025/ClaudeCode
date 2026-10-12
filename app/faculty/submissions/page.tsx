import { PageHeader } from "@/components/ui";
import { ReviewTable } from "@/components/review-table";
import { AutoRefresh } from "@/components/auto-refresh";
import { requireUser } from "@/lib/server/auth";
import { getReviewRows } from "@/lib/server/faculty-data";

export default async function SubmissionsPage() {
  const user = await requireUser("FACULTY");
  const rows = await getReviewRows(user.id);
  return (
    <div>
      <AutoRefresh active={rows.some((r) => r.status === "QUEUED" || r.status === "EVALUATING")} ms={4000} />
      <PageHeader
        title="Submissions"
        description="Open a submission to inspect the evaluation, adjust marks, and approve. Students see marks only after approval."
      />
      <ReviewTable rows={rows} />
    </div>
  );
}
