import { ImportWizard } from "./import-wizard";

export default async function ImportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ImportWizard courseId={id} />;
}
