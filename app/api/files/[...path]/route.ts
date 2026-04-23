/**
 * Serves uploaded files from local fs storage. Intended for dev and
 * small single-node deployments — in production, move these to object
 * storage behind a CDN and remove this route.
 */
import { NextRequest } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> }
): Promise<Response> {
  const { path: parts } = await ctx.params;
  const safe = parts.map((p) => p.replace(/[^a-zA-Z0-9._-]/g, "_"));
  const abs = path.join(process.cwd(), "storage", ...safe);
  try {
    const data = await fs.readFile(abs);
    const ct = contentTypeFor(abs);
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": ct,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}

function contentTypeFor(p: string): string {
  const ext = path.extname(p).toLowerCase();
  const m: Record<string, string> = {
    ".html": "text/html; charset=utf-8",
    ".json": "application/json",
    ".js": "text/javascript",
    ".css": "text/css",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".mp4": "video/mp4",
    ".m3u8": "application/vnd.apple.mpegurl",
    ".ts": "video/mp2t",
  };
  return m[ext] ?? "application/octet-stream";
}
