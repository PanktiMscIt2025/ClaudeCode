// Near-duplicate detection between assignment versions: Jaccard similarity of 3-word shingles.

export function fingerprint(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function shingles(fp: string): Set<string> {
  const words = fp.split(" ").filter(Boolean);
  const out = new Set<string>();
  for (let i = 0; i + 2 < words.length; i++) out.add(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
  return out;
}

export function jaccard(a: string, b: string): number {
  const A = shingles(a);
  const B = shingles(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const s of A) if (B.has(s)) inter++;
  return inter / (A.size + B.size - inter);
}

/** For each fingerprint, its highest similarity to any other one (0–1). */
export function maxSimilarities(fps: string[]): number[] {
  return fps.map((fp, i) => fps.reduce((m, other, j) => (i === j ? m : Math.max(m, jaccard(fp, other))), 0));
}

/** Versions above this are flagged as too similar and must be regenerated before publishing. */
export const SIMILARITY_LIMIT = 0.6;
