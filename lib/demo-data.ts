// Demo data so every screen can be reviewed before the backend lands.
// Phase 2+ replaces these imports with Prisma queries / API calls of the same shape.
import type {
  Assignment,
  Course,
  ImportPreviewRow,
  ReviewRow,
  Student,
  StudentAssignment,
  Submission,
} from "./types";

export const demoFaculty = { name: "Dr. Meera Desai", loginId: "meera.desai@college.edu" };

export const demoCourses: Course[] = [
  { id: "c1", code: "MSCIT-201", name: "Database Management Systems", studentCount: 3, assignmentCount: 1 },
  { id: "c2", code: "MSCIT-204", name: "Advanced Java Programming", studentCount: 0, assignmentCount: 0 },
];

export const demoStudents: Student[] = [
  { id: "s1", name: "Rahul Patel", enrollmentNo: "ENR001", disabled: false, mustChangePassword: false },
  { id: "s2", name: "Priya Shah", enrollmentNo: "ENR002", disabled: false, mustChangePassword: true },
  { id: "s3", name: "Amit Kumar", enrollmentNo: "ENR003", disabled: false, mustChangePassword: false },
];

export const demoSyllabus = {
  fileName: "DBMS_Syllabus_2026.pdf",
  uploadedAt: "2026-09-02T10:15:00Z",
  topics: [
    "ER modelling",
    "Relational algebra",
    "SQL joins and subqueries",
    "Normalization (1NF–BCNF)",
    "Transactions and concurrency control",
    "Indexing and query optimization",
  ],
  outcomes: [
    "CO1: Design a conceptual data model for a real-world domain",
    "CO2: Write correct and efficient SQL for business queries",
    "CO3: Normalize relations and justify design decisions",
    "CO4: Explain transaction isolation and its anomalies",
  ],
};

const rubric = [
  { criterion: "Schema design & ER model", maxMarks: 8, description: "Entities, keys, cardinalities match the scenario" },
  { criterion: "SQL correctness", maxMarks: 10, description: "Queries return the required results" },
  { criterion: "Normalization & justification", maxMarks: 7, description: "Relations reach 3NF/BCNF with reasoning" },
  { criterion: "Documentation & clarity", maxMarks: 5, description: "Clear report, assumptions stated" },
];

export const demoAssignments: Assignment[] = [
  {
    id: "a1",
    courseId: "c1",
    title: "Assignment 1: Relational Design for a Real Business",
    topics: ["ER modelling", "SQL joins and subqueries", "Normalization (1NF–BCNF)"],
    difficulty: "MEDIUM",
    questionCount: 3,
    totalMarks: 30,
    status: "PUBLISHED",
    dueAt: "2026-10-20T18:00:00Z",
    rubric,
  },
];

export const demoStudentAssignments: StudentAssignment[] = [
  {
    id: "sa1",
    assignmentId: "a1",
    studentId: "s1",
    version: "A1-V01",
    scenario:
      "GreenLeaf Pharmacy runs 14 branches across Ahmedabad. Each branch stocks medicines from multiple suppliers, " +
      "prescriptions must be traceable to a registered doctor, and controlled drugs need batch-level expiry tracking. " +
      "Management wants a database that flags stock below reorder level per branch.",
    instructions:
      "Submit one ZIP containing: report.pdf (or .docx) with ER diagram and normalization steps, schema.sql, and queries.sql. " +
      "State every assumption you make. Do not include executables.",
    questions: [
      { number: 1, marks: 10, text: "Design an ER model for GreenLeaf covering branches, suppliers, medicines, batches, prescriptions, and doctors. Identify keys and cardinalities.", deliverable: "ER diagram + entity list in report" },
      { number: 2, marks: 12, text: "Write SQL to list, per branch, the controlled drugs whose batches expire within 60 days and whose stock is below the reorder level.", deliverable: "schema.sql + queries.sql" },
      { number: 3, marks: 8, text: "The pharmacy's legacy sheet stores (Branch, Medicine, SupplierList, DoctorName, DoctorPhone). Normalize it to BCNF and justify each step.", deliverable: "Normalization section in report" },
    ],
  },
  {
    id: "sa2",
    assignmentId: "a1",
    studentId: "s2",
    version: "A1-V02",
    scenario:
      "SwiftCargo is a logistics startup moving parcels between 6 warehouses. Each shipment can be split across trucks, " +
      "drivers have licence categories, and customers can raise damage claims within 7 days of delivery.",
    instructions:
      "Submit one ZIP containing: report.pdf (or .docx) with ER diagram and normalization steps, schema.sql, and queries.sql. " +
      "State every assumption you make. Do not include executables.",
    questions: [
      { number: 1, marks: 10, text: "Model warehouses, shipments, shipment legs, trucks, drivers, and claims. Identify keys and cardinalities.", deliverable: "ER diagram + entity list in report" },
      { number: 2, marks: 12, text: "Write SQL to find drivers who drove a leg of any shipment that later received a damage claim, with the number of such claims per driver.", deliverable: "schema.sql + queries.sql" },
      { number: 3, marks: 8, text: "Normalize (ShipmentID, Customer, CustomerCity, TruckList, DriverName, LicenceType) to BCNF with justification.", deliverable: "Normalization section in report" },
    ],
  },
];

export const demoSubmissions: Submission[] = [
  {
    id: "sub1",
    studentAssignmentId: "sa1",
    fileName: "ENR001_assignment1.zip",
    sizeBytes: 482_113,
    submittedAt: "2026-10-08T14:22:00Z",
    status: "EVALUATED",
    files: ["report.pdf", "schema.sql", "queries.sql"],
    evaluation: {
      aiTotal: 24,
      finalTotal: 24,
      status: "PROVISIONAL",
      feedback:
        "Strong ER model with correct batch-level tracking. The expiry query misses branches with zero stock rows; use a LEFT JOIN. " +
        "Normalization reaches 3NF but the BCNF step for DoctorPhone is not justified.",
      evidence: [
        "report.pdf p.2: ER diagram includes Batch(batch_no, expiry_date) linked to Medicine",
        "queries.sql line 14: INNER JOIN stock excludes zero-stock branches",
        "report.pdf p.5: decomposition stops at 3NF",
      ],
      criteria: [
        { criterion: "Schema design & ER model", maxMarks: 8, aiMarks: 7, finalMarks: 7, comment: "Complete; supplier-medicine M:N handled well" },
        { criterion: "SQL correctness", maxMarks: 10, aiMarks: 7, finalMarks: 7, comment: "Join type drops edge cases" },
        { criterion: "Normalization & justification", maxMarks: 7, aiMarks: 5, finalMarks: 5, comment: "BCNF justification missing" },
        { criterion: "Documentation & clarity", maxMarks: 5, aiMarks: 5, finalMarks: 5, comment: "Clear, assumptions listed" },
      ],
    },
  },
];

export const demoReviewRows: ReviewRow[] = [
  { submissionId: "sub1", enrollmentNo: "ENR001", studentName: "Rahul Patel", assignmentTitle: "Assignment 1", version: "A1-V01", status: "EVALUATED", score: 24, reviewStatus: "PROVISIONAL" },
  { submissionId: "sub2", enrollmentNo: "ENR002", studentName: "Priya Shah", assignmentTitle: "Assignment 1", version: "A1-V02", status: "NEEDS_REVIEW", score: 9, reviewStatus: "PROVISIONAL" },
  { submissionId: null, enrollmentNo: "ENR003", studentName: "Amit Kumar", assignmentTitle: "Assignment 1", version: "A1-V03", status: "NOT_SUBMITTED", score: null, reviewStatus: null },
];

export const demoImportPreview: ImportPreviewRow[] = [
  { row: 2, name: "Rahul Patel", enrollmentNo: "ENR001", action: "SKIP", issue: "Already enrolled (no changes)" },
  { row: 3, name: "Priya R. Shah", enrollmentNo: "ENR002", action: "UPDATE", issue: "Name changed from “Priya Shah”" },
  { row: 4, name: "Amit Kumar", enrollmentNo: "ENR003", action: "SKIP", issue: "Already enrolled (no changes)" },
  { row: 5, name: "Neha Joshi", enrollmentNo: "ENR004", action: "CREATE" },
  { row: 6, name: "Karan Mehta", enrollmentNo: "ENR005", action: "CREATE" },
  { row: 7, name: "", enrollmentNo: "ENR006", action: "SKIP", issue: "Missing student name" },
  { row: 8, name: "Sneha Rao", enrollmentNo: "ENR005", action: "SKIP", issue: "Duplicate enrollment number in file (row 6)" },
];

/** The logged-in demo student for student pages. */
export const demoCurrentStudent = demoStudents[0];

/* An earlier, already-graded assignment so student "Marks" has published results to show. */
demoAssignments.unshift({
  id: "a0",
  courseId: "c1",
  title: "Assignment 0: SQL Warm-up",
  topics: ["SQL joins and subqueries"],
  difficulty: "EASY",
  questionCount: 2,
  totalMarks: 30,
  status: "PUBLISHED",
  dueAt: "2026-09-15T18:00:00Z",
  rubric: [
    { criterion: "Query correctness", maxMarks: 15, description: "Results match the requirement" },
    { criterion: "Use of joins & subqueries", maxMarks: 10, description: "Appropriate constructs chosen" },
    { criterion: "Explanation", maxMarks: 5, description: "Each query explained briefly" },
  ],
});

demoStudentAssignments.unshift({
  id: "sa0",
  assignmentId: "a0",
  studentId: "s1",
  version: "A0-V01",
  scenario: "A college canteen tracks orders, menu items, and daily specials. Write queries for the canteen manager's weekly report.",
  instructions: "Submit one ZIP containing queries.sql and a short explanation (PDF or DOCX).",
  questions: [
    { number: 1, marks: 18, text: "List the top 5 items by revenue each week, including items that had zero sales.", deliverable: "queries.sql" },
    { number: 2, marks: 12, text: "Find students who ordered a daily special on every weekday of a given week.", deliverable: "queries.sql + explanation" },
  ],
});

demoSubmissions.unshift({
  id: "sub0",
  studentAssignmentId: "sa0",
  fileName: "ENR001_warmup.zip",
  sizeBytes: 38_204,
  submittedAt: "2026-09-14T09:41:00Z",
  status: "EVALUATED",
  files: ["queries.sql", "explanation.pdf"],
  evaluation: {
    aiTotal: 25,
    finalTotal: 26,
    status: "APPROVED",
    feedback:
      "Well-structured queries. The LEFT JOIN with COALESCE for zero-sale items is exactly right. " +
      "For Q2, relational division via NOT EXISTS is elegant; mention why it is preferred over COUNT-based checks.",
    evidence: ["queries.sql line 3: LEFT JOIN menu_items with COALESCE(SUM(...), 0)", "queries.sql line 21: double NOT EXISTS"],
    criteria: [
      { criterion: "Query correctness", maxMarks: 15, aiMarks: 14, finalMarks: 14, comment: "Both queries correct" },
      { criterion: "Use of joins & subqueries", maxMarks: 10, aiMarks: 8, finalMarks: 9, comment: "Strong use of NOT EXISTS" },
      { criterion: "Explanation", maxMarks: 5, aiMarks: 3, finalMarks: 3, comment: "Brief; could justify approach" },
    ],
  },
});

export interface StudentAssignmentView {
  assignment: Assignment;
  sa: StudentAssignment;
  submissions: Submission[];
  latest?: Submission;
}

/** Everything a student may see: only their own assignment versions and submissions. */
export function studentView(studentId: string): StudentAssignmentView[] {
  return demoStudentAssignments
    .filter((sa) => sa.studentId === studentId)
    .map((sa) => {
      const assignment = demoAssignments.find((a) => a.id === sa.assignmentId)!;
      const submissions = demoSubmissions
        .filter((s) => s.studentAssignmentId === sa.id)
        .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
      return { assignment, sa, submissions, latest: submissions[0] };
    })
    .sort((a, b) => b.assignment.dueAt.localeCompare(a.assignment.dueAt));
}

/** Faculty view of one submission with its student and assignment version. */
export function submissionDetail(submissionId: string) {
  const submission = demoSubmissions.find((s) => s.id === submissionId);
  if (!submission) return null;
  const sa = demoStudentAssignments.find((x) => x.id === submission.studentAssignmentId)!;
  const assignment = demoAssignments.find((a) => a.id === sa.assignmentId)!;
  const student = demoStudents.find((s) => s.id === sa.studentId)!;
  return { submission, sa, assignment, student };
}

/* A submission the pipeline couldn't evaluate automatically. */
demoSubmissions.push({
  id: "sub2",
  studentAssignmentId: "sa2",
  fileName: "ENR002_assign1.zip",
  sizeBytes: 1_904_331,
  submittedAt: "2026-10-09T21:05:00Z",
  status: "NEEDS_REVIEW",
  files: ["report_scan.pdf", "schema.sql"],
  rejectedFiles: ["tools/setup.exe"],
  reviewReason: "report_scan.pdf contains scanned images with no extractable text, so the ER model and normalization answers could not be read automatically.",
  evaluation: {
    aiTotal: 9,
    finalTotal: 9,
    status: "PROVISIONAL",
    feedback: "Only schema.sql could be evaluated. Report content was unreadable; please review the PDF manually.",
    evidence: ["schema.sql: 6 tables with primary/foreign keys for warehouses, shipments, legs, trucks, drivers, claims"],
    criteria: [
      { criterion: "Schema design & ER model", maxMarks: 8, aiMarks: 5, finalMarks: 5, comment: "Schema present; ER diagram unreadable" },
      { criterion: "SQL correctness", maxMarks: 10, aiMarks: 4, finalMarks: 4, comment: "queries.sql missing" },
      { criterion: "Normalization & justification", maxMarks: 7, aiMarks: 0, finalMarks: 0, comment: "Could not read report" },
      { criterion: "Documentation & clarity", maxMarks: 5, aiMarks: 0, finalMarks: 0, comment: "Could not read report" },
    ],
  },
});
