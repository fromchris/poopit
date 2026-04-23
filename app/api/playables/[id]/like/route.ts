import { NextResponse } from "next/server";
import { withHandler } from "@/app/server/handler";
import { assertCsrf } from "@/app/server/auth";
import { prisma } from "@/app/server/db";
import { consume } from "@/app/server/rateLimit";
import { NotFoundError } from "@/app/server/errors";

export const POST = withHandler<{ id: string }>(async ({ req, params, requireAuth }) => {
  const session = requireAuth();
  assertCsrf(req, session);
  await consume("like", `user:${session.user.id}`);

  const playable = await prisma.playable.findUnique({ where: { id: params.id } });
  if (!playable || playable.deletedAt) throw new NotFoundError();

  const already = await prisma.like.findUnique({
    where: { userId_playableId: { userId: session.user.id, playableId: playable.id } },
  });
  if (!already) {
    await prisma.$transaction([
      prisma.like.create({
        data: { userId: session.user.id, playableId: playable.id },
      }),
      prisma.playable.update({
        where: { id: playable.id },
        data: { likeCount: { increment: 1 } },
      }),
    ]);
    if (playable.creatorId !== session.user.id) {
      await prisma.notification.create({
        data: {
          recipientId: playable.creatorId,
          actorId: session.user.id,
          type: "like",
          targetId: playable.id,
          targetTitle: playable.title,
        },
      });
    }
  }
  const count = await prisma.playable.findUnique({
    where: { id: playable.id },
    select: { likeCount: true },
  });
  return NextResponse.json({ liked: true, likeCount: count!.likeCount });
});

export const DELETE = withHandler<{ id: string }>(async ({ req, params, requireAuth }) => {
  const session = requireAuth();
  assertCsrf(req, session);

  const existing = await prisma.like.findUnique({
    where: { userId_playableId: { userId: session.user.id, playableId: params.id } },
  });
  if (existing) {
    await prisma.$transaction([
      prisma.like.delete({
        where: { userId_playableId: { userId: session.user.id, playableId: params.id } },
      }),
      prisma.playable.update({
        where: { id: params.id },
        data: { likeCount: { decrement: 1 } },
      }),
    ]);
  }
  const p = await prisma.playable.findUnique({
    where: { id: params.id },
    select: { likeCount: true },
  });
  return NextResponse.json({ liked: false, likeCount: p?.likeCount ?? 0 });
});
