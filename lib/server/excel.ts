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

export interface MarksRow {
  name: string;
  enrollmentNo: string;
  version: string;
  submittedAt: Date | null;
  criteria: Map<string, number>; // criterion → final marks
  total: number | null;
  status: string;
  approvedTotal: number | null;
  feedback: string;
}

/** Formatted marks sheet: header styling, filters, frozen header, numeric score cells, summary sheet. */
export async function marksWorkbook(info: { courseLabel: string; title: string; code: string; totalMarks: number; rubric: { criterion: string; maxMarks: number }[] }, rows: MarksRow[]) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "AssignAI";
  wb.created = new Date();
  const ws = wb.addWorksheet("Marks");
  const crit = info.rubric.map((r, i) => ({ header: `${r.criterion} (/${r.maxMarks})`, key: `c${i}`, width: Math.min(Math.max(r.criterion.length + 8, 14), 32) }));
  ws.columns = [
    { header: "Sr. No.", key: "sr", width: 8 },
    { header: "Student Name", key: "name", width: 28 },
    { header: "Enrollment Number", key: "enrollmentNo", width: 20 },
    { header: "Assignment Title", key: "title", width: 36 },
    { header: "Assignment Version", key: "version", width: 18 },
    { header: "Submission Date", key: "submittedAt", width: 20 },
    ...crit,
    { header: `Total (/${info.totalMarks})`, key: "total", width: 13 },
    { header: "Percentage", key: "pct", width: 12 },
    { header: "Evaluation Status", key: "status", width: 20 },
    { header: `Faculty-Approved Marks (/${info.totalMarks})`, key: "approved", width: 18 },
    { header: "Feedback Summary", key: "feedback", width: 60 },
  ];
  rows.forEach((r, i) => {
    const row: Record<string, unknown> = {
      sr: i + 1,
      name: r.name,
      enrollmentNo: r.enrollmentNo,
      title: info.title,
      version: r.version,
      submittedAt: r.submittedAt ?? "Not submitted",
      total: r.total,
      pct: r.total === null ? null : r.total / info.totalMarks,
      status: r.status,
      approved: r.approvedTotal,
      feedback: r.feedback.length > 300 ? r.feedback.slice(0, 297) + "…" : r.feedback,
    };
    info.rubric.forEach((c, j) => (row[`c${j}`] = r.criteria.get(c.criterion) ?? null));
    ws.addRow(row);
  });
  ws.getColumn("submittedAt").numFmt = "dd-mmm-yyyy hh:mm";
  ws.getColumn("pct").numFmt = "0.0%";
  for (const key of ["total", "approved", ...crit.map((c) => c.key)]) {
    ws.getColumn(key).numFmt = "0.0";
    ws.getColumn(key).alignment = { horizontal: "right" };
  }
  ws.getColumn("feedback").alignment = { wrapText: true, vertical: "top" };
  styleHeader(ws);
  ws.getRow(1).alignment = { vertical: "middle", wrapText: true };
  ws.getRow(1).height = 34;

  const scored = rows.filter((r) => r.approvedTotal !== null).map((r) => r.approvedTotal!);
  const s = wb.addWorksheet("Summary");
  s.columns = [{ width: 32 }, { width: 50 }];
  [
    ["Course", info.courseLabel],
    ["Assignment", `${info.code} · ${info.title}`],
    ["Exported", new Date()],
    ["Students", rows.length],
    ["Submitted", rows.filter((r) => r.submittedAt).length],
    ["Marks approved", scored.length],
    [`Average approved marks (/${info.totalMarks})`, scored.length ? Math.round((scored.reduce((a, b) => a + b, 0) / scored.length) * 10) / 10 : "—"],
    ["Note", "Totals marked “Provisional” are AI suggestions that faculty have not yet approved."],
  ].forEach((r) => s.addRow(r));
  s.getColumn(1).font = { bold: true };
  s.getCell("B3").numFmt = "dd-mmm-yyyy hh:mm";
  return toBuffer(wb);
}
