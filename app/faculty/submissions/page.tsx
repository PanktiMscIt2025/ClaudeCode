import { PageHeader } from "@/components/ui";
import { ReviewTable } from "@/components/review-table";
import { demoReviewRows } from "@/lib/demo-data";

export default function SubmissionsPage() {
  return (
    <div>
      <PageHeader
        title="Submissions"
        description="Open a submission to inspect the evaluation, adjust marks, and approve. Students see marks only after approval."
      />
      <ReviewTable rows={demoReviewRows} />
    </div>
  );
}
