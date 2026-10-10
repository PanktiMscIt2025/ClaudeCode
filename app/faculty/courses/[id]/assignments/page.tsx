import { demoAssignments, demoStudentAssignments, demoStudents, demoSyllabus } from "@/lib/demo-data";
import { AssignmentStudio } from "./assignment-studio";

export default async function AssignmentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <AssignmentStudio
      assignments={demoAssignments.filter((a) => a.courseId === id)}
      topics={demoSyllabus.topics}
      students={demoStudents}
      sampleVersions={demoStudentAssignments.filter((s) => s.assignmentId === "a1")}
    />
  );
}
