// Offline fallbacks used when ANTHROPIC_API_KEY is not set: template-based syllabus parsing,
// scenario generation, and a rough evaluator. Everything they produce is labelled as offline in
// the UI, and offline evaluations are always flagged for faculty review.
import { createHash } from "node:crypto";
import type { AiEvaluation, Blueprint, GeneratedVersion, GenerationSpec, SyllabusInfo } from "./ai";

/* ───────────── Syllabus ───────────── */

export function offlineExtractSyllabus(text: string): SyllabusInfo {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const outcomes: string[] = [];
  const topics: string[] = [];
  for (const line of lines) {
    const clean = line.replace(/^([-•*▪◦●]|\d+[.)]|[a-z][.)]|unit\s*[ivx\d]+\s*[:.-]?)\s*/i, "").trim();
    if (/^(co|lo|clo)\s*\d+\s*[:.-]/i.test(line) || /\b(able to|students will)\b/i.test(line)) {
      outcomes.push(line.length > 200 ? line.slice(0, 200) : line);
    } else if (clean.length >= 4 && clean.length <= 80 && clean.split(" ").length <= 10 && !/[.?]$/.test(clean) && /[a-z]/i.test(clean)) {
      if (!/^(syllabus|course|semester|credits?|marks?|total|references?|text ?books?|page \d+)/i.test(clean)) topics.push(clean);
    }
  }
  const uniq = Array.from(new Set(topics.map((t) => t.replace(/\s+/g, " ")))).slice(0, 25);
  const outs = Array.from(new Set(outcomes)).slice(0, 10);
  return {
    topics: uniq.length ? uniq : ["Core concepts"],
    outcomes: outs.length ? outs.map((o, i) => (/^(co|lo|clo)\s*\d/i.test(o) ? o : `CO${i + 1}: ${o}`)) : uniq.slice(0, 4).map((t, i) => `CO${i + 1}: Apply ${t} to practical problems`),
  };
}

/* ───────────── Generation ───────────── */

function splitMarks(total: number, parts: number, weights?: number[]): number[] {
  const w = weights ?? Array(parts).fill(1);
  const sum = w.reduce((a, b) => a + b, 0);
  const marks = w.map((x) => Math.floor((x / sum) * total));
  let rest = total - marks.reduce((a, b) => a + b, 0);
  for (let i = 0; rest > 0; i = (i + 1) % parts, rest--) marks[i]++;
  return marks;
}

export function offlineBlueprint(spec: GenerationSpec): Blueprint {
  const names = ["Understanding of concepts", "Application to the scenario", "Correctness and completeness", "Presentation and clarity"];
  const descs = [
    "Uses the correct concepts and terminology from the topic",
    "Applies the topic to the specific organisation, data, and constraints given",
    "Answers are correct, complete, and justified",
    "Well organised, assumptions stated, easy to follow",
  ];
  const rubricMarks = splitMarks(spec.totalMarks, 4, [25, 35, 25, 15]);
  const qMarks = splitMarks(spec.totalMarks, spec.questionCount);
  const deliverables = ["Report section with worked solution", "Design or diagram with explanation", "Implementation file(s) with comments", "Short evaluation write-up"];
  return {
    rubric: names.map((criterion, i) => ({ criterion, maxMarks: rubricMarks[i], description: descs[i] })),
    questions: qMarks.map((marks, i) => ({
      marks,
      learningOutcome: spec.outcomes[i % Math.max(spec.outcomes.length, 1)] ?? spec.topics[0],
      skill: spec.topics[i % spec.topics.length],
      deliverable: deliverables[i % deliverables.length],
    })),
  };
}

const DOMAINS = [
  { org: "GreenLeaf Pharmacy", kind: "pharmacy chain", unit: "branches", problem: "stock-outs of critical medicines", things: ["prescriptions", "suppliers", "medicine batches"] },
  { org: "SwiftCargo Logistics", kind: "logistics startup", unit: "warehouses", problem: "late and damaged deliveries", things: ["shipments", "trucks", "drivers"] },
  { org: "Sunrise Multispeciality Hospital", kind: "hospital", unit: "wards", problem: "long patient waiting times", things: ["appointments", "doctors", "beds"] },
  { org: "UrbanBite Foods", kind: "cloud-kitchen network", unit: "kitchens", problem: "food waste and slow order handling", things: ["orders", "menu items", "delivery partners"] },
  { org: "Metro Cycle Share", kind: "bike-sharing service", unit: "docking stations", problem: "empty stations at peak hours", things: ["rides", "bikes", "subscribers"] },
  { org: "Saraswati Public Library", kind: "public library network", unit: "branches", problem: "overdue books and unused stock", things: ["members", "loans", "book copies"] },
  { org: "KrishiMitra Co-op", kind: "farmers' cooperative", unit: "collection centres", problem: "unfair produce pricing and spoilage", things: ["farmers", "produce lots", "buyers"] },
  { org: "PowerGrid Solar Services", kind: "rooftop-solar installer", unit: "service zones", problem: "missed maintenance visits", things: ["installations", "technicians", "service tickets"] },
  { org: "EduNest Coaching", kind: "coaching institute", unit: "centres", problem: "falling attendance and test scores", things: ["batches", "students", "mock tests"] },
  { org: "AquaPure Water Supply", kind: "municipal water utility", unit: "pumping stations", problem: "leaks and uneven supply", things: ["connections", "meters", "complaints"] },
  { org: "StyleKart Fashion", kind: "online fashion retailer", unit: "fulfilment centres", problem: "high product return rates", things: ["orders", "returns", "SKUs"] },
  { org: "FitZone Gyms", kind: "gym franchise", unit: "outlets", problem: "member churn after the first month", things: ["memberships", "trainers", "class bookings"] },
  { org: "SkyHigh Airlines Cargo", kind: "air-cargo operator", unit: "airports", problem: "missed transfer connections", things: ["consignments", "flights", "customs checks"] },
  { org: "HomeNest Realty", kind: "property management firm", unit: "housing societies", problem: "slow maintenance-request resolution", things: ["flats", "tenants", "work orders"] },
  { org: "CityBus Transit", kind: "city bus operator", unit: "depots", problem: "overcrowded routes and bunching", things: ["routes", "buses", "trips"] },
  { org: "Nirmal Textiles", kind: "textile manufacturer", unit: "production lines", problem: "defects and machine downtime", things: ["work orders", "machines", "fabric rolls"] },
  { org: "CarePlus Insurance", kind: "health insurer", unit: "regional offices", problem: "slow and inconsistent claim settlement", things: ["policies", "claims", "hospitals"] },
  { org: "TechServe IT Helpdesk", kind: "IT support provider", unit: "client sites", problem: "breached response-time agreements", things: ["tickets", "engineers", "assets"] },
  { org: "EventSphere", kind: "event-management company", unit: "venues", problem: "double bookings and vendor delays", things: ["events", "vendors", "bookings"] },
  { org: "PetCare Clinics", kind: "veterinary clinic chain", unit: "clinics", problem: "missed vaccination follow-ups", things: ["pets", "owners", "visits"] },
  { org: "Heritage Hotels", kind: "boutique hotel group", unit: "properties", problem: "low occupancy on weekdays", things: ["reservations", "rooms", "guests"] },
  { org: "QuickFix Auto Service", kind: "car-service network", unit: "garages", problem: "parts shortages delaying repairs", things: ["job cards", "mechanics", "spare parts"] },
  { org: "BrightMinds School", kind: "K-12 school", unit: "campuses", problem: "unbalanced timetables and teacher overload", things: ["classes", "teachers", "periods"] },
  { org: "OceanCatch Seafoods", kind: "seafood exporter", unit: "cold-storage units", problem: "temperature breaches and rejected exports", things: ["catches", "containers", "inspections"] },
];
const CITIES = ["Ahmedabad", "Pune", "Jaipur", "Surat", "Indore", "Kochi", "Nagpur", "Vadodara", "Lucknow", "Coimbatore", "Bhopal", "Mysuru"];
const VERBS = ["Design", "Analyse", "Propose and justify", "Implement", "Evaluate", "Model"];

/** Deterministic pseudo-random numbers from a seed, so regenerating gives a different but stable result. */
function rng(seed: string) {
  let h = createHash("sha256").update(seed).digest().readUInt32BE(0);
  return (min: number, max: number) => {
    h = (h * 1664525 + 1013904223) >>> 0;
    return min + (h % (max - min + 1));
  };
}

export function offlineVersions(spec: GenerationSpec, blueprint: Blueprint, keys: string[], usedDomains: string[], seed: string): GeneratedVersion[] {
  const free = DOMAINS.filter((d) => !usedDomains.includes(d.kind));
  const pool = free.length >= keys.length ? free : DOMAINS;
  const base = rng(seed)(0, pool.length - 1); // one offset per batch, so keys in a batch never share a domain
  return keys.map((key, i) => {
    const r = rng(`${seed}:${key}`);
    const d = pool[(base + i) % pool.length];
    const city = CITIES[r(0, CITIES.length - 1)];
    const n = r(6, 40);
    const volume = r(2, 30) * 100;
    const pct = r(12, 38);
    const budget = r(4, 25);
    const days = r(10, 45);
    const scenario =
      `${d.org} is ${/^[aeiou]/i.test(d.kind) ? "an" : "a"} ${d.kind} in ${city} operating ${n} ${d.unit}. It handles about ${volume} ${d.things[0]} every week across ` +
      `${d.things[1]} and ${d.things[2]}. Over the last quarter, ${d.problem} rose by ${pct}%, and management has a budget of ` +
      `₹${budget} lakh and ${days} days to fix it. Data is currently kept in disconnected spreadsheets maintained separately at each ` +
      `of the ${n} ${d.unit}, so nobody has a reliable, up-to-date view. You have been hired to apply ${spec.topics.slice(0, 2).join(" and ")} ` +
      `to give ${d.org} a working solution. State any assumptions you make about the data.`;
    const constraints = [
      `all ${n} ${d.unit} must be covered`,
      `the solution must work within ₹${budget} lakh`,
      `it must reduce ${d.problem} by at least ${Math.round(pct / 2)}%`,
      `results must be available within ${days} days`,
      `it must handle ${volume} ${d.things[0]} per week`,
    ];
    const questions = blueprint.questions.map((q, j) => ({
      number: j + 1,
      marks: q.marks,
      deliverable: q.deliverable,
      text: `${VERBS[(j + i) % VERBS.length]} a solution for ${d.org} that applies ${q.skill} to its ${d.things[j % 3]} and ${d.things[(j + 1) % 3]}. Your answer must address this constraint: ${constraints[(j + i) % constraints.length]}.`,
    }));
    return {
      key,
      title: `${d.org}: ${d.problem}`,
      domain: d.kind,
      scenario,
      questions,
      instructions: `Submit one ZIP containing a report (PDF or DOCX) that answers every question in order, plus any source or design files your answers refer to. State your assumptions. Do not include executables.`,
      modelSolution: questions.map((q) => ({
        question: q.number,
        answer: `A strong answer applies ${blueprint.questions[q.number - 1].skill} specifically to ${d.org}'s ${d.things[(q.number - 1) % 3]}, uses the scenario's figures (${n} ${d.unit}, ${volume} ${d.things[0]}/week), and shows how the constraint is met.`,
        keyPoints: [
          `Correct use of ${blueprint.questions[q.number - 1].skill}`,
          `Uses the scenario's figures: ${n} ${d.unit}, ${volume} ${d.things[0]} per week`,
          `Explicitly addresses: ${constraints[(q.number - 1 + i) % constraints.length]}`,
          "States assumptions and justifies choices",
        ],
      })),
    };
  });
}

/* ───────────── Evaluation ───────────── */

const words = (s: string) => new Set(s.toLowerCase().match(/[a-z][a-z0-9]{3,}/g) ?? []);

/** Rough estimate from coverage of scenario/solution vocabulary and amount of work. Always flagged for review. */
export function offlineEvaluate(input: {
  scenario: string;
  questions: { text: string }[];
  rubric: { criterion: string; maxMarks: number }[];
  modelSolution: unknown;
  submissionText: string;
}): AiEvaluation {
  const text = input.submissionText.trim();
  const reviewReason = "Marked by the offline estimator (no Anthropic API key configured). Please review the marks.";
  if (text.length < 40) {
    return {
      readable: false,
      criteria: input.rubric.map((r) => ({ criterion: r.criterion, marks: 0, comment: "No readable content" })),
      feedback: "We couldn't find readable content in your submission.",
      evidence: [],
      reviewReason: "No readable text was found in the submission.",
    };
  }
  const target = words(`${input.scenario} ${input.questions.map((q) => q.text).join(" ")} ${JSON.stringify(input.modelSolution)}`);
  const sub = words(text);
  let hit = 0;
  for (const w of target) if (sub.has(w)) hit++;
  const coverage = target.size ? hit / target.size : 0;
  const effort = Math.min(text.length / 4000, 1);
  const score = Math.min(1, 0.25 + 0.5 * Math.min(coverage / 0.35, 1) + 0.25 * effort);
  const criteria = input.rubric.map((r) => {
    const marks = Math.round(r.maxMarks * score * 2) / 2;
    return { criterion: r.criterion, marks, comment: `Estimated from coverage of the scenario (${Math.round(coverage * 100)}%) and length` };
  });
  return {
    readable: true,
    criteria,
    feedback:
      `Your submission covers ${Math.round(coverage * 100)}% of the key terms from your scenario and questions. ` +
      "Make sure every question is answered using your scenario's specific figures and constraints, and state your assumptions.",
    evidence: [`${text.length.toLocaleString()} characters of readable text`, `${hit} of ${target.size} scenario terms used`],
    reviewReason,
  };
}
