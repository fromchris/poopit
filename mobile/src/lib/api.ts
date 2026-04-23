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
 * Pull the loopit_csrf value out of a Set-Cookie header so subsequent
 * POSTs can echo it back. RN's fetch implementation exposes set-cookie
 * on response headers (iOS: comma-joined; Android: same).
 */
function captureCsrf(res: Response): void {
  const raw = res.headers.get("set-cookie");
  if (!raw) return;
  const m = raw.match(/(?:^|[,;\s])loopit_csrf=([^;,\s]+)/);
  if (m) csrf = decodeURIComponent(m[1]!);
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

  const res = await fetch(url, {
    ...init,
    method,
    headers,
    body,
    credentials: "include",
  });
  captureCsrf(res);
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  const data = text ? safeParse(text) : null;
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
