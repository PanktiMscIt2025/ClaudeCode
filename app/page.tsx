import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/logo";
import { ButtonLink } from "@/components/ui";
import {
  ArrowRight,
  Book,
  Cap,
  Check,
  Clock,
  Download,
  Eye,
  File,
  Lock,
  Pencil,
  Sheet,
  Shield,
  Sparkle,
  Upload,
  Users,
  Zip,
} from "@/components/icons";
import { cn } from "@/lib/format";

const studentSteps = [
  {
    icon: Lock,
    title: "Sign in",
    body: "Use your enrollment number and the temporary password from your teacher. You'll set your own password once.",
    color: "bg-brand-soft text-brand-ink",
  },
  {
    icon: Book,
    title: "Read your scenario",
    body: "Your assignment is written just for you: a real-world problem with clear questions and deliverables.",
    color: "bg-accent-soft text-accent",
  },
  {
    icon: Upload,
    title: "Upload one ZIP",
    body: "Put your report and code in one ZIP and drop it in. You'll see straight away that it was received.",
    color: "bg-mint-soft text-mint",
  },
  {
    icon: Eye,
    title: "See marks & feedback",
    body: "When your teacher publishes results, you'll see your score out of 30 and a breakdown for each rubric criterion.",
    color: "bg-sun-soft text-sun",
  },
];

const faqs = [
  {
    q: "What is my username?",
    a: "Your enrollment number (for example ENR001). Your teacher gives you a temporary password, and you choose a new one the first time you sign in.",
  },
  {
    q: "I forgot my password. What do I do?",
    a: "Ask your faculty to reset it. They'll give you a new temporary password, and you'll set your own again at sign-in.",
  },
  {
    q: "What should go inside my ZIP file?",
    a: "Everything your assignment asks for: usually a report (PDF or DOCX) and any source files. The exact list is shown on your assignment page. Don't include .exe files or other programs.",
  },
  {
    q: "Can other students see my assignment or marks?",
    a: "No. You can see only your own scenario, submissions and marks. Every student gets a different version.",
  },
  {
    q: "When will I see my marks?",
    a: "After your teacher reviews and approves the evaluation. Marks suggested by the AI are never shown to you until a teacher approves them.",
  },
];

export default function LandingPage() {
  return (
    <div className="overflow-x-clip">
      <SiteHeader />

      {/* ───────────── Hero ───────────── */}
      <section className="relative">
        <Aurora />
        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 pt-12 pb-20 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:pt-20 lg:pb-28">
          <div className="animate-rise">
            <span className="inline-flex items-center gap-2 rounded-full bg-surface/80 px-3 py-1 text-xs font-semibold text-ink-muted shadow-soft ring-1 ring-line backdrop-blur">
              <Sparkle className="h-3.5 w-3.5 text-accent" />
              AI-assisted · Faculty-approved
            </span>
            <h1 className="mt-5 font-display text-[2.6rem] leading-[1.05] font-extrabold tracking-tight text-ink sm:text-6xl">
              Every student gets{" "}
              <span className="relative whitespace-nowrap">
                <span className="relative z-10 bg-gradient-to-r from-brand to-accent bg-clip-text text-transparent">
                  their own
                </span>
                <Squiggle />
              </span>{" "}
              challenge.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-muted">
              Unique, scenario-based assignments from your syllabus. Simple ZIP submissions. Fair rubric marks out of
              30 that faculty review before anyone sees them.
            </p>

            <div className="mt-9 grid gap-3 sm:grid-cols-2">
              <RoleCard
                href="/login?role=student"
                icon={<Cap className="h-6 w-6" />}
                eyebrow="I'm a student"
                title="Sign in with enrollment no."
                tone="brand"
              />
              <RoleCard
                href="/login?role=faculty"
                icon={<Users className="h-6 w-6" />}
                eyebrow="I'm faculty"
                title="Manage courses & marks"
                tone="plain"
              />
            </div>

            <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-muted">
              {["Unique version per student", "Marks out of 30", "Excel import & export"].map((t) => (
                <li key={t} className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-mint" />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <HeroCollage />
        </div>
      </section>

      {/* ───────────── For students ───────────── */}
      <section id="students" className="scroll-mt-20 border-y border-line bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-8">
          <SectionHeading
            eyebrow="For students"
            title="Four steps. No confusion."
            body="Designed to work on your phone between classes: one page for your assignment, and one button to submit."
          />
          <ol className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {studentSteps.map((s, i) => (
              <li
                key={s.title}
                className="group relative rounded-3xl bg-bg p-6 ring-1 ring-line transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
              >
                <span className="absolute top-5 right-6 font-display text-5xl font-extrabold text-line transition-colors group-hover:text-brand-soft">
                  {i + 1}
                </span>
                <span className={cn("flex h-12 w-12 items-center justify-center rounded-2xl", s.color)}>
                  <s.icon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 font-display text-lg font-bold">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ───────────── For faculty (bento) ───────────── */}
      <section id="faculty" className="scroll-mt-20 mx-auto max-w-6xl px-4 py-20 sm:px-8">
        <SectionHeading
          eyebrow="For faculty"
          title="From roster to marksheet in one place"
          body="AssignAI handles the repetitive work. You keep every decision: what gets published and which marks count."
        />

        <div className="mt-12 grid gap-5 md:grid-cols-6">
          <BentoTile className="md:col-span-4" icon={<Sheet />} title="Excel in, student logins out" body="Upload your class list. Accounts are created for valid rows, duplicates are caught, and you download a one-time credential sheet.">
            <MiniSheet />
          </BentoTile>

          <BentoTile className="md:col-span-2" icon={<Sparkle />} title="Unique, fair scenarios" body="Each student gets a different problem with matched difficulty, plus a model solution and rubric.">
            <div className="mt-5 flex -space-x-3">
              {["V01", "V02", "V03", "V04"].map((v, i) => (
                <span
                  key={v}
                  className={cn(
                    "flex h-14 w-11 items-end justify-center rounded-lg pb-1.5 text-[10px] font-bold text-white shadow-soft ring-2 ring-surface",
                    ["bg-brand", "bg-accent", "bg-mint", "bg-sun"][i],
                  )}
                  style={{ transform: `rotate(${(i - 1.5) * 6}deg)` }}
                >
                  {v}
                </span>
              ))}
            </div>
          </BentoTile>

          <BentoTile className="md:col-span-2" icon={<Pencil />} title="AI drafts. You decide." body="Marks stay provisional until you approve or edit them. Every change is logged.">
            <div className="mt-5 flex items-center gap-3 rounded-xl bg-bg p-3 ring-1 ring-line">
              <span className="text-xs text-ink-subtle line-through">22</span>
              <ArrowRight className="h-3.5 w-3.5 text-ink-subtle" />
              <span className="font-display text-lg font-bold text-mint">24</span>
              <span className="text-xs text-ink-subtle">/ 30</span>
              <span className="ml-auto rounded-full bg-mint-soft px-2 py-0.5 text-[10px] font-bold text-mint">APPROVED</span>
            </div>
          </BentoTile>

          <BentoTile className="md:col-span-2" icon={<Shield />} title="Safe submissions" body="Each ZIP is size-checked and screened for zip bombs and path tricks. Uploaded code is never run.">
            <div className="mt-5 flex flex-wrap gap-1.5">
              {["Size limit", "No path traversal", "Bomb check", "Private storage"].map((t) => (
                <span key={t} className="rounded-full bg-bg px-2.5 py-1 text-[11px] font-medium text-ink-muted ring-1 ring-line">
                  {t}
                </span>
              ))}
            </div>
          </BentoTile>

          <BentoTile className="md:col-span-2" icon={<Download />} title="One-click marks export" body="A formatted .xlsx with per-criterion scores, totals, percentages and feedback.">
            <div className="mt-5 flex items-center gap-3 rounded-xl bg-mint-soft p-3 text-mint">
              <Sheet className="h-5 w-5" />
              <span className="text-sm font-semibold">marks_DBMS_A1.xlsx</span>
            </div>
          </BentoTile>
        </div>
      </section>

      {/* ───────────── FAQ ───────────── */}
      <section id="faq" className="scroll-mt-20 border-t border-line bg-surface">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-8 lg:grid-cols-[1fr_1.4fr]">
          <SectionHeading eyebrow="Student help" title="Questions, answered" body="Still stuck? Your course faculty can reset your password or answer questions about your assignment." />
          <div className="divide-y divide-line rounded-3xl bg-bg ring-1 ring-line">
            {faqs.map((f) => (
              <details key={f.q} className="group px-6 py-5 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-ink">
                  {f.q}
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface ring-1 ring-line transition-transform group-open:rotate-45">
                    <span className="text-lg leading-none text-ink-muted">+</span>
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-ink-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── CTA ───────────── */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-8">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand via-[#7b4df0] to-accent px-6 py-14 text-center text-white shadow-lift sm:px-12">
          <div className="bg-dots absolute inset-0 opacity-30" aria-hidden="true" />
          <h2 className="relative font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Ready when you are.</h2>
          <p className="relative mx-auto mt-3 max-w-lg text-white/85">
            Students: check your assignment. Faculty: set up your first course in minutes.
          </p>
          <div className="relative mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/login?role=student"
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-white px-6 font-semibold text-[#3d23c9] shadow-soft transition-transform hover:-translate-y-0.5"
            >
              Student sign in <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login?role=faculty"
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-white/15 px-6 font-semibold text-white ring-1 ring-white/40 backdrop-blur transition-colors hover:bg-white/25"
            >
              Faculty sign in
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm text-ink-subtle sm:px-8">
          <Logo />
          <p>Assignment management for colleges · Your data stays on your college&apos;s server.</p>
        </div>
      </footer>
    </div>
  );
}

/* ───────────── Pieces ───────────── */

function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-bg/75 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-8">
        <Logo />
        <nav className="flex items-center gap-1">
          {[
            ["#students", "Students"],
            ["#faculty", "Faculty"],
            ["#faq", "Help"],
          ].map(([href, label]) => (
            <a key={href} href={href} className="hidden rounded-lg px-3 py-2 text-sm font-medium text-ink-muted hover:text-ink sm:inline">
              {label}
            </a>
          ))}
          <ButtonLink href="/login" className="ml-2">
            Sign in
          </ButtonLink>
        </nav>
      </div>
    </header>
  );
}

function SectionHeading({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <div className="max-w-2xl">
      <p className="text-sm font-bold tracking-wide text-accent uppercase">{eyebrow}</p>
      <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h2>
      <p className="mt-3 text-lg text-ink-muted">{body}</p>
    </div>
  );
}

function RoleCard({
  href,
  icon,
  eyebrow,
  title,
  tone,
}: {
  href: string;
  icon: ReactNode;
  eyebrow: string;
  title: string;
  tone: "brand" | "plain";
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-4 rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift",
        tone === "brand" ? "bg-brand text-white shadow-soft" : "bg-surface text-ink shadow-soft ring-1 ring-line",
      )}
    >
      <span
        className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
          tone === "brand" ? "bg-white/15" : "bg-brand-soft text-brand-ink",
        )}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn("block text-xs font-semibold", tone === "brand" ? "text-white/75" : "text-ink-subtle")}>{eyebrow}</span>
        <span className="block font-semibold leading-snug">{title}</span>
      </span>
      <ArrowRight className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-1" />
    </Link>
  );
}

function BentoTile({
  className,
  icon,
  title,
  body,
  children,
}: {
  className?: string;
  icon: ReactNode;
  title: string;
  body: string;
  children?: ReactNode;
}) {
  return (
    <div className={cn("rounded-3xl bg-surface p-6 shadow-soft ring-1 ring-line transition-shadow hover:shadow-lift", className)}>
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand-ink [&>svg]:h-5 [&>svg]:w-5">
        {icon}
      </span>
      <h3 className="mt-4 font-display text-xl font-bold">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{body}</p>
      {children}
    </div>
  );
}

function MiniSheet() {
  const rows = [
    ["Rahul Patel", "ENR001", "Created"],
    ["Priya Shah", "ENR002", "Created"],
    ["Amit Kumar", "ENR003", "Created"],
    ["—", "ENR003", "Duplicate"],
  ];
  return (
    <div className="mt-5 overflow-hidden rounded-xl ring-1 ring-line">
      <table className="w-full text-left text-xs">
        <thead className="bg-surface-muted text-ink-muted">
          <tr>
            <th className="px-3 py-2 font-semibold">Student Name</th>
            <th className="px-3 py-2 font-semibold">Enrollment No.</th>
            <th className="px-3 py-2 text-right font-semibold">Result</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map(([n, e, r], i) => (
            <tr key={i}>
              <td className="px-3 py-2">{n}</td>
              <td className="px-3 py-2 font-mono text-ink-muted">{e}</td>
              <td className="px-3 py-2 text-right">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-bold",
                    r === "Created" ? "bg-mint-soft text-mint" : "bg-sun-soft text-sun",
                  )}
                >
                  {r}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Decorative stack of floating product cards: scenario, upload, and score. */
function HeroCollage() {
  return (
    <div className="relative mx-auto h-[470px] w-full max-w-md sm:h-[530px]" aria-hidden="true">
      {/* Scenario card */}
      <div className="absolute top-0 left-0 w-[86%] animate-rise rounded-3xl bg-surface p-5 shadow-lift ring-1 ring-line [animation-delay:120ms]">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-bold text-brand-ink">Your scenario · A1-V01</span>
          <span className="flex items-center gap-1 text-[11px] font-semibold text-accent">
            <Clock className="h-3.5 w-3.5" /> Due in 5 days
          </span>
        </div>
        <p className="mt-4 font-display text-lg leading-snug font-bold">GreenLeaf Pharmacy: 14 branches, one database</p>
        <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">
          Track medicine batches, expiry dates, and prescriptions across branches, and flag low stock…
        </p>
        <div className="mt-4 space-y-2">
          {[
            ["Q1", "Design the ER model", "10"],
            ["Q2", "SQL: expiring controlled drugs", "12"],
            ["Q3", "Normalize legacy sheet to BCNF", "8"],
          ].map(([q, t, m]) => (
            <div key={q} className="flex items-center gap-3 rounded-xl bg-bg px-3 py-2 text-xs">
              <span className="font-bold text-brand-ink">{q}</span>
              <span className="flex-1 truncate text-ink">{t}</span>
              <span className="text-ink-subtle">{m} marks</span>
            </div>
          ))}
        </div>
      </div>

      {/* Upload card */}
      <div className="absolute right-0 bottom-24 w-[68%] animate-float rounded-3xl bg-surface p-4 shadow-lift ring-1 ring-line">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-mint-soft text-mint">
            <Zip className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">ENR001_assignment1.zip</p>
            <p className="text-[11px] text-ink-subtle">471 KB · 3 files</p>
          </div>
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-mint text-white">
            <Check className="h-3.5 w-3.5" />
          </span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-muted">
          <div className="h-full w-full rounded-full bg-gradient-to-r from-mint to-brand" />
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {["report.pdf", "schema.sql", "queries.sql"].map((f) => (
            <span key={f} className="inline-flex items-center gap-1 rounded-md bg-bg px-2 py-1 text-[10px] font-medium text-ink-muted">
              <File className="h-3 w-3" />
              {f}
            </span>
          ))}
        </div>
      </div>

      {/* Score ring */}
      <div className="absolute bottom-0 left-4 flex animate-rise items-center gap-3 rounded-3xl bg-surface p-4 pr-5 shadow-lift ring-1 ring-line [animation-delay:320ms]">
        <ScoreRing value={24} max={30} />
        <div>
          <p className="text-[11px] font-semibold text-ink-subtle">Your marks</p>
          <p className="font-display text-xl font-bold">
            24 <span className="text-sm font-medium text-ink-subtle">/ 30</span>
          </p>
          <p className="flex items-center gap-1 text-[11px] font-semibold text-mint">
            <Check className="h-3 w-3" /> Approved by faculty
          </p>
        </div>
      </div>
    </div>
  );
}

function ScoreRing({ value, max }: { value: number; max: number }) {
  const r = 22;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 56 56" className="h-14 w-14 -rotate-90">
      <circle cx="28" cy="28" r={r} fill="none" strokeWidth="6" className="stroke-surface-muted" />
      <circle
        cx="28"
        cy="28"
        r={r}
        fill="none"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - value / max)}
        className="stroke-mint"
      />
    </svg>
  );
}

/** Hand-drawn underline beneath the highlighted hero words. */
function Squiggle() {
  return (
    <svg
      viewBox="0 0 220 16"
      preserveAspectRatio="none"
      className="absolute -bottom-2 left-0 h-3 w-full text-accent/70"
      aria-hidden="true"
    >
      <path d="M2 11c30-8 60-8 90-3s70 6 126-4" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

/** Soft gradient blobs + dot texture behind the hero. */
function Aurora() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-0 overflow-hidden" aria-hidden="true">
      <div className="bg-dots absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />
      <div className="absolute -top-32 -left-24 h-[28rem] w-[28rem] rounded-full bg-brand/20 blur-3xl" />
      <div className="absolute top-10 right-[-6rem] h-[24rem] w-[24rem] rounded-full bg-accent/20 blur-3xl" />
      <div className="absolute bottom-[-8rem] left-1/3 h-[20rem] w-[20rem] rounded-full bg-mint/15 blur-3xl" />
    </div>
  );
}
