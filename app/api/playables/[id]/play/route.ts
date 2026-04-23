import { NextResponse } from "next/server";
import { z } from "zod";
import { withHandler, parseJson } from "@/app/server/handler";
import { prisma } from "@/app/server/db";
import { getClientIp } from "@/app/server/auth";
import { createHash } from "crypto";
import { NotFoundError } from "@/app/server/errors";

const body = z.object({
  completed: z.boolean().default(false),
  duration: z.number().int().nonnegative().max(60 * 60 * 24).default(0),
}).default({ completed: false, duration: 0 });

// Dedup window — one play_event per (session, playable) per 10 minutes.
const DEDUP_WINDOW_MS = 10 * 60 * 1000;

export const POST = withHandler<{ id: string }>(async ({ req, params, session }) => {
  const input = await parseJson(req, body).catch(() => ({ completed: false, duration: 0 }));

  const playable = await prisma.playable.findUnique({ where: { id: params.id } });
  if (!playable || playable.deletedAt) throw new NotFoundError();

  const sessionKey = session?.user.id
    ?? createHash("sha256")
      .update(`${getClientIp(req)}|${req.headers.get("user-agent") ?? ""}`)
      .digest("hex")
      .slice(0, 32);

  const since = new Date(Date.now() - DEDUP_WINDOW_MS);
  const recent = await prisma.playEvent.findFirst({
    where: { playableId: playable.id, sessionKey, createdAt: { gt: since } },
    orderBy: { createdAt: "desc" },
  });

  if (!recent) {
    await prisma.playEvent.create({
      data: {
        playableId: playable.id,
        userId: session?.user.id ?? null,
        sessionKey,
        completed: input.completed,
        duration: input.duration,
      },
    });
    await prisma.playable.update({
      where: { id: playable.id },
      data: { playCount: { increment: 1 } },
    });
  } else {
    // Update the existing event's progress (e.g., duration watched)
    await prisma.playEvent.update({
      where: { id: recent.id },
      data: {
        completed: recent.completed || input.completed,
        duration: Math.max(recent.duration, input.duration),
      },
    });
  }

  return NextResponse.json({ ok: true });
});
