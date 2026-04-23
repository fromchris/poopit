// Native-side helpers for turning the web's Tailwind gradient class
// strings (e.g. "from-cyan-400 via-sky-500 to-indigo-600") into a
// concrete list of hex stops the native gradient renderer can use.
//
// The backend's `theme` field and `avatarBg` field are authored as
// Tailwind classes because the web app is Tailwind-first. On RN we
// parse out the color tokens and resolve them against this table.
//
// Not exhaustive — covers the ~30 Tailwind colors the seed data uses.

const TAILWIND: Record<string, string> = {
  black: "#000000",
  white: "#ffffff",
  // slate / zinc
  "slate-400": "#94a3b8",
  "slate-600": "#475569",
  "slate-800": "#1e293b",
  "zinc-400": "#a1a1aa",
  "zinc-600": "#52525b",
  "zinc-700": "#3f3f46",
  "zinc-800": "#27272a",
  "zinc-900": "#18181b",
  // reds / roses
  "rose-400": "#fb7185",
  "rose-500": "#f43f5e",
  "pink-200": "#fbcfe8",
  "pink-400": "#f472b6",
  "pink-500": "#ec4899",
  "fuchsia-400": "#e879f9",
  "fuchsia-500": "#d946ef",
  // warm
  "amber-300": "#fcd34d",
  "amber-400": "#fbbf24",
  "amber-500": "#f59e0b",
  "orange-400": "#fb923c",
  "orange-500": "#f97316",
  "yellow-400": "#facc15",
  // cools
  "sky-500": "#0ea5e9",
  "cyan-400": "#22d3ee",
  "blue-500": "#3b82f6",
  "indigo-600": "#4f46e5",
  "violet-500": "#8b5cf6",
  "violet-600": "#7c3aed",
  "purple-500": "#a855f7",
  "purple-600": "#9333ea",
  // greens
  "emerald-400": "#34d399",
  "emerald-500": "#10b981",
  "teal-500": "#14b8a6",
};

export function resolveTailwindColor(token: string): string | null {
  return TAILWIND[token] ?? null;
}

/**
 * Parse "from-X via-Y to-Z" → [fromHex, viaHex, toHex]. Missing stops
 * are elided. Unknown tokens fall back to a dark-pink gradient.
 */
export function parseGradient(classes: string | undefined | null): string[] {
  if (!classes) return ["#0a0a0a", "#1a0a10"];
  const tokens = classes.split(/\s+/);
  const stops: string[] = [];
  for (const t of tokens) {
    const m = t.match(/^(?:from|via|to)-(.+)$/);
    if (!m) continue;
    const hex = resolveTailwindColor(m[1]!);
    if (hex) stops.push(hex);
  }
  if (stops.length === 0) return ["#0a0a0a", "#1a0a10"];
  if (stops.length === 1) return [stops[0]!, stops[0]!];
  return stops;
}

export const palette = {
  bg: "#000000",
  chromeBg: "#0a0a0aee",
  chromeText: "#ffffff",
  muted: "#ffffff90",
  dim: "#ffffff60",
  divider: "#ffffff18",
  accent: "#ec4899",
  likeOn: "#f43f5e",
};
