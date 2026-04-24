// Fetch wrapper for the RN host. Differences from the web's app/lib/api.ts:
//  - Requests always go to a full URL (EXPO_PUBLIC_BACKEND_URL + path).
//  - CSRF token is stored in-memory here rather than read from document.cookie
//    (RN has no document). The server sets it via Set-Cookie on any response;
//    on the first auth'd GET we scrape it off the cookie header via
//    @react-native-async-storage/async-storage -backed capture below.
//  - credentials:"include" tells RN's fetch to use its native cookie jar so
//    sessions persist across app relaunches.

const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? "";

if (!BASE_URL) {
  // Non-fatal — hitting api() without a base will throw clearly.
  console.warn(
    "[api] EXPO_PUBLIC_BACKEND_URL is not set; network calls will fail.",
  );
}

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;
  constructor(
    status: number,
    code: string,
    message: string,
    details?: unknown,
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

let csrf: string | null = null;

/**
 * Capture the CSRF token from either:
 *  1. A Set-Cookie response header (works on web; iOS/Android RN fetch
 *     usually suppresses Set-Cookie per the Fetch spec, so this is a
 *     best-effort fallback), OR
 *  2. A `csrfToken` field in the response body — the Loopit auth
 *     endpoints always include this, so it's the reliable path on RN
 *     regardless of the Fetch set-cookie quirk.
 */
function captureCsrfFromHeaders(res: Response): void {
  const raw = res.headers.get("set-cookie");
  if (!raw) return;
  const m = raw.match(/(?:^|[,;\s])loopit_csrf=([^;,\s]+)/);
  if (m) csrf = decodeURIComponent(m[1]!);
}

function captureCsrfFromBody(data: unknown): void {
  if (!data || typeof data !== "object") return;
  const t = (data as { csrfToken?: unknown }).csrfToken;
  if (typeof t === "string" && t.length > 0) csrf = t;
}

type ReqInit = Omit<RequestInit, "body" | "headers"> & {
  body?: unknown;
  headers?: Record<string, string>;
};

export async function api<T = unknown>(
  path: string,
  init: ReqInit = {},
): Promise<T> {
  if (!BASE_URL) {
    throw new ApiError(
      0,
      "no_backend_url",
      "EXPO_PUBLIC_BACKEND_URL is not set.",
    );
  }

  const url = path.startsWith("http") ? path : `${BASE_URL}${path}`;
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...init.headers,
  };
  const method = init.method ?? (init.body ? "POST" : "GET");
  if (method !== "GET" && method !== "HEAD" && csrf) {
    headers["x-csrf-token"] = csrf;
  }
  let body: string | undefined;
  if (init.body !== undefined && init.body !== null) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(init.body);
  }

  // RN's native fetch has no built-in timeout — if the dev server or LAN
  // hiccups the promise hangs forever. Race against an AbortController.
  const ac = new AbortController();
  const timeoutMs = 15000;
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      method,
      headers,
      body,
      credentials: "include",
      signal: ac.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    if ((err as { name?: string }).name === "AbortError") {
      throw new ApiError(0, "timeout", `Request timed out after ${timeoutMs}ms`);
    }
    throw new ApiError(
      0,
      "network_error",
      err instanceof Error ? err.message : "Network error",
    );
  }
  clearTimeout(timer);
  captureCsrfFromHeaders(res);
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  const data = text ? safeParse(text) : null;
  captureCsrfFromBody(data);
  if (!res.ok) {
    const e = (
      data as
        | { error?: { code: string; message: string; details?: unknown } }
        | null
    )?.error;
    throw new ApiError(
      res.status,
      e?.code ?? "http_error",
      e?.message ?? `Request failed (${res.status})`,
      e?.details,
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

export function backendUrl(): string {
  return BASE_URL;
}
