import { readImportRequest } from "@/lib/server/import-request";
import { credentialsWorkbook, importErrorWorkbook } from "@/lib/server/excel";
import { commitImport } from "@/lib/server/student-import";
import { jsonError } from "@/lib/server/http";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const r = await readImportRequest(req, (await params).id);
  if (r instanceof Response) return r;
  if (!r.rows.some((x) => x.action !== "SKIP")) return jsonError(400, "There are no valid new or changed students to import.");

  let result;
  try {
    result = await commitImport(r.course.id, r.user.id, r.rows);
  } catch {
    // The transaction rolled back, so nothing was half-imported.
    return jsonError(409, "The import couldn't be completed and no changes were saved. Please try again.");
  }
  const label = `${r.course.code} · ${r.course.name}`;
  return Response.json(
    {
      created: result.created,
      updated: result.updated,
      skipped: result.skipped,
      // Returned once, never stored: the browser turns these into downloads.
      credentialsXlsx: result.credentials.length ? (await credentialsWorkbook(label, result.credentials)).toString("base64") : null,
      errorReportXlsx: result.skippedRows.length ? (await importErrorWorkbook(result.skippedRows)).toString("base64") : null,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
