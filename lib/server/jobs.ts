import { db } from "./db";

// Minimal DB-backed job queue with one in-process worker: enough for AI generation and evaluation
// on a single server, with retries and crash recovery, and no Redis or extra services.

type Handler = (payload: Record<string, unknown>) => Promise<void>;
type Hook = (payload: Record<string, unknown>, error: string) => Promise<void>;

// Kept on globalThis: Next may load separate copies of this module (instrumentation vs. server
// actions), and every copy must see the same handlers and the same single worker.
const g = globalThis as unknown as {
  __jobHandlers?: Map<string, Handler>;
  __jobFailureHooks?: Map<string, Hook>;
  __jobWorker?: { running: boolean; timer?: NodeJS.Timeout; busy: boolean };
};
const handlers = (g.__jobHandlers ??= new Map<string, Handler>());
const failureHooks = (g.__jobFailureHooks ??= new Map<string, Hook>());
const state = g;

export function registerJobHandler(type: string, handler: Handler) {
  handlers.set(type, handler);
}

const MAX_ATTEMPTS = 3;
const POLL_MS = 1500;

export async function enqueue(type: string, payload: Record<string, unknown>) {
  await import("./job-handlers"); // make sure handlers are registered in this module graph too
  await db.job.create({ data: { type, payload: JSON.stringify(payload) } });
  startWorker();
  kick();
}

/** Claim one due job atomically (status check in the UPDATE prevents double-processing). */
async function claim() {
  const next = await db.job.findFirst({ where: { status: "PENDING", runAfter: { lte: new Date() } }, orderBy: { createdAt: "asc" } });
  if (!next) return null;
  const { count } = await db.job.updateMany({ where: { id: next.id, status: "PENDING" }, data: { status: "RUNNING", attempts: { increment: 1 } } });
  return count ? { ...next, attempts: next.attempts + 1 } : null;
}

async function tick() {
  const w = state.__jobWorker!;
  if (w.busy) return;
  w.busy = true;
  try {
    for (let job = await claim(); job; job = await claim()) {
      const handler = handlers.get(job.type);
      try {
        if (!handler) throw new Error(`No handler registered for job type ${job.type}`);
        await handler(JSON.parse(job.payload));
        await db.job.update({ where: { id: job.id }, data: { status: "DONE", error: null } });
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        const retry = job.attempts < MAX_ATTEMPTS;
        await db.job.update({
          where: { id: job.id },
          data: retry
            ? { status: "PENDING", error: message, runAfter: new Date(Date.now() + 15_000 * job.attempts) }
            : { status: "FAILED", error: message },
        });
        if (!retry) await onFinalFailure(job.type, JSON.parse(job.payload), message);
      }
    }
  } catch (e) {
    console.error("[jobs] worker error", e);
  } finally {
    w.busy = false;
  }
}

export function registerFailureHook(type: string, hook: Hook) {
  failureHooks.set(type, hook);
}
async function onFinalFailure(type: string, payload: Record<string, unknown>, error: string) {
  await failureHooks.get(type)?.(payload, error).catch((e) => console.error("[jobs] failure hook", e));
}

function kick() {
  setImmediate(() => void tick());
}

export function startWorker() {
  if (state.__jobWorker?.running) return;
  state.__jobWorker = { running: true, busy: false };
  // Jobs left RUNNING by a crash or restart go back to the queue.
  void db.job.updateMany({ where: { status: "RUNNING" }, data: { status: "PENDING" } }).then(kick);
  state.__jobWorker.timer = setInterval(() => void tick(), POLL_MS);
  state.__jobWorker.timer.unref?.();
}
