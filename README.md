# AssignAI

A lightweight, AI-assisted assignment management web app for college faculty and students:
Excel roster import with automatic student logins, unique scenario-based assignments generated from a syllabus,
ZIP submissions, provisional AI marks out of 30 that faculty approve, and Excel marks export.

See [`PLAN.md`](PLAN.md) for the full architecture, data model, and phase plan.

## Status

| Phase | Scope | State |
|---|---|---|
| 1 | Plan, design system, all faculty and student pages | **Done** (pages run on sample data) |
| 2 | Prisma + SQLite, sessions, login rate limiting, role guards, forced password change | Next |
| 3 | Excel import/export of students and credentials (ExcelJS), reset and disable | Planned |
| 4 | Syllabus extraction and Claude assignment generation | Planned |
| 5 | Safe ZIP extraction and AI evaluation pipeline | Planned |
| 6 | Dashboards on live data and the marks workbook export | Planned |
| 7 | End-to-end acceptance test | Planned |

Until phase 2 lands, sign-in accepts any credentials and routes into the preview: the student role goes through
the change-password screen first, and the faculty role goes straight to the dashboard. Actions update the screen but are not saved,
and the Excel download buttons show a notice until the server routes exist. Every place a real API call will go is marked
with a `Phase N:` comment.

## Requirements

- Node.js 20.9 or newer (developed on Node 22)
- npm

## Setup

```bash
npm install
npm run dev          # http://localhost:3000
```

Other commands:

```bash
npm run lint         # TypeScript type-check
npm run build        # production build
npm start            # serve the production build
```

## Pages

| Student | Faculty |
|---|---|
| `/login` (Student tab) | `/login` (Faculty tab) |
| `/change-password`: first-login password setup | `/faculty`: dashboard, stats, searchable review table |
| `/student`: home, current assignment, progress | `/faculty/courses`: course list and create course |
| `/student/assignment`: scenario, questions, rubric, download | `/faculty/courses/[id]/students`: list, reset password, disable |
| `/student/submit`: ZIP upload | `/faculty/courses/[id]/import`: Excel import wizard |
| `/student/history`: submission history | `/faculty/courses/[id]/syllabus`: syllabus upload and topics |
| `/student/marks`: approved marks and feedback | `/faculty/courses/[id]/assignments`: generate, review, publish |
| `/student/account`: change password | `/faculty/submissions` and `/faculty/submissions/[id]`: evaluation review and approval |
| | `/faculty/export`: marks workbook |

## Project layout

```
app/                 Next.js App Router pages (faculty/, student/, login/, change-password/)
components/ui        Buttons, cards, form fields, badges, tables
components/          App shell, icons, file picker, modal, toast, score visuals
lib/types.ts         Domain types (mirror the planned Prisma schema)
lib/demo-data.ts     Sample data used until the database is connected
```

## Design notes

- Semantic color tokens in `app/globals.css` drive the light and dark themes. Dark mode follows the OS setting.
- Fonts (Inter and Bricolage Grotesque) are bundled through `@fontsource`, so no requests go to external font CDNs.
- On phones, students get an app-style bottom tab bar. Faculty get a slide-in menu.
- Animations are disabled when the user prefers reduced motion.
