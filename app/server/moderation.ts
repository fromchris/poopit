/**
 * Lightweight, local moderation: blocks obvious slurs / spam.
 *
 * In production, layer this on top of a real moderation API
 * (Anthropic content filters, OpenAI moderation, Perspective API).
 * Returns a short reason string on rejection, null if OK.
 */
const BLOCKLIST = [
  // tiny starter set — extend with a proper list for prod
  /\b(kys|kill[- ]your?self)\b/i,
  /\b(nigger|faggot)\b/i,
  /\b(fuck\s*you|bitch)\b/i,
  /\b(viagra|cialis|free\s+money)\b/i,
];

const SPAM_PATTERNS = [
  /(.)\1{15,}/,                                  // 16+ of same char
  /https?:\/\/\S+.*https?:\/\/\S+.*https?:\/\/\S+/,// 3+ URLs
];

export function moderateText(text: string): string | null {
  const t = text.trim();
  if (!t) return "empty";
  if (t.length > 2000) return "too_long";
  for (const p of BLOCKLIST) if (p.test(t)) return "banned_word";
  for (const p of SPAM_PATTERNS) if (p.test(t)) return "spam_pattern";
  return null;
}

/** Opt-in to external moderation when the key is configured. */
export async function moderateAsync(text: string): Promise<string | null> {
  const quick = moderateText(text);
  if (quick) return quick;
  // Placeholder for external call. Left as a no-op so deploys without a
  // moderation provider still work.
  return null;
}
