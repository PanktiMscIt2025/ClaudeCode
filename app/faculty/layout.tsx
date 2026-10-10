import { FacultyShell } from "@/components/portal-shells";
import { requireUser } from "@/lib/server/auth";

export default async function FacultyLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("FACULTY");
  return <FacultyShell user={{ name: user.name, sub: user.loginId }}>{children}</FacultyShell>;
}
