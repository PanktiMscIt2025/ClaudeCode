import { readImportRequest } from "@/lib/server/import-request";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const r = await readImportRequest(req, (await params).id);
  if (r instanceof Response) return r;
  const visible = r.rows.filter((x) => x.issue !== "Empty row");
  return Response.json({
    fileName: r.file.name,
    headers: r.headers,
    mapping: r.mapping,
    confident: r.detection.confident,
    rows: visible.map(({ row, name, enrollmentNo, action, issue }) => ({ row, name, enrollmentNo, action, issue })),
  });
}
