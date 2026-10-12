import { Card, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/server/auth";
import { AccountPasswordForm } from "./password-form";

export default async function AccountPage() {
  const user = await requireUser("STUDENT");
  const s = { name: user.name, enrollmentNo: user.loginId };
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader title="Account" description="Your login details and password." />
      <Card>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-ink-subtle">Name</dt>
            <dd className="mt-0.5 font-semibold">{s.name}</dd>
          </div>
          <div>
            <dt className="text-ink-subtle">Enrollment number (login ID)</dt>
            <dd className="mt-0.5 font-mono font-semibold">{s.enrollmentNo}</dd>
          </div>
        </dl>
      </Card>
      <Card>
        <h2 className="mb-5 font-display text-lg font-bold">Change password</h2>
        <AccountPasswordForm />
      </Card>
    </div>
  );
}
