import { db } from "./db";
import { audit } from "./audit";
import { generateTempPassword, hashPassword } from "./password";
import type { SheetData } from "./excel";
import type { ImportPreviewRow } from "@/lib/types";

export interface ColumnMapping {
  headerRow: number; // index into SheetData.rows
  name: number;
  enrollment: number;
}

export interface Detection {
  headers: string[];
  mapping: ColumnMapping;
  confident: boolean;
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

const NAME_EXACT = new Set(["studentname", "name", "fullname", "nameofstudent", "nameofthestudent", "studentfullname", "candidatename"]);
const ENR_EXACT = new Set([
  "enrollmentnumber", "enrollmentno", "enrolmentnumber", "enrolmentno", "enrollment", "enrolment", "enrollmentid",
  "enrno", "enrollno", "rollno", "rollnumber", "prn", "prnno", "studentid", "registrationno", "registrationnumber", "regno",
]);
const isNameish = (h: string) => NAME_EXACT.has(h) || (h.includes("name") && !h.includes("father") && !h.includes("mother") && !h.includes("course"));
const isEnrollish = (h: string) => ENR_EXACT.has(h) || h.includes("enrol") || h.includes("roll") || h.includes("prn");

/** Find the header row and the two columns. Confident only when both headers match known names exactly. */
export function detectColumns(sheet: SheetData): Detection {
  for (let r = 0; r < Math.min(10, sheet.rows.length - 1); r++) {
    const hs = sheet.rows[r].cells.map(norm);
    const nameExact = hs.findIndex((h) => NAME_EXACT.has(h));
    const enrExact = hs.findIndex((h) => ENR_EXACT.has(h));
    if (nameExact >= 0 && enrExact >= 0 && nameExact !== enrExact) {
      return { headers: sheet.rows[r].cells, mapping: { headerRow: r, name: nameExact, enrollment: enrExact }, confident: true };
    }
  }
  for (let r = 0; r < Math.min(10, sheet.rows.length - 1); r++) {
    const hs = sheet.rows[r].cells.map(norm);
    const name = hs.findIndex(isNameish);
    const enr = hs.findIndex(isEnrollish);
    if (name >= 0 && enr >= 0 && name !== enr) {
      return { headers: sheet.rows[r].cells, mapping: { headerRow: r, name, enrollment: enr }, confident: false };
    }
  }
  const headers = sheet.rows[0].cells;
  return { headers, mapping: { headerRow: 0, name: 0, enrollment: Math.min(1, headers.length - 1) }, confident: false };
}

export const normalizeEnrollment = (s: string) => s.replace(/\s+/g, "").toUpperCase();
const normalizeName = (s: string) => s.replace(/\s+/g, " ").trim();
const ENROLLMENT_RE = /^[A-Z0-9][A-Z0-9\-/_.]{0,39}$/;

export interface Classified extends ImportPreviewRow {
  existingUserId?: string;
  rename?: boolean;
  enroll?: boolean;
}

/** Validate every row and decide create / update / skip against the database. Pure read; no writes. */
export async function classifyRows(courseId: string, sheet: SheetData, mapping: ColumnMapping, updateNames: boolean): Promise<Classified[]> {
  const dataRows = sheet.rows.slice(mapping.headerRow + 1);
  const parsed = dataRows.map((r) => ({
    row: r.rowNumber,
    name: normalizeName(r.cells[mapping.name] ?? "").slice(0, 120),
    enrollmentNo: normalizeEnrollment(r.cells[mapping.enrollment] ?? ""),
  }));

  const ids = Array.from(new Set(parsed.map((p) => p.enrollmentNo).filter(Boolean)));
  const existing = await db.user.findMany({
    where: { loginId: { in: ids } },
    include: { enrollments: { where: { courseId }, select: { id: true } } },
  });
  const byLogin = new Map(existing.map((u) => [u.loginId, u]));
  const firstSeen = new Map<string, number>();

  return parsed.map((p): Classified => {
    if (!p.name && !p.enrollmentNo) return { ...p, action: "SKIP", issue: "Empty row" };
    if (!p.name) return { ...p, action: "SKIP", issue: "Missing student name" };
    if (!p.enrollmentNo) return { ...p, action: "SKIP", issue: "Missing enrollment number" };
    if (!ENROLLMENT_RE.test(p.enrollmentNo)) return { ...p, action: "SKIP", issue: "Enrollment number has invalid characters" };
    const dup = firstSeen.get(p.enrollmentNo);
    if (dup !== undefined) return { ...p, action: "SKIP", issue: `Duplicate enrollment number in file (row ${dup})` };
    firstSeen.set(p.enrollmentNo, p.row);

    const user = byLogin.get(p.enrollmentNo);
    if (!user) return { ...p, action: "CREATE" };
    if (user.role !== "STUDENT") return { ...p, action: "SKIP", issue: "This ID belongs to a faculty account" };

    const enroll = user.enrollments.length === 0;
    const nameDiffers = user.name !== p.name;
    const rename = nameDiffers && updateNames;
    const notes: string[] = [];
    if (rename) notes.push(`Name changed from “${user.name}”`);
    if (enroll) notes.push("Existing account added to this course");
    if (user.disabled) notes.push("account stays disabled");
    if (rename || enroll) return { ...p, action: "UPDATE", issue: notes.join("; "), existingUserId: user.id, rename, enroll };
    return {
      ...p,
      action: "SKIP",
      issue: nameDiffers ? "Name differs (updates turned off)" : "Already enrolled (no changes)",
      existingUserId: user.id,
    };
  });
}

export interface CommitResult {
  created: number;
  updated: number;
  skipped: number;
  credentials: { name: string; enrollmentNo: string; password: string }[];
  skippedRows: { row: number; name: string; enrollmentNo: string; issue: string }[];
}

/**
 * Apply an import in one transaction: new accounts get a random temporary password (hash stored only),
 * existing accounts are never given a new password. Plaintext passwords are returned once and not persisted.
 */
export async function commitImport(courseId: string, actorId: string, rows: Classified[]): Promise<CommitResult> {
  const toCreate = rows.filter((r) => r.action === "CREATE");
  const credentials = toCreate.map((r) => ({ name: r.name, enrollmentNo: r.enrollmentNo, password: generateTempPassword() }));

  // Hash before opening the transaction: scrypt is slow by design and runs in parallel on the thread pool.
  const hashes: string[] = [];
  for (let i = 0; i < credentials.length; i += 16) {
    hashes.push(...(await Promise.all(credentials.slice(i, i + 16).map((c) => hashPassword(c.password)))));
  }

  const updates = rows.filter((r) => r.action === "UPDATE");
  await db.$transaction(
    async (tx) => {
      for (let i = 0; i < credentials.length; i++) {
        const c = credentials[i];
        await tx.user.create({
          data: {
            role: "STUDENT",
            loginId: c.enrollmentNo,
            name: c.name,
            passwordHash: hashes[i],
            mustChangePassword: true,
            enrollments: { create: { courseId } },
          },
        });
      }
      for (const u of updates) {
        if (u.rename) await tx.user.update({ where: { id: u.existingUserId }, data: { name: u.name } });
        if (u.enroll) await tx.courseStudent.create({ data: { courseId, studentId: u.existingUserId! } });
      }
      await audit(actorId, "STUDENTS_IMPORTED", `course:${courseId}`, { created: credentials.length, updated: updates.length }, tx);
    },
    { timeout: 60_000 },
  );

  const skippedRows = rows.filter((r) => r.action === "SKIP" && r.issue !== "Empty row").map((r) => ({ row: r.row, name: r.name, enrollmentNo: r.enrollmentNo, issue: r.issue ?? "" }));
  return { created: credentials.length, updated: updates.length, skipped: skippedRows.length, credentials, skippedRows };
}
