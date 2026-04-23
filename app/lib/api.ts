/**
 * Thin fetch wrapper with:
 *  - automatic JSON parsing
 *  - CSRF header injection from the loopit_csrf cookie
 *  - consistent ApiError throws ({ code, message })
 */

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;
  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function csrfToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)loopit_csrf=([^;]+)/);
  return match ? decodeURIComponent(match[1]!) : null;
}

type ReqInit = Omit<RequestInit, "body" | "headers"> & {
  body?: unknown;
  headers?: Record<string, string>;
};

export async function api<T = unknown>(path: string, init: ReqInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...init.headers,
  };
  const method = init.method ?? (init.body ? "POST" : "GET");
  if (method !== "GET" && method !== "HEAD") {
    const tok = csrfToken();
    if (tok) headers["x-csrf-token"] = tok;
  }
  let body: string | undefined;
  if (init.body !== undefined && init.body !== null) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(init.body);
  }
  const res = await fetch(path, { ...init, method, headers, body, credentials: "same-origin" });
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  const data = text ? safeParse(text) : null;
  if (!res.ok) {
    const e = (data as { error?: { code: string; message: string; details?: unknown } })?.error;
    throw new ApiError(
      res.status,
      e?.code ?? "http_error",
      e?.message ?? `Request failed (${res.status})`,
      e?.details
    );
  }
  return data as T;
}

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/** Consume an SSE stream; yields { event, data } objects. */
export async function* sse(
  url: string,
  init: { method?: string; body?: unknown } = {}
): AsyncGenerator<{ event: string; data: unknown }, void, void> {
  const headers: Record<string, string> = {
    Accept: "text/event-stream",
  };
  const method = init.method ?? (init.body ? "POST" : "GET");
  if (method !== "GET" && method !== "HEAD") {
    const tok = csrfToken();
    if (tok) headers["x-csrf-token"] = tok;
  }
  let body: string | undefined;
  if (init.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(init.body);
  }
  const res = await fetch(url, { method, headers, body, credentials: "same-origin" });
  if (!res.ok || !res.body) {
    const txt = await res.text().catch(() => "");
    const parsed = safeParse(txt) as { error?: { code: string; message: string } } | null;
    throw new ApiError(
      res.status,
      parsed?.error?.code ?? "sse_error",
      parsed?.error?.message ?? `SSE failed (${res.status})`
    );
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let idx: number;
      while ((idx = buf.indexOf("\n\n")) !== -1) {
        const chunk = buf.slice(0, idx);
        buf = buf.slice(idx + 2);
        const evt = parseSseChunk(chunk);
        if (evt) yield evt;
      }
    }
  } finally {
    reader.releaseLock();
  }
}

function parseSseChunk(raw: string): { event: string; data: unknown } | null {
  let event = "message";
  let data = "";
  for (const line of raw.split("\n")) {
    if (line.startsWith("event:")) event = line.slice(6).trim();
    else if (line.startsWith("data:")) data += line.slice(5).trim();
  }
  if (!data) return null;
  return { event, data: safeParse(data) };
}
