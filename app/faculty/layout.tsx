import { FacultyShell } from "@/components/portal-shells";
import { demoFaculty } from "@/lib/demo-data";

// Phase 2: read the session server-side and redirect anyone who isn't faculty.
export default function FacultyLayout({ children }: { children: React.ReactNode }) {
  return <FacultyShell user={{ name: demoFaculty.name, sub: demoFaculty.loginId }}>{children}</FacultyShell>;
}
