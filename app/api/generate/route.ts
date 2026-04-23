import { z } from "zod";
import { NextResponse, NextRequest } from "next/server";
import { getSession } from "@/app/server/auth";
import { prisma } from "@/app/server/db";
import { consume } from "@/app/server/rateLimit";
import { runJobInBackground } from "@/app/server/agent/runner";
import { logger } from "@/app/server/logger";
import type { PlayableSpec } from "@/app/server/agent/tools";

const body = z.object({
  prompt: z.string().min(3).max(400),
  sourceId: z.string().optional().nullable(),
  mode: z.enum(["parameter", "code"]).default("code"),
  attachments: z
    .array(
      z.object({
        kind: z.enum(["image", "video"]),
        url: z.string().max(1024),
        mime: z.string().max(80),
      })
    )
    .max(4)
    .optional(),
});

/**
 * POST /api/generate — fire-and-forget.
 *
 * Returns `{jobId, status:"queued"}` immediately. The agent runs in the
 * background; when it finishes, it auto-publishes the playable and posts
 * a `generation_ready` notification that the client picks up via its
 * existing SSE notification stream.
 */
export async function POST(req: NextRequest): Promise<Response> {
  const session = await getSession(req);
  if (!session) return jsonError(401, "unauthorized", "Sign in required");

  const header = req.headers.get("x-csrf-token");
  if (!header || header !== session.csrfToken) {
    return jsonError(403, "forbidden", "Bad CSRF token");
  }

  let input: z.infer<typeof body>;
  try {
    input = body.parse(await req.json());
  } catch (err) {
    return jsonError(400, "bad_request", "Invalid input", err);
  }

  try {
    await consume("generate", `user:${session.user.id}`);
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "status" in err &&
      (err as { status: number }).status === 429
    ) {
      const e = err as { details?: { retryAfterSec?: number } };
      return jsonError(429, "rate_limited", "Too many generations", {
        retryAfterSec: e.details?.retryAfterSec ?? 60,
      });
    }
    throw err;
  }

  let source: (PlayableSpec & { id?: string }) | null = null;
  if (input.sourceId) {
    const src = await prisma.playable.findUnique({
      where: { id: input.sourceId },
      include: { tags: { include: { tag: true } } },
    });
    if (src) {
      source = {
        id: src.id,
        kind: src.kind as PlayableSpec["kind"],
        theme: src.theme,
        title: src.title,
        description: src.description,
        tags: src.tags.map((t) => t.tag.name),
      };
    }
  }

  const job = await prisma.generationJob.create({
    data: {
      userId: session.user.id,
      prompt: input.prompt,
      sourceId: input.sourceId ?? null,
      mode: input.mode,
      status: "queued",
    },
  });

  // Fire-and-forget. Works on persistent Node servers (next start, Docker).
  // On serverless (Vercel Functions), wrap with `waitUntil()` — see RUNBOOK.
  runJobInBackground({
    jobId: job.id,
    userId: session.user.id,
    prompt: input.prompt,
    mode: input.mode,
    source,
    attachments: input.attachments,
  }).catch((err) => {
    logger.error({ err, jobId: job.id }, "background runner crashed");
  });

  return NextResponse.json({
    jobId: job.id,
    status: "queued",
    mode: input.mode,
  });
}

/** DELETE /api/generate?jobId=… — cancel a running job or clear a finished one. */
export async function DELETE(req: NextRequest): Promise<Response> {
  const session = await getSession(req);
  if (!session) return jsonError(401, "unauthorized", "Sign in required");
  const header = req.headers.get("x-csrf-token");
  if (!header || header !== session.csrfToken) {
    return jsonError(403, "forbidden", "Bad CSRF token");
  }
  const jobId = new URL(req.url).searchParams.get("jobId");
  if (!jobId) return jsonError(400, "bad_request", "jobId required");
  const job = await prisma.generationJob.findUnique({ where: { id: jobId } });
  if (!job || job.userId !== session.user.id)
    return jsonError(404, "not_found", "Job not found");
  if (job.status === "succeeded" || job.status === "failed") {
    // Already finished — remove from the list.
    await prisma.generationJob.delete({ where: { id: jobId } });
  } else {
    // Mark as cancelled; the runner's idle-timeout will also surface later.
    await prisma.generationJob.update({
      where: { id: jobId },
      data: {
        status: "failed",
        errorCode: "cancelled by user",
        completedAt: new Date(),
      },
    });
  }
  return NextResponse.json({ ok: true });
}

/** GET /api/generate?jobId=… — poll a job's status. */
export async function GET(req: NextRequest): Promise<Response> {
  const session = await getSession(req);
  if (!session) return jsonError(401, "unauthorized", "Sign in required");
  const jobId = new URL(req.url).searchParams.get("jobId");
  if (!jobId) return jsonError(400, "bad_request", "jobId required");
  const job = await prisma.generationJob.findUnique({
    where: { id: jobId },
  });
  if (!job || job.userId !== session.user.id) {
    return jsonError(404, "not_found", "Job not found");
  }
  return NextResponse.json({
    id: job.id,
    status: job.status,
    mode: job.mode,
    playableId: job.playableId,
    prompt: job.prompt,
    errorCode: job.errorCode,
    steps: safeJson(job.steps),
    createdAt: job.createdAt.toISOString(),
    completedAt: job.completedAt?.toISOString() ?? null,
  });
}

function safeJson(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return [];
  }
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
