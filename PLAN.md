# AssignAI — Implementation Plan

A lightweight, AI-assisted assignment management web app for college faculty and students.
One Next.js (TypeScript) app runs on one server. There are no microservices.

## 1. Stack (as built)

| Concern | Choice | Notes |
|---|---|---|
| App (UI + API) | Next.js 16 App Router, TypeScript | Server actions for forms; route handlers for uploads and downloads |
| UI | Tailwind CSS 4, in-house components (`components/ui`) | Semantic color tokens, light/dark, self-hosted fonts |
| DB | Prisma 7 + PostgreSQL (`@prisma/adapter-pg`) | A free Neon database works; uploaded ZIPs are stored in it too, so the app container is stateless |
| AI | Anthropic Claude (`@anthropic-ai/sdk`) or Google Gemini (`@google/genai`), server-only | Same Zod schemas for both; structured JSON output, validated; offline fallback without a key |
| Excel | ExcelJS | Import roster; export credentials, error report, marks |
| Files | `unpdf` (PDF), `mammoth` (DOCX), `yauzl` (ZIP, with limits) | |
| Auth | scrypt hashes (Node built-in), hashed session tokens in httpOnly cookies | Role guards in `lib/server/auth.ts` |
| Jobs | DB-backed `Job` table + one in-process worker | Retries, backoff, crash recovery |
| Tests | Playwright acceptance test + mock Claude/Gemini APIs | `npm run test:e2e`, `test:e2e:ai`, `test:e2e:gemini` |

## 2. Phases

1. **Plan + frontend**: done
2. **Data + auth**: done (sessions, rate limiting, role guards, forced password change)
3. **Student import**: done (detection and mapping, validation, transactional commit, one-time credentials, reset/disable, credential re-issue)
4. **Syllabus + generation**: done (extraction, blueprint + batched versions, similarity check, review, publish)
5. **Submission + evaluation**: done (safe ZIP handling, evaluation job, faculty approve/override with audit log)
6. **Dashboards + export**: done
7. **Acceptance test + README**: done

## 3. Data model

`User`, `Session`, `Course`, `CourseStudent`, `Syllabus`, `Assignment` (with shared rubric and blueprint), `StudentAssignment` (the exact version issued to each student), `Submission`, `SubmissionFile` (the uploaded ZIP, deleted after approval), `Evaluation`, `EvaluationCriterion`, `AuditLog`, and `Job`. JSON-shaped fields are stored as TEXT and validated in `lib/server` so the schema stays simple and portable.

## 4. Known limitations

- Legacy `.xls` files must be re-saved as `.xlsx` (no maintained, installable `.xls` reader was available).
- Scanned (image-only) PDFs aren't read by OCR; such submissions are flagged for manual review.
- The rate limiter and job worker are in-process, so run a single server instance.
