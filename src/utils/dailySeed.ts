/**
 * Seeded RNG (mulberry32) — deterministic from a number seed.
 * Returns a function that produces floats in [0, 1).
 */
export function seededRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) >>> 0;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Today's date key in "YYYY-MM-DD" format (local time). */
export function todayKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Convert a date key string to a numeric seed. */
export function dateToSeed(key: string): number {
  // e.g. "2025-06-15" → 20250615
  return parseInt(key.replace(/-/g, ""), 10);
}