// In-memory sliding-window limiter. Enough for the single-server deployment this app targets;
// a multi-instance deployment would move this into the database or a shared cache.

const buckets = new Map<string, number[]>();

export interface LimitResult {
  allowed: boolean;
  retryAfterSec: number;
}

export function checkLimit(key: string, max: number, windowMs: number, now = Date.now()): LimitResult {
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  buckets.set(key, hits);
  if (hits.length >= max) return { allowed: false, retryAfterSec: Math.ceil((windowMs - (now - hits[0])) / 1000) };
  return { allowed: true, retryAfterSec: 0 };
}

export function recordHit(key: string, now = Date.now()): void {
  const hits = buckets.get(key) ?? [];
  hits.push(now);
  buckets.set(key, hits);
  if (buckets.size > 10_000) {
    // Drop the oldest keys so memory stays bounded under a flood of distinct keys.
    for (const k of Array.from(buckets.keys()).slice(0, 1000)) buckets.delete(k);
  }
}

export function clearHits(key: string): void {
  buckets.delete(key);
}
