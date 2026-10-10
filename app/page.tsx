import { ButtonLink } from "@/components/ui";

const steps = [
  { n: "1", title: "Import your class", body: "Upload one Excel sheet of names and enrollment numbers. Student logins and temporary passwords are created for you." },
  { n: "2", title: "Generate unique assignments", body: "Upload the syllabus, pick topics and difficulty. Each student gets a different scenario of comparable difficulty." },
  { n: "3", title: "Collect ZIP submissions", body: "Students upload one ZIP. Files are checked and extracted safely, then matched to the exact version they were issued." },
  { n: "4", title: "Review and export marks", body: "AI suggests rubric marks out of 30. You approve or edit every score, then download a formatted Excel sheet." },
];

const facultyFeatures = [
  "Courses, syllabus upload, and topic extraction",
  "Excel roster import with preview and validation",
  "Downloadable one-time credential sheet",
  "Scenario-based questions with model solutions and rubrics",
  "Provisional AI marks that you approve or override",
  "Marks export to .xlsx with per-criterion scores",
];

const studentFeatures = [
  "Log in with enrollment number",
  "See only your own assigned scenario",
  "Download instructions and upload one ZIP",
  "Track submission status and history",
  "View marks and feedback once published",
];

export default function LandingPage() {
  return (
    <div className="bg-white">
      <header className="border-b border-slate-200">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-8">
          <span className="text-lg font-bold tracking-tight text-brand-700">AssignAI</span>
          <nav className="flex items-center gap-2">
            <a href="#how" className="hidden px-3 py-2 text-sm text-slate-700 hover:text-slate-900 sm:inline">
              How it works
            </a>
            <ButtonLink href="/login" variant="secondary">
              Sign in
            </ButtonLink>
          </nav>
        </div>
      </header>

      <section className="bg-gradient-to-b from-brand-50 to-white">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-8 lg:grid-cols-2 lg:py-24">
          <div>
            <p className="text-sm font-semibold text-brand-700">For college faculty and students</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              A unique assignment for every student, graded in minutes.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-slate-600">
              AssignAI turns your syllabus into scenario-based assignments, collects ZIP submissions securely, and
              drafts rubric-based marks out of 30. You review and approve every score.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/login?role=faculty" className="px-5 py-2.5">
                Faculty sign in
              </ButtonLink>
              <ButtonLink href="/login?role=student" variant="secondary" className="px-5 py-2.5">
                Student sign in
              </ButtonLink>
            </div>
            <p className="mt-4 text-xs text-slate-500">
              Students: use your enrollment number and the temporary password from your faculty.
            </p>
          </div>

          {/* Product preview: a static rendering of the faculty review table */}
          <div className="rounded-xl bg-white p-4 shadow-xl ring-1 ring-slate-200" aria-hidden="true">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold">Assignment 1 · DBMS</p>
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
                2 need review
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                ["Students", "62"],
                ["Submitted", "57"],
                ["Evaluated", "51"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-lg bg-slate-50 py-3">
                  <p className="text-xl font-semibold tabular-nums">{v}</p>
                  <p className="text-xs text-slate-500">{k}</p>
                </div>
              ))}
            </div>
            <table className="mt-4 w-full text-left text-xs">
              <thead className="text-slate-500">
                <tr>
                  <th className="py-1.5 font-medium">Enrollment</th>
                  <th className="py-1.5 font-medium">Student</th>
                  <th className="py-1.5 font-medium">Version</th>
                  <th className="py-1.5 text-right font-medium">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  ["ENR001", "Rahul Patel", "A1-V01", "24 / 30", "text-emerald-700"],
                  ["ENR002", "Priya Shah", "A1-V02", "Review", "text-amber-700"],
                  ["ENR003", "Amit Kumar", "A1-V03", "27 / 30", "text-emerald-700"],
                  ["ENR004", "Neha Joshi", "A1-V04", "19 / 30", "text-emerald-700"],
                ].map(([e, n, v, s, c]) => (
                  <tr key={e}>
                    <td className="py-2 font-mono text-slate-600">{e}</td>
                    <td className="py-2">{n}</td>
                    <td className="py-2 text-slate-500">{v}</td>
                    <td className={`py-2 text-right font-medium tabular-nums ${c}`}>{s}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section id="how" className="mx-auto max-w-6xl px-4 py-16 sm:px-8">
        <h2 className="text-2xl font-semibold tracking-tight">How it works</h2>
        <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <li key={s.n} className="rounded-lg p-5 ring-1 ring-slate-200">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
                {s.n}
              </span>
              <h3 className="mt-4 font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:px-8 md:grid-cols-2">
          <FeatureList title="For faculty" items={facultyFeatures} />
          <FeatureList title="For students" items={studentFeatures} />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-8">
        <div className="grid gap-4 text-sm text-slate-600 sm:grid-cols-3">
          <p>
            <span className="font-semibold text-slate-900">Private by design.</span> Students can only see their own
            assignment, submissions, and marks.
          </p>
          <p>
            <span className="font-semibold text-slate-900">Faculty stay in control.</span> AI scores remain provisional
            until you approve them, and every change is logged.
          </p>
          <p>
            <span className="font-semibold text-slate-900">Safe uploads.</span> ZIPs are size-checked and extracted in
            isolation. Uploaded code is never run on the server.
          </p>
        </div>
      </section>

      <footer className="border-t border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-6 text-xs text-slate-500 sm:px-8">
          AssignAI · Assignment management for colleges
        </div>
      </footer>
    </div>
  );
}

function FeatureList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h2 className="text-lg font-semibold">{title}</h2>
      <ul className="mt-4 space-y-2">
        {items.map((i) => (
          <li key={i} className="flex gap-2 text-sm text-slate-700">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" />
            {i}
          </li>
        ))}
      </ul>
    </div>
  );
}
