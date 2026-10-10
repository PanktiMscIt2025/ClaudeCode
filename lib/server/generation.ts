import { db } from "./db";
import { aiBlueprint, aiEnabled, aiVersions, type Blueprint, type GeneratedVersion, type GenerationSpec } from "./ai";
import { offlineBlueprint, offlineVersions } from "./offline";
import { fingerprint, maxSimilarities } from "./similarity";
import { parseJson } from "./json";

const BATCH_SIZE = 4; // students per AI call: keeps each response well under the output limit

/** Scale marks so they sum exactly to `total` (AI output is validated, never trusted blindly). */
function normalizeMarks<T extends { marks?: number; maxMarks?: number }>(items: T[], key: "marks" | "maxMarks", total: number): T[] {
  const raw = items.map((x) => Math.max(0, Number(x[key]) || 0));
  const sum = raw.reduce((a, b) => a + b, 0) || items.length;
  const scaled = raw.map((v) => Math.round(((sum === items.length && !raw.some(Boolean) ? 1 : v) / sum) * total * 2) / 2);
  const diff = Math.round((total - scaled.reduce((a, b) => a + b, 0)) * 2) / 2;
  scaled[scaled.length - 1] = Math.max(0, scaled[scaled.length - 1] + diff);
  return items.map((x, i) => ({ ...x, [key]: scaled[i] }));
}

function cleanBlueprint(bp: Blueprint, spec: GenerationSpec): Blueprint {
  let questions = bp.questions.slice(0, spec.questionCount);
  while (questions.length < spec.questionCount) questions.push({ ...questions[questions.length - 1] });
  questions = normalizeMarks(questions, "marks", spec.totalMarks);
  const rubric = normalizeMarks(bp.rubric.slice(0, 6).filter((r) => r.criterion.trim()), "maxMarks", spec.totalMarks);
  return { rubric: rubric.length ? rubric : offlineBlueprint(spec).rubric, questions };
}

async function loadSpec(assignmentId: string) {
  const a = await db.assignment.findUniqueOrThrow({ where: { id: assignmentId }, include: { course: { include: { syllabus: true } } } });
  const spec: GenerationSpec = {
    courseName: a.course.name,
    title: a.title,
    topics: parseJson<string[]>(a.topics, []),
    outcomes: parseJson<string[]>(a.course.syllabus?.outcomes, []),
    difficulty: a.difficulty.toLowerCase(),
    questionCount: a.questionCount,
    totalMarks: a.totalMarks,
  };
  return { assignment: a, spec };
}

function versionCode(prefix: string, n: number) {
  return `${prefix}-V${String(n).padStart(2, "0")}`;
}

/** Turn one generated version into DB fields, forcing the blueprint's marks and question count. */
function toRow(v: GeneratedVersion, blueprint: Blueprint) {
  const questions = blueprint.questions.map((bq, i) => {
    const q = v.questions[i];
    return { number: i + 1, text: q?.text?.trim() || `Apply ${bq.skill} to the scenario.`, marks: bq.marks, deliverable: q?.deliverable?.trim() || bq.deliverable };
  });
  const text = `${v.scenario}\n${questions.map((q) => q.text).join("\n")}`;
  return {
    scenario: v.scenario.trim(),
    questions: JSON.stringify(questions),
    rubric: JSON.stringify(blueprint.rubric),
    modelSolution: JSON.stringify({ title: v.title, domain: v.domain, answers: v.modelSolution }),
    instructions: v.instructions.trim(),
    fingerprint: fingerprint(text),
  };
}

async function generateBatch(spec: GenerationSpec, blueprint: Blueprint, keys: string[], avoid: string[], seed: string, offline: boolean) {
  const versions = offline ? offlineVersions(spec, blueprint, keys, avoid, seed) : await aiVersions(spec, blueprint, keys, avoid);
  const byKey = new Map(versions.map((v) => [v.key.trim(), v]));
  // If the model dropped or garbled a key, fill the gap offline rather than fail the whole batch.
  return keys.map((k, i) => byKey.get(k) ?? versions[i] ?? offlineVersions(spec, blueprint, [k], avoid, seed)[0]);
}

async function recomputeSimilarity(assignmentId: string) {
  const versions = await db.studentAssignment.findMany({ where: { assignmentId }, select: { id: true, fingerprint: true } });
  const sims = maxSimilarities(versions.map((v) => v.fingerprint));
  await db.$transaction(versions.map((v, i) => db.studentAssignment.update({ where: { id: v.id }, data: { similarity: Math.round(sims[i] * 1000) / 1000 } })));
}

/**
 * Job: create versions for every active student in the course who doesn't have one yet.
 * The blueprint (shared rubric + question plan) is created once and reused, so all versions stay comparable.
 */
export async function runGeneration(assignmentId: string) {
  const { assignment, spec } = await loadSpec(assignmentId);
  const offline = !aiEnabled();

  let blueprint = parseJson<Blueprint | null>(assignment.blueprint, null);
  if (!blueprint?.questions?.length) {
    blueprint = cleanBlueprint(offline ? offlineBlueprint(spec) : await aiBlueprint(spec), spec);
    await db.assignment.update({
      where: { id: assignmentId },
      data: { blueprint: JSON.stringify(blueprint), rubric: JSON.stringify(blueprint.rubric), generator: offline ? "offline" : "ai" },
    });
  }

  const existing = await db.studentAssignment.findMany({ where: { assignmentId }, select: { studentId: true, version: true, modelSolution: true } });
  const have = new Set(existing.map((e) => e.studentId));
  const students = await db.user.findMany({
    where: { role: "STUDENT", disabled: false, enrollments: { some: { courseId: assignment.courseId } } },
    orderBy: { loginId: "asc" },
    select: { id: true },
  });
  const todo = students.filter((s) => !have.has(s.id));
  const avoid = existing.map((e) => parseJson<{ domain?: string; title?: string }>(e.modelSolution, {})).flatMap((m) => [m.domain ?? "", m.title ?? ""]).filter(Boolean);
  let next = existing.reduce((m, e) => Math.max(m, Number(e.version.split("-V")[1]) || 0), 0) + 1;

  await db.assignment.update({ where: { id: assignmentId }, data: { progress: existing.length, error: null } });

  for (let i = 0; i < todo.length; i += BATCH_SIZE) {
    const batch = todo.slice(i, i + BATCH_SIZE);
    const keys = batch.map((_, j) => `S${i + j + 1}`); // anonymous keys: no student data goes to the AI
    const versions = await generateBatch(spec, blueprint, keys, avoid, `${assignmentId}:${next}`, offline);
    await db.$transaction(
      batch.map((s, j) =>
        db.studentAssignment.create({
          data: { assignmentId, studentId: s.id, version: versionCode(assignment.code, next + j), ...toRow(versions[j], blueprint!) },
        }),
      ),
    );
    next += batch.length;
    avoid.push(...versions.flatMap((v) => [v.domain, v.title]));
    await db.assignment.update({ where: { id: assignmentId }, data: { progress: { increment: batch.length } } });
  }

  await recomputeSimilarity(assignmentId);
  const fresh = await db.assignment.findUniqueOrThrow({ where: { id: assignmentId } });
  if (fresh.status === "GENERATING") await db.assignment.update({ where: { id: assignmentId }, data: { status: "REVIEW" } });
}

export async function markGenerationFailed(assignmentId: string, error: string) {
  const a = await db.assignment.findUnique({ where: { id: assignmentId } });
  if (a && a.status === "GENERATING") {
    const count = await db.studentAssignment.count({ where: { assignmentId } });
    await db.assignment.update({ where: { id: assignmentId }, data: { status: count ? "REVIEW" : "DRAFT", error } });
  } else if (a) {
    await db.assignment.update({ where: { id: assignmentId }, data: { error } });
  }
}

/** Replace one unpublished version with a fresh scenario (used for near-duplicates). */
export async function regenerateVersion(versionId: string) {
  const v = await db.studentAssignment.findUniqueOrThrow({ where: { id: versionId } });
  const { assignment, spec } = await loadSpec(v.assignmentId);
  const blueprint = parseJson<Blueprint>(assignment.blueprint, offlineBlueprint(spec));
  const others = await db.studentAssignment.findMany({ where: { assignmentId: v.assignmentId, NOT: { id: v.id } }, select: { modelSolution: true } });
  const avoid = others.map((o) => parseJson<{ domain?: string; title?: string }>(o.modelSolution, {})).flatMap((m) => [m.domain ?? "", m.title ?? ""]).filter(Boolean);
  const self = parseJson<{ domain?: string; title?: string }>(v.modelSolution, {});
  if (self.domain) avoid.push(self.domain);
  const [gen] = await generateBatch(spec, blueprint, ["S1"], avoid, `${v.id}:${Date.now()}`, !aiEnabled());
  await db.studentAssignment.update({ where: { id: v.id }, data: toRow(gen, blueprint) });
  await recomputeSimilarity(v.assignmentId);
}
