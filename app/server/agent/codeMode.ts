/**
 * Code-mode generator via OpenAI Responses API (streamed via fetch).
 *
 *  - reasoning.effort = xhigh (per env)
 *  - prompt_cache_key + prompt_cache_retention = "24h" → server-side cache
 *  - streaming text deltas drive `onProgress(bytes)`
 */
import { getStorage } from "@/app/server/storage";
import { analyzeBundle } from "./codeAnalyze";
import { logger } from "@/app/server/logger";
import {
  streamResponses,
  type ResponsesContentPart,
  type ResponsesInputItem,
} from "./openaiClient";

export type Attachment = {
  kind: "image" | "video";
  url: string;
  mime: string;
};

const MODEL = process.env.OPENAI_MODEL ?? "gpt-5.4";
const EFFORT = process.env.OPENAI_REASONING_EFFORT ?? "high";

const CACHE_KEY = "loopit-gen-codebundle-v1";
const CACHE_RETENTION = "24h";

const SYSTEM = `You write tiny interactive playables as a SINGLE self-contained HTML file.

Hard constraints:
- Output ONLY the HTML. No prose, no fences.
- No external resources: no <script src>, no <link href> pointing outside, no <img src="http://...">.
- No network APIs: fetch / XMLHttpRequest / WebSocket / EventSource / sendBeacon are forbidden.
- No eval / Function / Worker / SharedWorker / ServiceWorker / importScripts.
- No document.cookie / localStorage / sessionStorage / indexedDB.
- No <iframe>, <object>, <embed>, <meta http-equiv>.
- Vanilla JS only (no imports). Inline <style> is fine. CSS url() must be data: or omitted.
- The experience must fit a 450x800 portrait viewport and be finger-friendly.
- Keep total size under 150 KB.

Good building blocks: requestAnimationFrame, canvas/2d, touch/pointer events,
CSS transforms, simple DOM.`;

export type CodeGenResult =
  | { ok: true; bundleUrl: string; bytes: number }
  | { ok: false; reason: string };

export async function generateBundle(opts: {
  prompt: string;
  sourceDescription?: string;
  attachments?: Attachment[];
  onProgress?: (bytes: number) => void;
}): Promise<CodeGenResult> {
  if (!process.env.OPENAI_API_KEY) return { ok: false, reason: "no api key" };

  const attachments = opts.attachments ?? [];
  const mediaNote =
    attachments.length > 0
      ? "\n\nThe user attached " +
        attachments.length +
        " media file(s). Use them as assets in the playable. Embed with these exact URLs:\n" +
        attachments
          .map(
            (a, i) =>
              "  [" + (i + 1) + "] " + a.kind + " (" + a.mime + ") -> " + a.url
          )
          .join("\n") +
        '\nReference them via <img src="..."> or <video src="..." autoplay muted loop playsinline>. Same-origin /api/files/ URLs are allowed in the sandbox.'
      : "";

  const userText = opts.sourceDescription
    ? `Idea: "${opts.prompt}"\n\nThis is a remix of a playable whose caption was: "${opts.sourceDescription}". Keep the spirit, twist on the user's idea.${mediaNote}`
    : `Idea: "${opts.prompt}"${mediaNote}`;

  // Convert same-origin URLs → data URIs so the remote model can actually
  // see the bytes (the gateway can't reach our localhost/private network).
  const userContent: ResponsesContentPart[] = [{ type: "input_text", text: userText }];
  for (const a of attachments) {
    if (a.kind !== "image") continue;
    const dataUri = await toDataUri(a.url, a.mime).catch(() => null);
    if (dataUri) userContent.push({ type: "input_image", image_url: dataUri });
  }
  const userMsg: ResponsesInputItem =
    userContent.length === 1
      ? { role: "user", content: userText }
      : { role: "user", content: userContent };

  for (let attempt = 0; attempt < 2; attempt++) {
    let html = "";
    try {
      for await (const ev of streamResponses({
        model: MODEL,
        instructions: SYSTEM,
        input: [userMsg],
        store: true,
        reasoning: { effort: EFFORT },
        prompt_cache_key: CACHE_KEY,
        prompt_cache_retention: CACHE_RETENTION,
      })) {
        const t = ev.type;
        if (t === "response.output_text.delta") {
          const delta = (ev as { delta?: string }).delta ?? "";
          html += delta;
          if (opts.onProgress) opts.onProgress(html.length);
        } else if (t === "response.error" || t === "error") {
          const err = (ev as { error?: { message?: string } }).error;
          throw new Error(err?.message ?? "stream error");
        }
      }
    } catch (err) {
      logger.error({ err }, "code-mode model error");
      return {
        ok: false,
        reason: err instanceof Error ? `model: ${err.message}` : "model error",
      };
    }

    const cleaned = stripFences(html).trim();
    if (!/^<!doctype html/i.test(cleaned) && !/^<html/i.test(cleaned)) {
      continue;
    }

    const check = analyzeBundle(cleaned);
    if (!check.ok) {
      logger.warn({ reason: check.reason, attempt }, "code-mode rejected");
      continue;
    }

    try {
      const bytes = Buffer.from(cleaned, "utf8");
      const storage = getStorage();
      const storageKey = await storage.put(
        "bundles",
        `playable.html`,
        bytes,
        "text/html; charset=utf-8"
      );
      return {
        ok: true,
        bundleUrl: storage.publicUrl(storageKey),
        bytes: bytes.byteLength,
      };
    } catch (err) {
      logger.error({ err }, "storage error");
      return { ok: false, reason: "storage error" };
    }
  }

  return { ok: false, reason: "moderation or retry exhausted" };
}

function stripFences(s: string): string {
  return s
    .replace(/^```html\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "");
}

/** Read a `/api/files/...` URL from local storage and encode as data URI. */
async function toDataUri(url: string, mime: string): Promise<string | null> {
  if (url.startsWith("data:")) return url;
  // Already an absolute http(s) URL — the gateway can fetch it itself.
  if (/^https?:\/\//i.test(url)) return url;
  if (!url.startsWith("/api/files/")) return null;
  const path = await import("path");
  const fs = await import("fs/promises");
  const rel = url.slice("/api/files/".length);
  const parts = rel.split("/").map((s) => s.replace(/[^a-zA-Z0-9._-]/g, "_"));
  const abs = path.join(process.cwd(), "storage", ...parts);
  try {
    const buf = await fs.readFile(abs);
    return `data:${mime};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}
