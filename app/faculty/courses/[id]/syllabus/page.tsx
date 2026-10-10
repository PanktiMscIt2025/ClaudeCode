import { demoSyllabus } from "@/lib/demo-data";
import { SyllabusEditor } from "./syllabus-editor";

export default function SyllabusPage() {
  return <SyllabusEditor initial={demoSyllabus} />;
}
