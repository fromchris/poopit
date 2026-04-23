// Small helpers that are platform-agnostic — copied verbatim from the
// web's app/lib/mockData.ts so counts, timestamps, and the like render
// the same in both apps.

export function formatCount(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0)}K`;
  return `${(n / 1_000_000).toFixed(1)}M`;
}
