import { StudentShell } from "@/components/portal-shells";
import { demoCurrentStudent } from "@/lib/demo-data";

// Phase 2: read the session server-side, redirect non-students, and force /change-password when required.
export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return <StudentShell user={{ name: demoCurrentStudent.name, sub: demoCurrentStudent.enrollmentNo }}>{children}</StudentShell>;
}
