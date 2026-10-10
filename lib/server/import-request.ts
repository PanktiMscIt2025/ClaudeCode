import "server-only";
import { findOwnedCourse } from "./courses";
import { ExcelError, readFirstSheet } from "./excel";
import { jsonError, mb, routeUser, tooLarge } from "./http";
import { classifyRows, detectColumns, type ColumnMapping } from "./student-import";

/** Shared parsing for the import preview/commit routes. Returns a Response on any failure. */
export async function readImportRequest(req: Request, courseId: string) {
  const user = await routeUser(req, "FACULTY");
  if (user instanceof Response) return user;
  const course = await findOwnedCourse(courseId, user.id);
  if (!course) return jsonError(404, "Course not found.");

  const maxBytes = mb("MAX_EXCEL_MB", 5);
  if (tooLarge(req, maxBytes)) return jsonError(413, `The file is larger than ${maxBytes / 1024 / 1024} MB.`);
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!form || !(file instanceof File)) return jsonError(400, "Choose an Excel file to upload.");
  if (file.size > maxBytes) return jsonError(413, `The file is larger than ${maxBytes / 1024 / 1024} MB.`);

  let sheet;
  try {
    sheet = await readFirstSheet(await file.arrayBuffer(), file.name);
  } catch (e) {
    return jsonError(400, e instanceof ExcelError ? e.message : "We couldn't read this file.");
  }

  const detection = detectColumns(sheet);
  let mapping: ColumnMapping = detection.mapping;
  const raw = form.get("mapping");
  if (typeof raw === "string" && raw) {
    try {
      const m = JSON.parse(raw) as ColumnMapping;
      const width = sheet.rows[m.headerRow]?.cells.length ?? 0;
      const ok = [m.headerRow, m.name, m.enrollment].every(Number.isInteger) && m.name !== m.enrollment && m.name >= 0 && m.enrollment >= 0 && m.name < width && m.enrollment < width;
      if (!ok) return jsonError(400, "Pick two different columns for name and enrollment number.");
      mapping = m;
    } catch {
      return jsonError(400, "Invalid column mapping.");
    }
  }
  const updateNames = form.get("updateNames") !== "false";
  const rows = await classifyRows(course.id, sheet, mapping, updateNames);
  return { user, course, file, detection, mapping, rows, headers: sheet.rows[mapping.headerRow].cells };
}
