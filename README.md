---
# Hugging Face Spaces settings (see DEPLOY.md); ignored elsewhere.
title: AssignAI
emoji: 📝
colorFrom: indigo
colorTo: purple
sdk: docker
app_port: 3000
pinned: false
---

# AssignAI

A lightweight AI-assisted assignment management web app for college faculty and students.

- Faculty import a class list from Excel, and student logins are created automatically with one-time temporary passwords.
- Faculty upload a syllabus, and the AI (Anthropic Claude or Google Gemini) writes a unique scenario-based assignment for every student, with a shared rubric and model solutions.
- Students sign in with their enrollment number, read their own scenario, and upload one ZIP file.
- Each ZIP is extracted safely and evaluated against the student's exact version. Marks out of 30 stay provisional until faculty approve them.
- Faculty export a formatted marks workbook (.xlsx).

One Next.js app runs on one server, with all data in PostgreSQL (a free [Neon](https://neon.tech) database works). There are no microservices or extra infrastructure. See [`PLAN.md`](PLAN.md) for the architecture.

## Requirements

- Node.js 20.9+ (developed on Node 22)
- npm
- A PostgreSQL database: either a free [Neon](https://neon.tech) database (nothing to install) or a local PostgreSQL server
- An AI key for generation and evaluation: either an [Anthropic API key](https://console.anthropic.com/) or a [Google Gemini API key](https://aistudio.google.com/apikey). This is optional: without one the app uses a built-in offline generator and estimator, and labels everything it produces as offline.

## Setup

```bash
npm install                 # also generates the Prisma client
cp .env.example .env        # then set DATABASE_URL in .env (see Configuration)
npm run db:setup            # create the tables and the first faculty account
npm run dev                 # http://localhost:3000
```

Sign in at `/login` (Faculty tab) with `SEED_FACULTY_EMAIL` / `SEED_FACULTY_PASSWORD` from `.env`. With the sample password `ChangeMe-2026`, you must choose a new one on first sign-in.

### Production

**To get a free shareable link, see [`DEPLOY.md`](DEPLOY.md)** (Hugging Face Spaces + Neon, Render, or any Docker host).

Without Docker:

```bash
npm run build
npm run db:migrate          # apply migrations to the production database
npm start                   # serves on port 3000; put it behind HTTPS (nginx, Caddy, …)
```

Run a single instance. The login rate limiter and the background job worker are in-process, by design.

### Commands

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and server |
| `npm run lint` | TypeScript type-check |
| `npm run db:setup` | Apply migrations, generate the client, and seed the first faculty account |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:seed` | Create the faculty account from `.env` (safe to re-run) |
| `npm run test:e2e` | Full acceptance test with the offline generator (needs Playwright's Chromium: `npx playwright install chromium`) |
| `npm run test:e2e:ai` | The same test against a local mock of the Claude API, which checks the request format and the AI code path |
| `npm run test:e2e:gemini` | The same test against a local mock of the Gemini API |

The acceptance test starts its own server on port 3100. It **wipes and reuses** a separate test database, `E2E_DATABASE_URL` (default `postgresql://assignai:assignai@localhost:5432/assignai_e2e`; the name must contain `e2e` or `test`). Stop any running `npm run dev` first.

## Configuration (`.env`)

| Variable | Default | Purpose |
|---|---|---|
| `DATABASE_URL` | none (required) | PostgreSQL connection string, e.g. from Neon |
| `DIRECT_URL` | derived | Direct (non-pooled) connection for migrations. Only needed for poolers other than Neon's. |
| `ANTHROPIC_API_KEY` | empty | Use Anthropic Claude for AI. Server-side only, never sent to the browser. |
| `ANTHROPIC_MODEL` | `claude-opus-5-5` | Claude model |
| `GEMINI_API_KEY` | empty | Use Google Gemini for AI instead. Server-side only. |
| `GEMINI_MODEL` | `gemini-flash-latest` | Gemini model (the default always points to the newest Flash model) |
| `AI_PROVIDER` | automatic | `anthropic` or `gemini`, only needed if both keys are set (otherwise Claude is used) |
| `SEED_FACULTY_EMAIL` / `_NAME` / `_PASSWORD` | see `.env.example` | First faculty account |
| `MAX_ZIP_MB` / `MAX_EXCEL_MB` / `MAX_SYLLABUS_MB` | 20 / 5 / 10 | Upload limits |
| `KEEP_SUBMISSION_FILES` | `false` | Uploaded ZIPs are stored in the database and deleted once their marks are approved |
| `COOKIE_SECURE` | `true` in production | Set to `false` only if you must serve over plain HTTP on a campus LAN |

Additional faculty accounts can be added by re-running the seed with different `SEED_FACULTY_*` values.

## How it works

**Student import** (Course → Import Excel)
1. Upload an `.xlsx` file. Name and enrollment-number columns are detected from common header names. If detection isn't confident, a column-mapping screen appears.
2. The preview validates every row (missing values, duplicates in the file, invalid IDs) and shows which rows will be created, updated, or skipped.
3. Confirming runs the import in one database transaction. New students get a random 12-character temporary password; only its scrypt hash is stored.
4. The credentials workbook and an error report are returned once for download. They are never stored.
5. Re-imports never duplicate accounts or reset passwords. A toggle controls whether names are updated.
6. Lost the sheet? *Students → Credential sheet* issues new temporary passwords to students who haven't signed in yet.

Old `.xls` files must be re-saved as `.xlsx`. The only `.xls` reader available (SheetJS) is blocked in this build environment, so the app explains this when someone uploads one.

**Assignment generation** (Course → Syllabus → Assignments)
- Topics and learning outcomes are extracted from the PDF/DOCX syllabus, and faculty can edit them.
- Generation runs as a background job. One shared *blueprint* (rubric plus per-question skill, marks, and deliverable) keeps every version comparable. Versions are then written four at a time, each in a different setting. Students are referred to only by anonymous keys, so no student data is sent to the AI.
- Versions are compared for near-duplicates. Flagged versions must be regenerated before publishing. Publishing freezes each student's exact version.

**Submission and evaluation**
- One ZIP per upload. The file is checked for extension, ZIP signature, size, entry count, total size, and compression ratio (zip bombs). Symlinks, encrypted entries, unsafe paths, executables, and nested archives are rejected. Archive paths are never used as disk paths.
- A background job extracts text from PDFs, DOCX, and source files in a private temp directory, deletes the directory, and evaluates against the student's rubric. AI marks are clamped to each criterion's maximum.
- Unreadable or partial submissions are flagged *Needs review*. Uploaded code is never executed.
- Faculty can edit any criterion and the feedback, then approve. Students see marks only after approval; provisional marks are never sent to their browser. Every grade change and password reset is audit-logged.

## Security summary

- Passwords: scrypt hashes; random temporary passwords; forced change on first sign-in; passwords never logged or stored in readable form.
- Sessions: random tokens in httpOnly, SameSite=Lax cookies (Secure in production), stored hashed, 12-hour expiry. Password resets and disabling an account end all of that user's sessions.
- Authorization: checked server-side on every page, action, and route. Every course, assignment, and submission query is scoped to its owner.
- Login rate limiting: 5 failures per account and IP, and 30 per IP, in 15 minutes. Uploads are rate-limited too.
- Inputs are validated with zod. State-changing upload routes reject cross-origin requests.
- Uploads are stored in the database (never in a public folder) and downloaded only through authorized routes.
- AI keys live only in server environment variables. No student names or IDs are sent to the AI. Prompts mark student work as data, so instructions inside a submission are ignored.

## Project layout

```
app/                    Pages (faculty/, student/, login/, change-password/) and API routes (api/)
components/             UI components, app shell, icons
lib/server/             Server-only code: db, auth, sessions, Excel, ZIP, AI, jobs, data access, actions
lib/                    Shared types, formatting, password rules
prisma/                 Schema, migrations, seed
tests/                  Playwright acceptance test, fixtures, mock AI APIs (Claude and Gemini)
scripts/e2e-server.mjs  Isolated test server for the acceptance test
```
