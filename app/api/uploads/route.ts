import { NextResponse, NextRequest } from "next/server";
import { getSession, assertCsrf } from "@/app/server/auth";
import { consume } from "@/app/server/rateLimit";
import { getStorage } from "@/app/server/storage";
import { logger } from "@/app/server/logger";

const ALLOWED_IMAGE = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
]);
const ALLOWED_VIDEO = new Set(["video/mp4", "video/webm", "video/quicktime"]);

const MAX_IMAGE_BYTES = 6 * 1024 * 1024; // 6 MB
const MAX_VIDEO_BYTES = 40 * 1024 * 1024; // 40 MB

/**
 * POST /api/uploads — multipart/form-data with a `file` field.
 *
 * Accepts images + short videos. Stored via the Storage interface (local fs
 * in dev, S3 in prod). Returns `{url, kind, mime, bytes}`.
 */
export async function POST(req: NextRequest): Promise<Response> {
  const session = await getSession(req);
  if (!session) return jsonError(401, "unauthorized", "Sign in required");
  assertCsrf(req, session);

  await consume("publish", `user:${session.user.id}`); // reuse — same cadence

  const ct = req.headers.get("content-type") ?? "";
  if (!ct.startsWith("multipart/form-data")) {
    return jsonError(400, "bad_request", "Use multipart/form-data");
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch (err) {
    logger.warn({ err }, "upload parse error");
    return jsonError(400, "bad_request", "Couldn't read form body");
  }
  const file = form.get("file");
  if (!(file instanceof File)) {
    return jsonError(400, "bad_request", "Missing file");
  }

  const isImage = ALLOWED_IMAGE.has(file.type);
  const isVideo = ALLOWED_VIDEO.has(file.type);
  if (!isImage && !isVideo) {
    return jsonError(415, "unsupported", `Mime ${file.type} not allowed`);
  }
  const maxBytes = isImage ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
  if (file.size > maxBytes) {
    return jsonError(413, "too_large", `Max ${maxBytes / 1024 / 1024}MB`);
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const storage = getStorage();
  const safeName =
    file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 60) ||
    `upload.${isImage ? "jpg" : "mp4"}`;
  const key = await storage.put(
    `uploads/${session.user.id}`,
    safeName,
    buf,
    file.type
  );
  const url = storage.publicUrl(key);

  return NextResponse.json({
    url,
    kind: isImage ? "image" : "video",
    mime: file.type,
    bytes: buf.byteLength,
    name: safeName,
  });
}

function jsonError(
  status: number,
  code: string,
  message: string,
  details?: unknown
): Response {
  return new Response(JSON.stringify({ error: { code, message, details } }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
