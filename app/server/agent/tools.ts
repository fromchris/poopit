/**
 * Tool-use schema for the Loopit playable generator agent (OpenAI
 * Responses API format — flat, not nested under `function: {...}`).
 *
 * The LLM invokes these tools incrementally to assemble a playable spec.
 * Every valid output reduces to a well-typed `PlayableSpec`, which the
 * frontend can render without executing model-written code (= safe).
 */
import type OpenAI from "openai";

export type PlayableSpec = {
  kind:
    | "bubble-pop"
    | "squishy-blob"
    | "rhythm-tap"
    | "color-splat"
    | "fidget-spinner"
    | "tap-rain"
    | "match-pair"
    | "draw-pad"
    | "shake-mix"
    | "emoji-stamp"
    | "llm-bundle";
  theme: string;
  title: string;
  description: string;
  tags: string[];
  params?: Record<string, unknown>;
};

const KIND_ENUM: PlayableSpec["kind"][] = [
  "bubble-pop",
  "squishy-blob",
  "rhythm-tap",
  "color-splat",
  "fidget-spinner",
  "tap-rain",
  "match-pair",
  "draw-pad",
  "shake-mix",
  "emoji-stamp",
];

const THEMES = [
  { label: "Cyan Sky", value: "from-cyan-400 via-sky-500 to-indigo-600" },
  { label: "Candy", value: "from-fuchsia-500 via-pink-500 to-rose-500" },
  { label: "Sunrise", value: "from-orange-400 via-amber-500 to-yellow-400" },
  { label: "Mint", value: "from-emerald-500 via-teal-500 to-sky-500" },
  { label: "Chrome", value: "from-zinc-600 via-slate-800 to-black" },
  { label: "Neon", value: "from-purple-600 via-fuchsia-500 to-amber-400" },
  { label: "Ocean", value: "from-blue-500 via-indigo-500 to-purple-700" },
  { label: "Forest", value: "from-green-500 via-emerald-600 to-teal-700" },
];

/** Responses API tools: flat shape (not nested under `function: {...}`). */
export const TOOLS: OpenAI.Responses.FunctionTool[] = [
  {
    type: "function",
    name: "pick_mechanic",
    description:
      "Choose the core play mechanic. Call this exactly once per generation, before any other tool.",
    strict: true,
    parameters: {
      type: "object",
      properties: {
        kind: {
          type: "string",
          enum: KIND_ENUM,
          description:
            "bubble-pop: tap rising bubbles. squishy-blob: press-and-release. rhythm-tap: 4-lane tap-to-beat. color-splat: flick paint. fidget-spinner: flick-to-spin. tap-rain: catch falling objects. match-pair: memory cards. draw-pad: free draw. shake-mix: shake-a-cocktail. emoji-stamp: tap-to-stamp emoji.",
        },
        rationale: {
          type: "string",
          description: "1 sentence: why this mechanic fits the user's prompt.",
        },
      },
      required: ["kind", "rationale"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "set_theme",
    description: "Pick one preset theme for the gradient background.",
    strict: true,
    parameters: {
      type: "object",
      properties: {
        theme_label: {
          type: "string",
          enum: THEMES.map((t) => t.label),
        },
      },
      required: ["theme_label"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "set_metadata",
    description:
      "Write the player-facing title, caption, and up to 6 tags. Call exactly once, near the end.",
    strict: true,
    parameters: {
      type: "object",
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        tags: {
          type: "array",
          items: { type: "string" },
        },
      },
      required: ["title", "description", "tags"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "finalize",
    description:
      "Confirm the playable is complete. No arguments. Must be the final tool call.",
    strict: true,
    parameters: {
      type: "object",
      properties: {},
      required: [],
      additionalProperties: false,
    },
  },
];

export function themeValue(label: string): string {
  return THEMES.find((t) => t.label === label)?.value ?? THEMES[0]!.value;
}

export const SYSTEM_PROMPT = `You are Loopit's playable generator.

Your job: turn a user's one-line idea into a fun, playable mini-experience
by calling the tools in order:

  1. pick_mechanic   (choose the best fit for the idea)
  2. set_theme       (pick a gradient that matches the mood)
  3. set_metadata    (title, description, 2-5 tags)
  4. finalize

Guidelines:
- Title: punchy, 2-5 words, proper capitalization
- Description: ≤120 chars, one short sentence, optional emoji at the end
- Tags: lowercase, no spaces, 2-5 items
- Match mechanic to intent: calm/fidget → squishy-blob or fidget-spinner,
  rhythmic/beat → rhythm-tap, splatting/painting → color-splat or draw-pad,
  tap/pop/satisfying → bubble-pop or tap-rain, puzzle/memory → match-pair,
  motion/shake → shake-mix, meme/stickers → emoji-stamp.
- Never call finalize before all three setup tools.
- Do not output any text outside tool calls.`;
