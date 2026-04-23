import { NextResponse } from "next/server";
import { z } from "zod";
import { withHandler, parseQuery } from "@/app/server/handler";
import { prisma } from "@/app/server/db";

const query = z.object({
  status: z.enum(["any", "queued", "running", "succeeded", "failed"]).default("any"),
  limit: z.coerce.number().int().min(1).max(30).default(15),
});

/**
 * GET /api/me/generations — the user's recent generation jobs (for the
 * "pending" indicator on the Create tab and post-refresh recovery).
 */
export const GET = withHandler(async ({ req, requireAuth }) => {
  const session = requireAuth();
  const q = parseQuery(req, query);
  const rows = await prisma.generationJob.findMany({
    where: {
      userId: session.user.id,
      ...(q.status === "any" ? {} : { status: q.status }),
    },
    orderBy: { createdAt: "desc" },
    take: q.limit,
  });
  return NextResponse.json({
    items: rows.map((j) => ({
      id: j.id,
      status: j.status,
      mode: j.mode,
      prompt: j.prompt,
      playableId: j.playableId,
      errorCode: j.errorCode,
      steps: safeParse(j.steps),
      createdAt: j.createdAt.toISOString(),
      completedAt: j.completedAt?.toISOString() ?? null,
    })),
  });
});

function safeParse(s: string): string[] {
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}
