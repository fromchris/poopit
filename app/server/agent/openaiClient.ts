/**
 * Minimal OpenAI Responses-API client built on fetch() + SSE.
 *
 * Why not the official SDK? Custom gateways (OpenRouter, Azure-flavoured
 * proxies, self-hosted inference) sometimes reject SDK-added fields. This
 * thin wrapper sends exactly what we put in the body — what curl can hit,
 * this can hit.
 */
import { logger } from "@/app/server/logger";

/** Responses API content parts. `input_image` enables GPT-5.4 vision. */
export type ResponsesContentPart =
  | { type: "input_text"; text: string }
  | { type: "input_image"; image_url: string; detail?: "auto" | "low" | "high" };

export type ResponsesInputItem =
  | { role: "user" | "assistant" | "system"; content: string | ResponsesContentPart[] }
  | { type: "function_call_output"; call_id: string; output: string }
  | Record<string, unknown>;

export type ResponsesTool = {
  type: "function";
  name: string;
  description?: string | null;
  strict?: boolean | null;
  parameters: Record<string, unknown> | null;
};

export type ResponsesCreateBody = {
  model: string;
  input: ResponsesInputItem[];
  instructions?: string;
  tools?: ResponsesTool[];
  tool_choice?: "auto" | "required" | "none";
  stream?: boolean;
  store?: boolean;
  reasoning?: { effort: string };
  prompt_cache_key?: string;
  prompt_cache_retention?: string;
  previous_response_id?: string;
  [k: string]: unknown;
};

export type SseEvent = { type: string; [k: string]: unknown };

function cfg() {
  const apiKey = process.env.OPENAI_API_KEY;
  const base = (process.env.OPENAI_BASE_URL || "https://api.openai.com").replace(/\/+$/, "");
  const baseUrl = base.endsWith("/v1") ? base : `${base}/v1`;
  return { apiKey, baseUrl };
}

/** Maximum total time a single stream call may run (ms). */
const HARD_TIMEOUT_MS = Number(process.env.OPENAI_TIMEOUT_MS ?? 5 * 60 * 1000);
/** Maximum idle time between SSE events (ms). */
const IDLE_TIMEOUT_MS = Number(process.env.OPENAI_IDLE_TIMEOUT_MS ?? 90 * 1000);

/**
 * POST /v1/responses (stream=true). Yields typed event objects.
 * Throws on HTTP failure, `response.error` events, hard deadline, or
 * idle-timeout (no SSE data for N seconds → we assume hung).
 */
export async function* streamResponses(
  body: ResponsesCreateBody,
  signal?: AbortSignal
): AsyncGenerator<SseEvent, void, void> {
  const { apiKey, baseUrl } = cfg();
  if (!apiKey) throw new Error("OPENAI_API_KEY not set");

  const controller = new AbortController();
  if (signal) signal.addEventListener("abort", () => controller.abort(), { once: true });

  const hardTimer = setTimeout(() => controller.abort(), HARD_TIMEOUT_MS);

  const res = await fetch(`${baseUrl}/responses`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify({ ...body, stream: true }),
    signal: controller.signal,
  }).catch((err) => {
    clearTimeout(hardTimer);
    throw err;
  });

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    // Dump to a file so we can inspect from outside the dev-server stdout.
    try {
      const fs = await import("fs/promises");
      await fs.writeFile(
        "./storage/openai-last-fail.json",
        JSON.stringify({ status: res.status, body: text.slice(0, 1200), sent: body }, null, 2)
      );
    } catch {}
    logger.error(
      {
        status: res.status,
        body: text.slice(0, 400),
        request: JSON.stringify(body).slice(0, 1200),
      },
      "responses http failure"
    );
    throw new Error(`responses ${res.status}: ${text.slice(0, 200)}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";

  try {
    while (true) {
      // Race each read against an idle-timeout. If the gateway goes silent
      // for IDLE_TIMEOUT_MS, assume it's hung and bail with a clear error.
      let idleTimer: ReturnType<typeof setTimeout> | undefined;
      const idlePromise = new Promise<never>((_, reject) => {
        idleTimer = setTimeout(() => {
          controller.abort();
          reject(new Error(`idle-timeout: no data for ${IDLE_TIMEOUT_MS}ms`));
        }, IDLE_TIMEOUT_MS);
      });

      let chunk: ReadableStreamReadResult<Uint8Array>;
      try {
        chunk = await Promise.race([reader.read(), idlePromise]);
      } finally {
        if (idleTimer) clearTimeout(idleTimer);
      }
      if (chunk.done) break;
      buf += decoder.decode(chunk.value, { stream: true });
      let idx: number;
      while ((idx = buf.indexOf("\n\n")) !== -1) {
        const raw = buf.slice(0, idx);
        buf = buf.slice(idx + 2);
        const evt = parseSseChunk(raw);
        if (evt) yield evt;
      }
    }
  } finally {
    clearTimeout(hardTimer);
    try {
      reader.releaseLock();
    } catch {}
    // If we're exiting cleanly but the fetch is still alive somehow, abort it.
    try {
      controller.abort();
    } catch {}
  }
}

function parseSseChunk(raw: string): SseEvent | null {
  let dataStr = "";
  for (const line of raw.split("\n")) {
    if (line.startsWith("data:")) dataStr += line.slice(5).trim();
  }
  if (!dataStr) return null;
  try {
    return JSON.parse(dataStr) as SseEvent;
  } catch {
    return null;
  }
}

/**
 * POST /v1/responses (non-streaming). Returns the full response object.
 */
export async function createResponses(
  body: ResponsesCreateBody,
  signal?: AbortSignal
): Promise<Record<string, unknown>> {
  const { apiKey, baseUrl } = cfg();
  if (!apiKey) throw new Error("OPENAI_API_KEY not set");

  const res = await fetch(`${baseUrl}/responses`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...body, stream: false }),
    signal,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`responses ${res.status}: ${text.slice(0, 200)}`);
  }
  return (await res.json()) as Record<string, unknown>;
}
