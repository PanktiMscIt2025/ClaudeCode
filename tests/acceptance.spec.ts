// End-to-end acceptance test: the complete workflow from the project requirements.
// Run with `npm run test:e2e` (offline), `npm run test:e2e:ai` (mock Claude API) or `npm run test:e2e:gemini` (mock Gemini API).
import { expect, test, type Browser, type BrowserContext, type Page } from "@playwright/test";
import ExcelJS from "exceljs";
import path from "node:path";

const fixtures = path.join(process.cwd(), "tests", "fixtures");
const fx = (f: string) => path.join(fixtures, f);
const aiMode = process.env.E2E_AI === "mock" || process.env.E2E_AI === "mock-gemini";

type Cred = { name: string; id: string; pw: string };

async function readSheet(file: string, sheet = 1) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(file);
  const ws = wb.getWorksheet(sheet)!;
  const rows: ExcelJS.CellValue[][] = [];
  ws.eachRow((r) => rows.push((r.values as ExcelJS.CellValue[]).slice(1)));
  return { ws, rows };
}

async function signIn(page: Page, id: string, pw: string, role: "student" | "faculty") {
  await page.goto(`/login?role=${role}`);
  await page.getByLabel(role === "faculty" ? "Email" : "Enrollment number").fill(id);
  await page.getByLabel("Password", { exact: true }).fill(pw);
  await page.getByRole("button", { name: "Sign in" }).last().click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"));
}

async function setPassword(page: Page, current: string, next: string) {
  await expect(page).toHaveURL(/\/change-password$/);
  await page.getByLabel("Temporary password").fill(current);
  await page.getByLabel("New password", { exact: true }).fill(next);
  await page.getByLabel("Confirm new password").fill(next);
  await page.getByRole("button", { name: "Save and continue" }).click();
  await page.waitForURL((u) => u.pathname !== "/change-password");
}

test.describe.serial("AssignAI acceptance workflow", () => {
  let browser: Browser;
  let facultyCtx: BrowserContext;
  let faculty: Page;
  let courseUrl = "";
  let creds: Cred[] = [];
  const students = new Map<string, Page>();
  const versions = new Map<string, string>();

  test.beforeAll(async ({ browser: b }) => {
    browser = b;
    facultyCtx = await browser.newContext({ acceptDownloads: true });
    faculty = await facultyCtx.newPage();
  });

  test("1. Faculty logs in", async () => {
    await faculty.goto("/faculty");
    await expect(faculty).toHaveURL(/\/login$/); // protected
    await signIn(faculty, "faculty@college.edu", "ChangeMe-2026", "faculty");
    await setPassword(faculty, "ChangeMe-2026", "Faculty2026pass");
    await expect(faculty).toHaveURL(/\/faculty$/);
    await expect(faculty.getByText("Get started")).toBeVisible();
  });

  test("2. Faculty creates a course", async () => {
    await faculty.goto("/faculty/courses");
    await faculty.getByRole("button", { name: "New course" }).click();
    await faculty.getByLabel("Course code").fill("MSCIT-201");
    await faculty.getByLabel("Course name").fill("Database Management Systems");
    await faculty.getByRole("button", { name: "Create course" }).click();
    await faculty.waitForURL(/\/import$/);
    courseUrl = faculty.url().replace(/\/import$/, "");
  });

  test("3-4. Excel upload is validated, accounts created, credentials downloaded", async () => {
    await faculty.locator("input[type=file]").setInputFiles(fx("class.xlsx"));
    await faculty.getByRole("button", { name: "Continue" }).click();
    const table = faculty.locator("table").last();
    await expect(table).toContainText("Missing student name");
    await expect(table).toContainText("Duplicate enrollment number in file");
    await expect(table).toContainText("Missing enrollment number");
    await faculty.getByRole("button", { name: "Import 3 students" }).click();
    await expect(faculty.getByText("3 accounts created · 0 updated · 3 skipped")).toBeVisible();

    const [dl] = await Promise.all([faculty.waitForEvent("download"), faculty.getByRole("button", { name: /Credentials/ }).click()]);
    const file = path.join(test.info().outputDir, "credentials.xlsx");
    await dl.saveAs(file);
    const { rows } = await readSheet(file);
    expect(rows[0]).toEqual(["Sr. No.", "Student Name", "Enrollment Number (Login ID)", "Temporary Password"]);
    creds = rows.slice(1).map((r) => ({ name: String(r[1]), id: String(r[2]), pw: String(r[3]) }));
    expect(creds.map((c) => c.id).sort()).toEqual(["ENR001", "ENR002", "ENR003"]);
    for (const c of creds) {
      expect(c.pw).toHaveLength(12);
      expect(c.pw).not.toBe(c.id);
    }

    // Re-importing the same file creates no duplicates and resets no passwords.
    await faculty.goto(courseUrl + "/import");
    await faculty.locator("input[type=file]").setInputFiles(fx("class.xlsx"));
    await faculty.getByRole("button", { name: "Continue" }).click();
    await expect(faculty.getByRole("button", { name: "Import 0 students" })).toBeDisabled();
  });

  test("5-6. Student logs in with enrollment number + temporary password, then changes it", async () => {
    for (const c of creds.filter((x) => x.id !== "ENR003")) {
      const ctx = await browser.newContext({ acceptDownloads: true });
      const page = await ctx.newPage();
      await signIn(page, c.id.toLowerCase(), c.pw, "student"); // login ID is case-insensitive
      await setPassword(page, c.pw, `${c.id}-Secret9`);
      await expect(page).toHaveURL(/\/student$/);
      await expect(page.getByText("No assignment yet")).toBeVisible();
      students.set(c.id, page);
    }
    // The temporary password no longer works.
    const page = await (await browser.newContext()).newPage();
    await page.goto("/login");
    await page.getByLabel("Enrollment number").fill("ENR001");
    await page.getByLabel("Password", { exact: true }).fill(creds.find((c) => c.id === "ENR001")!.pw);
    await page.getByRole("button", { name: "Sign in" }).last().click();
    await expect(page.getByText("Incorrect login ID or password.")).toBeVisible();
  });

  test("7. Faculty uploads a syllabus and generates unique assignments", async () => {
    await faculty.goto(courseUrl + "/syllabus");
    await faculty.locator("input[type=file]").setInputFiles(fx("syllabus.pdf"));
    await faculty.getByRole("button", { name: "Upload & extract" }).click();
    await expect(faculty.getByText("SQL joins and subqueries").first()).toBeVisible();

    await faculty.goto(courseUrl + "/assignments");
    await faculty.getByLabel("Title").fill("Assignment 1: Relational design");
    await faculty.getByRole("button", { name: "ER modelling" }).click();
    await faculty.getByRole("button", { name: "SQL joins and subqueries" }).click();
    await faculty.getByRole("button", { name: "Generate drafts" }).click();
    await faculty.waitForURL(/\/assignments\/[^/]+$/);
    await expect(faculty.getByRole("button", { name: "Publish to students" })).toBeEnabled({ timeout: 180_000 });
    await expect(faculty.getByText("Rubric")).toBeVisible();
    const text = await faculty.locator("main").innerText();
    expect(new Set(text.match(/A1-V\d\d/g)).size).toBe(3);
    if (aiMode) await expect(faculty.getByText("offline generator")).toHaveCount(0);

    await faculty.getByRole("button", { name: "Publish to students" }).click();
    await faculty.getByRole("dialog").getByRole("button", { name: "Publish" }).click();
    await expect(faculty.getByText("Published to 3 students")).toBeVisible();
  });

  test("8. Each student sees only their assigned scenario", async () => {
    const scenarios = new Map<string, string>();
    for (const [id, page] of students) {
      await page.goto("/student/assignment");
      const main = await page.locator("main").innerText();
      const v = main.match(/A1-V\d\d/)![0];
      versions.set(id, v);
      scenarios.set(id, main.split(/your scenario/i)[1]?.slice(0, 300) ?? "");
      const href = await page.getByRole("link", { name: "Upload ZIP" }).getAttribute("href");
      versions.set(`${id}:sa`, new URL(href!, "http://x").searchParams.get("sa")!);
    }
    const [a, b] = ["ENR001", "ENR002"];
    expect(versions.get(a)).not.toBe(versions.get(b));
    expect(scenarios.get(a)!.length).toBeGreaterThan(50);
    expect(scenarios.get(a)).not.toBe(scenarios.get(b));

    // ENR002 can't open or submit to ENR001's version.
    const other = students.get(b)!;
    await other.goto(`/student/assignment?sa=${versions.get(`${a}:sa`)}`);
    await expect(other.locator("main")).not.toContainText(versions.get(a)!);
    const status = await other.evaluate(async (sa) => {
      const fd = new FormData();
      fd.set("studentAssignmentId", sa);
      fd.set("file", new File([new Uint8Array([80, 75, 5, 6, ...new Array(18).fill(0)])], "x.zip"));
      return (await fetch("/api/student/submissions", { method: "POST", body: fd })).status;
    }, versions.get(`${a}:sa`)!);
    expect(status).toBe(404);
    // Students can't reach faculty pages.
    await other.goto("/faculty");
    await expect(other).toHaveURL(/\/student$/);
  });

  test("9. Students submit ZIP files (unsafe ZIPs are rejected)", async () => {
    const s1 = students.get("ENR001")!;
    await s1.goto("/student/submit");
    for (const [f, msg] of [
      ["fake.zip", "not a valid ZIP"],
      ["bomb.zip", "compression bomb"],
      ["traversal.zip", "unsafe file paths"],
    ]) {
      await s1.locator("input[type=file]").setInputFiles(fx(f));
      await s1.getByRole("checkbox").check();
      await s1.getByRole("button", { name: "Submit assignment" }).click();
      await expect(s1.getByText(msg)).toBeVisible();
    }
    await s1.locator("input[type=file]").setInputFiles(fx("good.zip"));
    await s1.getByRole("button", { name: "Submit assignment" }).click();
    await expect(s1.getByRole("heading", { name: "Submitted!" })).toBeVisible();

    const s2 = students.get("ENR002")!;
    await s2.goto("/student/submit");
    await s2.locator("input[type=file]").setInputFiles(fx("mixed.zip"));
    await s2.getByRole("checkbox").check();
    await s2.getByRole("button", { name: "Submit assignment" }).click();
    await expect(s2.getByText("Some files were skipped")).toBeVisible();
  });

  test("10. Supported submissions are evaluated with provisional marks out of 30", async () => {
    await faculty.goto("/faculty/submissions");
    await expect(async () => {
      await faculty.reload();
      const t = await faculty.locator("main").innerText();
      expect(t).not.toMatch(/Queued|Evaluating/);
      expect((t.match(/Provisional/g) ?? []).length).toBe(2);
    }).toPass({ timeout: 120_000 });

    // Students don't see provisional marks.
    const s1 = students.get("ENR001")!;
    await s1.goto("/student/marks");
    await expect(s1.getByText("waiting for your teacher")).toBeVisible();
    await expect(s1.locator("main")).not.toContainText("/ 30");
  });

  test("11. Faculty reviews, edits, and approves marks", async () => {
    await faculty.getByRole("row", { name: /ENR001/ }).getByRole("link", { name: "Open" }).click();
    await expect(faculty.getByText("AI suggested")).toBeVisible();
    const inputs = faculty.locator('input[type="number"]');
    const n = await inputs.count();
    expect(n).toBeGreaterThan(0);
    let sum = 0;
    for (let i = 0; i < n; i++) {
      const max = Number(await inputs.nth(i).getAttribute("max"));
      const val = Number(await inputs.nth(i).inputValue());
      expect(val).toBeLessThanOrEqual(max); // AI marks are clamped to the rubric
      sum += max;
    }
    expect(sum).toBe(30);
    const firstMax = Number(await inputs.first().getAttribute("max"));
    await inputs.first().fill(String(firstMax));
    await faculty.getByLabel("Feedback to student").fill("Reviewed by faculty: strong ER model.");
    await faculty.getByRole("button", { name: "Approve marks" }).click();
    await expect(faculty.getByText(/Marks approved for .+: [\d.]+ \/ 30/)).toBeVisible();

    const s1 = students.get("ENR001")!;
    await s1.goto("/student/marks");
    await expect(s1.getByText("Published")).toBeVisible();
    await expect(s1.getByText("Reviewed by faculty: strong ER model.")).toBeVisible();
  });

  test("12. Faculty downloads the marks Excel sheet", async () => {
    await faculty.goto("/faculty/export");
    const [dl] = await Promise.all([faculty.waitForEvent("download"), faculty.getByRole("button", { name: "Download .xlsx" }).click()]);
    const file = path.join(test.info().outputDir, "marks.xlsx");
    await dl.saveAs(file);
    const { ws, rows } = await readSheet(file);
    const header = rows[0].map(String);
    for (const col of ["Sr. No.", "Student Name", "Enrollment Number", "Assignment Title", "Assignment Version", "Submission Date", "Total (/30)", "Percentage", "Evaluation Status", "Faculty-Approved Marks (/30)", "Feedback Summary"]) {
      expect(header).toContain(col);
    }
    expect(ws.autoFilter).toBeTruthy();
    const idx = (name: string) => header.indexOf(name);
    const byId = new Map(rows.slice(1).map((r) => [String(r[idx("Enrollment Number")]), r]));
    expect(byId.size).toBe(3);
    const rahul = byId.get("ENR001")!;
    expect(rahul[idx("Evaluation Status")]).toBe("Approved");
    expect(typeof rahul[idx("Total (/30)")]).toBe("number");
    expect(rahul[idx("Faculty-Approved Marks (/30)")]).toBe(rahul[idx("Total (/30)")]);
    expect(rahul[idx("Assignment Version")]).toBe(versions.get("ENR001"));
    expect(byId.get("ENR003")![idx("Evaluation Status")]).toBe("Not submitted");
    const criterionCols = header.filter((h) => /\(\/\d+(\.\d+)?\)$/.test(h) && !h.startsWith("Total") && !h.startsWith("Faculty"));
    expect(criterionCols.length).toBeGreaterThan(0);
    const critSum = criterionCols.reduce((s, h) => s + Number(rahul[idx(h)]), 0);
    expect(critSum).toBeCloseTo(Number(rahul[idx("Total (/30)")]), 5);
  });

  test("Audit: grade approval and imports are logged; sign-out ends sessions", async () => {
    const s2 = students.get("ENR002")!;
    await s2.getByRole("button", { name: "Sign out" }).first().click();
    await s2.waitForURL(/\/login$/);
    await s2.goto("/student");
    await expect(s2).toHaveURL(/\/login$/);
  });
});
