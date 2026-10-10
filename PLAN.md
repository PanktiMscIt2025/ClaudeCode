# AssignAI — Implementation Plan

A lightweight, AI-assisted assignment management web app for college faculty and students.
One Next.js (TypeScript) app runs on one server. There are no microservices.

## 1. Stack

| Concern | Choice | Why |
|---|---|---|
| App (UI + API) | Next.js 15 App Router, TypeScript | One codebase and one deploy |
| UI | Tailwind CSS 4, a small set of in-house components (`components/ui`) | No UI-kit dependency |
| DB | Prisma + SQLite by default; switch `provider` to `postgresql` for concurrent multi-user deploys | Zero-ops default |
| AI | Anthropic Claude API (`@anthropic-ai/sdk`), server-only | The key never reaches the browser |
| Excel | ExcelJS (import roster, export marks/credentials) | |
| Files | `unpdf` (PDF text), `mammoth` (DOCX text), `yauzl` (streamed ZIP with limits) | |
| Auth | Session cookie (random token, hashed in DB), `bcryptjs` password hashes, role checks on every server route | |
| Jobs | DB-backed job table + in-process worker loop (no Redis) for AI generation and evaluation | |

## 2. Phases

1. **Plan + frontend** (this step): all faculty and student pages, shared layout, components, and typed demo data so every screen can be reviewed.
2. **Data + auth**: Prisma schema, seed faculty, login/logout, sessions, login rate limiting, role guard middleware, forced password change on first login.
3. **Student import**: Excel parsing, header detection, column mapping, preview/validation, transactional upsert, credential workbook (generated once and streamed, never stored), error report, reset/disable.
4. **Syllabus + generation**: PDF/DOCX text extraction, Claude topic/outcome extraction, batched per-student scenario generation with rubric + model solution, similarity check, faculty review, and publish. The exact issued version is snapshotted.
5. **Submission + evaluation**: ZIP upload with size/type limits, safe extraction (entry count, total uncompressed size, ratio, path traversal, symlinks, extension allow-list) to a temp dir, text gathering, Claude rubric scoring (criterion marks totalling 30), provisional status, faculty approve/override with an audit log, and temp cleanup.
6. **Dashboards + export**: stats, searchable table, and a formatted marks `.xlsx`.
7. **Acceptance test** script covering the full workflow (AI mocked when `ANTHROPIC_API_KEY` is unset). Update the README.

## 3. Data model (Prisma)

- `User`: id, role (FACULTY|STUDENT), loginId (email or enrollment no., unique), name, passwordHash, mustChangePassword, disabled
- `Session`: tokenHash, userId, expiresAt
- `Course`: id, code, name, facultyId
- `CourseStudent`: courseId, studentId (unique pair)
- `Syllabus`: courseId, fileName, extractedText, topics (JSON), outcomes (JSON)
- `Assignment`: courseId, title, topics, difficulty, questionCount, totalMarks (30), status (DRAFT|GENERATING|REVIEW|PUBLISHED), dueAt
- `StudentAssignment`: assignmentId, studentId, version, scenario, questions/rubric/modelSolution (JSON snapshot), fingerprint, status
- `Submission`: studentAssignmentId, fileName, size, storedPath (private dir), submittedAt, status (QUEUED|EVALUATING|EVALUATED|NEEDS_REVIEW|FAILED)
- `Evaluation`: submissionId, aiTotal, finalTotal, feedback, evidence, status (PROVISIONAL|APPROVED), approvedById
- `EvaluationCriterion`: evaluationId, criterion, maxMarks, aiMarks, finalMarks, comment
- `AuditLog`: actorId, action, target, details, createdAt
- `Job`: type, payload, status, attempts, error (background queue)

## 4. Routes

**Faculty pages**: `/login`, `/faculty` (dashboard), `/faculty/courses`, `/faculty/courses/[id]/students` (list, reset, disable, credential export), `/faculty/courses/[id]/import`, `/faculty/courses/[id]/syllabus`, `/faculty/courses/[id]/assignments` (generate + review), `/faculty/submissions` and `/faculty/submissions/[id]` (evaluation review), `/faculty/export`.

**Student pages**: `/login`, `/change-password`, `/student` (dashboard), `/student/assignment`, `/student/submit`, `/student/history`, `/student/marks`.

**API** (`/api/...`, all role-checked server-side): `auth/login|logout|change-password`, `courses`, `courses/[id]/import/preview|commit`, `courses/[id]/students/[sid]/reset|disable`, `courses/[id]/syllabus`, `assignments`, `assignments/[id]/generate|publish`, `student/assignment`, `student/submissions`, `submissions/[id]/evaluation`, `export/marks`.

## 5. Security checklist

bcrypt hashes; random 12-char temporary passwords; credentials never logged or persisted; httpOnly + SameSite cookies; server-side ownership checks on every student query; login rate limit; zod input validation; upload size/type limits; safe ZIP extraction; private storage outside `public/`; audit logs for grade changes and resets; `ANTHROPIC_API_KEY` only in server env; uploaded code is never executed.
