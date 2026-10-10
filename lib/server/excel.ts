import ExcelJS from "exceljs";

export const MAX_IMPORT_ROWS = 5000;
const MAX_COLS = 50;

export interface SheetData {
  /** Non-empty rows as trimmed strings, with their 1-based sheet row numbers. */
  rows: { rowNumber: number; cells: string[] }[];
}

export class ExcelError extends Error {}

function cellText(cell: ExcelJS.Cell): string {
  const v = cell.value;
  if (v === null || v === undefined) return "";
  if (typeof v === "object" && "result" in v) return String(v.result ?? "").trim(); // formula
  if (typeof v === "object" && "richText" in v) return v.richText.map((r) => r.text).join("").trim();
  if (typeof v === "object" && "text" in v) return String(v.text).trim(); // hyperlink
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v).trim();
}

/** Read the first non-empty worksheet of an .xlsx file. */
export async function readFirstSheet(buffer: ArrayBuffer, fileName: string): Promise<SheetData> {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".xls")) {
    throw new ExcelError("This is the older .xls format. Open it in Excel and choose File → Save As → Excel Workbook (.xlsx), then upload again.");
  }
  if (!lower.endsWith(".xlsx")) throw new ExcelError("Please upload an Excel .xlsx file.");

  const wb = new ExcelJS.Workbook();
  try {
    await wb.xlsx.load(buffer);
  } catch {
    throw new ExcelError("We couldn't read this file. Make sure it's a valid Excel workbook (.xlsx).");
  }

  const sheet = wb.worksheets.find((ws) => ws.actualRowCount > 0);
  if (!sheet) throw new ExcelError("The workbook is empty.");

  const rows: SheetData["rows"] = [];
  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rows.length > MAX_IMPORT_ROWS + 10) return;
    const cells: string[] = [];
    const count = Math.min(row.cellCount, MAX_COLS);
    for (let c = 1; c <= count; c++) cells.push(cellText(row.getCell(c)));
    if (cells.some(Boolean)) rows.push({ rowNumber, cells });
  });
  if (rows.length < 2) throw new ExcelError("The sheet needs a header row and at least one student.");
  if (rows.length > MAX_IMPORT_ROWS + 1) throw new ExcelError(`Too many rows. Import at most ${MAX_IMPORT_ROWS} students at a time.`);
  return { rows };
}

/* ───────────── Workbook builders ───────────── */

const HEADER_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF5B3DF5" } };

export function styleHeader(ws: ExcelJS.Worksheet) {
  const header = ws.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = HEADER_FILL;
  header.alignment = { vertical: "middle" };
  header.height = 22;
  ws.views = [{ state: "frozen", ySplit: 1 }];
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: ws.columnCount } };
}

export async function toBuffer(wb: ExcelJS.Workbook): Promise<Buffer> {
  return Buffer.from(await wb.xlsx.writeBuffer());
}

export async function credentialsWorkbook(courseLabel: string, rows: { name: string; enrollmentNo: string; password: string }[]) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "AssignAI";
  const ws = wb.addWorksheet("Credentials");
  ws.columns = [
    { header: "Sr. No.", key: "sr", width: 9 },
    { header: "Student Name", key: "name", width: 32 },
    { header: "Enrollment Number (Login ID)", key: "enrollmentNo", width: 30 },
    { header: "Temporary Password", key: "password", width: 24 },
  ];
  rows.forEach((r, i) => ws.addRow({ sr: i + 1, ...r }));
  ws.getColumn("password").font = { name: "Consolas" };
  styleHeader(ws);
  const note = wb.addWorksheet("Read me");
  note.getColumn(1).width = 100;
  [
    `Course: ${courseLabel}`,
    `Generated: ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`,
    "",
    "Students sign in with their enrollment number and this temporary password, then must choose a new password.",
    "These passwords are not stored by AssignAI and cannot be shown again. Share them privately and delete this file after distribution.",
  ].forEach((line) => note.addRow([line]));
  return toBuffer(wb);
}

export async function importErrorWorkbook(rows: { row: number; name: string; enrollmentNo: string; issue: string }[]) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Skipped rows");
  ws.columns = [
    { header: "Sheet Row", key: "row", width: 11 },
    { header: "Student Name", key: "name", width: 32 },
    { header: "Enrollment Number", key: "enrollmentNo", width: 22 },
    { header: "Reason", key: "issue", width: 60 },
  ];
  rows.forEach((r) => ws.addRow(r));
  styleHeader(ws);
  return toBuffer(wb);
}
