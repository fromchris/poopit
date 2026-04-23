import { TOOLS, SYSTEM_PROMPT, themeValue, type PlayableSpec } from "./tools";
import { streamResponses, type ResponsesInputItem } from "./openaiClient";
import { logger } from "@/app/server/logger";
import { moderateAsync } from "@/app/server/moderation";
import { ModerationError } from "@/app/server/errors";

export type GenerateEvent =
  | { type: "step"; step: string }
  | { type: "token"; usage: { input: number; output: number; cached?: number } }
  | { type: "spec"; spec: PlayableSpec }
  | { type: "error"; message: string };

export type GenerateInput = {
  prompt: string;
  source?: PlayableSpec | null;
};

const MODEL = process.env.OPENAI_MODEL ?? "gpt-5.4";
const EFFORT = process.env.OPENAI_REASONING_EFFORT ?? "high";

const CACHE_KEY = "loopit-gen-planner-v1";
const CACHE_RETENTION = "24h";

/**
 * Multi-turn tool-use loop via OpenAI Responses API (streamed).
 *
 *  - `streamResponses(...)` → raw SSE events from /v1/responses
 *  - `previous_response_id` chains turns for continuity + server cache
 *  - `reasoning.effort = xhigh` per env
 *  - `prompt_cache_key` + `prompt_cache_retention=24h` enable server cache
 */
export async function* runGenerateAgent(
  input: GenerateInput
): AsyncGenerator<GenerateEvent, void, void> {
  const flagged = await moderateAsync(input.prompt);
  if (flagged) throw new ModerationError(flagged);

  yield { type: "step", step: "Understanding your idea" };

  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    yield* offlineFallback(input);
    return;
  }

  const partial: Partial<PlayableSpec> = {};
  let usageIn = 0;
  let usageOut = 0;
  let usageCached = 0;

  // Accumulate full conversation history each turn. Safer than relying on
  // server-side `previous_response_id` chaining — some gateways ignore
  // `store: true` and drop response state.
  const history: ResponsesInputItem[] = [
    { role: "user", content: buildUserMessage(input) },
  ];

  for (let turn = 0; turn < 6; turn++) {
    yield { type: "step", step: stepForTurn(turn) };

    type FnCall = { call_id: string; name: string; arguments: string };
    const completedCalls: FnCall[] = [];
    // Buffer per-item argument deltas so we can also tolerate gateways
    // that skip `output_item.done` (some proxies only emit deltas).
    const argBuffers = new Map<string, { name: string; call_id: string; args: string }>();

    try {
      for await (const event of streamResponses({
        model: MODEL,
        instructions: SYSTEM_PROMPT,
        input: history,
        tools: TOOLS,
        tool_choice: "auto",
        store: true,
        reasoning: { effort: EFFORT },
        prompt_cache_key: CACHE_KEY,
        prompt_cache_retention: CACHE_RETENTION,
      })) {
        const t = event.type;
        if (t === "response.output_item.added") {
          const item = (event as { item?: { type?: string; id?: string; call_id?: string; name?: string } }).item;
          if (item?.type === "function_call" && item.id && item.call_id && item.name) {
            argBuffers.set(item.id, { name: item.name, call_id: item.call_id, args: "" });
          }
        } else if (t === "response.function_call_arguments.delta") {
          const { item_id, delta } = event as { item_id?: string; delta?: string };
          if (item_id && typeof delta === "string") {
            const b = argBuffers.get(item_id);
            if (b) b.args += delta;
          }
        } else if (t === "response.output_item.done") {
          const item = (event as { item?: { type?: string; id?: string; call_id?: string; name?: string; arguments?: string } }).item;
          if (item?.type === "function_call" && item.call_id && item.name) {
            const buffered = item.id ? argBuffers.get(item.id) : undefined;
            completedCalls.push({
              call_id: item.call_id,
              name: item.name,
              arguments: item.arguments ?? buffered?.args ?? "{}",
            });
          }
        } else if (t === "response.completed") {
          const r = (event as {
            response?: {
              id?: string;
              output?: Array<{
                type?: string;
                call_id?: string;
                name?: string;
                arguments?: string;
              }>;
              usage?: {
                input_tokens?: number;
                output_tokens?: number;
                input_tokens_details?: { cached_tokens?: number };
              };
            };
          }).response;
          // Some gateways only put function calls in the final output array.
          if (completedCalls.length === 0 && r?.output) {
            for (const item of r.output) {
              if (item.type === "function_call" && item.call_id && item.name) {
                completedCalls.push({
                  call_id: item.call_id,
                  name: item.name,
                  arguments: item.arguments ?? "{}",
                });
              }
            }
          }
          const u = r?.usage;
          if (u) {
            usageIn += u.input_tokens ?? 0;
            usageOut += u.output_tokens ?? 0;
            usageCached += u.input_tokens_details?.cached_tokens ?? 0;
          }
        } else if (t === "response.error" || t === "error") {
          const err = (event as { error?: { message?: string } }).error;
          throw new Error(err?.message ?? "stream error");
        }
      }
    } catch (err) {
      logger.error({ err }, "stream error");
      throw new Error(err instanceof Error ? err.message : "stream error");
    }

    // Fall back to buffered deltas if the gateway never emitted output_item.done.
    if (completedCalls.length === 0 && argBuffers.size > 0) {
      for (const b of argBuffers.values()) {
        completedCalls.push({ call_id: b.call_id, name: b.name, arguments: b.args });
      }
    }

    if (completedCalls.length === 0) break;

    // Append the assistant's function_call items + our function_call_output
    // replies to the history so the next turn has the full context.
    let finalized = false;
    for (const call of completedCalls) {
      let args: unknown = {};
      try {
        args = JSON.parse(call.arguments || "{}");
      } catch {
        args = {};
      }
      const err = applyTool(partial, call.name, args);
      history.push({
        type: "function_call",
        call_id: call.call_id,
        name: call.name,
        arguments: call.arguments || "{}",
      });
      history.push({
        type: "function_call_output",
        call_id: call.call_id,
        output: err ? `ERROR: ${err}` : "ok",
      });
      if (call.name === "finalize") finalized = true;
    }

    if (finalized) break;
  }

  yield {
    type: "token",
    usage: { input: usageIn, output: usageOut, cached: usageCached },
  };

  const spec = validateAndFinish(partial);
  const postBad = await moderateAsync(`${spec.title}\n${spec.description}`);
  if (postBad) throw new ModerationError(postBad);

  yield { type: "spec", spec };
}

function buildUserMessage(input: GenerateInput): string {
  const base = `Idea:\n"""${input.prompt.trim()}"""`;
  if (input.source) {
    return (
      base +
      `\n\nThis is a REMIX of:\n${JSON.stringify(input.source, null, 2)}\n` +
      `Keep what works, change what the idea asks for.`
    );
  }
  return base + `\n\nDesign a new playable.`;
}

function stepForTurn(turn: number): string {
  const steps = [
    "Sketching the look",
    "Rigging the logic",
    "Wiring interactions",
    "Polishing details",
    "Final touches",
    "Saving",
  ];
  return steps[Math.min(turn, steps.length - 1)]!;
}

function applyTool(
  partial: Partial<PlayableSpec>,
  name: string,
  input: unknown
): string | null {
  try {
    const args = input as Record<string, unknown>;
    switch (name) {
      case "pick_mechanic": {
        const kind = String(args.kind) as PlayableSpec["kind"];
        const allowed = [
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
        if (!allowed.includes(kind)) return "unknown mechanic";
        partial.kind = kind;
        return null;
      }
      case "set_theme": {
        partial.theme = themeValue(String(args.theme_label));
        return null;
      }
      case "set_metadata": {
        const title = String(args.title ?? "").slice(0, 60);
        const description = String(args.description ?? "").slice(0, 160);
        const tags = Array.isArray(args.tags)
          ? args.tags.map(String).slice(0, 6)
          : [];
        if (!title || !description) return "title/description required";
        partial.title = title;
        partial.description = description;
        partial.tags = tags;
        return null;
      }
      case "finalize":
        return null;
      default:
        return "unknown tool";
    }
  } catch (err) {
    logger.warn({ err, tool: name }, "tool apply failed");
    return "bad arguments";
  }
}

function validateAndFinish(partial: Partial<PlayableSpec>): PlayableSpec {
  return {
    kind: partial.kind ?? "bubble-pop",
    theme: partial.theme ?? "from-fuchsia-500 via-pink-500 to-amber-400",
    title: partial.title ?? "Untitled playable",
    description: partial.description ?? "a new remix",
    tags: partial.tags?.length ? partial.tags : ["new"],
  };
}

// ─────────────────── offline fallback ───────────────────

async function* offlineFallback(
  input: GenerateInput
): AsyncGenerator<GenerateEvent, void, void> {
  const steps = ["Sketching the look", "Rigging the logic", "Polishing details"];
  for (const s of steps) {
    yield { type: "step", step: s };
    await new Promise((r) => setTimeout(r, 450));
  }

  const p = input.prompt.toLowerCase();
  const kind: PlayableSpec["kind"] =
    /beat|rhythm|tap to|music|song|note/.test(p) ? "rhythm-tap"
    : /paint|color|splat|mess|drag|stroke/.test(p) ? "color-splat"
    : /draw|sketch|doodle|ink/.test(p) ? "draw-pad"
    : /spin|wheel|fidget|inertia/.test(p) ? "fidget-spinner"
    : /press|squish|bounce|pet|blob|jelly/.test(p) ? "squishy-blob"
    : /catch|rain|falling|drop/.test(p) ? "tap-rain"
    : /match|memory|pair|card/.test(p) ? "match-pair"
    : /shake|cocktail|mix|bottle|jar/.test(p) ? "shake-mix"
    : /sticker|stamp|emoji|meme/.test(p) ? "emoji-stamp"
    : "bubble-pop";

  const theme =
    /pink|candy|sweet/.test(p) ? "from-fuchsia-500 via-pink-500 to-rose-500"
    : /dark|night|neon/.test(p) ? "from-purple-600 via-fuchsia-500 to-amber-400"
    : /ocean|sea|water|blue/.test(p) ? "from-blue-500 via-indigo-500 to-purple-700"
    : /sun|warm|orange|gold/.test(p) ? "from-orange-400 via-amber-500 to-yellow-400"
    : /green|forest|nature|mint/.test(p) ? "from-emerald-500 via-teal-500 to-sky-500"
    : "from-cyan-400 via-sky-500 to-indigo-600";

  const title =
    titleCase(input.prompt.trim().split(/\s+/).slice(0, 5).join(" ")) ||
    "New Playable";

  yield {
    type: "spec",
    spec: {
      kind,
      theme,
      title,
      description: input.prompt.trim().slice(0, 140),
      tags: pickTags(p),
    },
  };
}

function titleCase(s: string): string {
  return s.replace(/\w\S*/g, (w) => w[0]!.toUpperCase() + w.slice(1).toLowerCase());
}

function pickTags(p: string): string[] {
  const tags = new Set<string>();
  if (/fidget|pop|squish|spin/.test(p)) tags.add("fidget");
  if (/asmr|relax|calm/.test(p)) tags.add("asmr");
  if (/game|score|challenge|rhythm/.test(p)) tags.add("game");
  if (/art|paint|color|draw/.test(p)) tags.add("art");
  if (/meme|funny|weird|sticker|emoji/.test(p)) tags.add("meme");
  if (!tags.size) tags.add("new");
  return [...tags];
}
