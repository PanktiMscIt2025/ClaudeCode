import { StudentShell } from "@/components/portal-shells";
import { requireUser } from "@/lib/server/auth";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("STUDENT");
  return <StudentShell user={{ name: user.name, sub: user.loginId }}>{children}</StudentShell>;
}
