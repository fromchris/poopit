import { NextResponse } from "next/server";
import { z } from "zod";
import { withHandler, parseJson } from "@/app/server/handler";
import { assertCsrf, getClientIp } from "@/app/server/auth";
import { prisma } from "@/app/server/db";
import { consume } from "@/app/server/rateLimit";

const body = z.object({
  playableId: z.string().optional(),
  commentId: z.string().optional(),
  reason: z.string().min(2).max(60),
  notes: z.string().max(500).optional(),
});

export const POST = withHandler(async ({ req, session }) => {
  const input = await parseJson(req, body);
  const key = session
    ? `user:${session.user.id}`
    : `ip:${getClientIp(req)}`;
  await consume("publish", key); // reuse the publish limiter — same cadence
  if (session) assertCsrf(req, session);
  await prisma.report.create({
    data: {
      reporterId: session?.user.id ?? null,
      playableId: input.playableId ?? null,
      commentId: input.commentId ?? null,
      reason: input.reason,
      notes: input.notes ?? null,
    },
  });
  return NextResponse.json({ ok: true });
});
