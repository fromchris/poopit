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
  const c = await prisma.comment.findUnique({ where: { id: params.id } });
  if (!c || c.deletedAt) throw new NotFoundError();
  const existing = await prisma.commentLike.findUnique({
    where: { userId_commentId: { userId: session.user.id, commentId: c.id } },
  });
  if (!existing) {
    await prisma.$transaction([
      prisma.commentLike.create({
        data: { userId: session.user.id, commentId: c.id },
      }),
      prisma.comment.update({ where: { id: c.id }, data: { likeCount: { increment: 1 } } }),
    ]);
  }
  const fresh = await prisma.comment.findUnique({ where: { id: c.id }, select: { likeCount: true } });
  return NextResponse.json({ liked: true, likes: fresh!.likeCount });
});

export const DELETE = withHandler<{ id: string }>(async ({ req, params, requireAuth }) => {
  const session = requireAuth();
  assertCsrf(req, session);
  const existing = await prisma.commentLike.findUnique({
    where: { userId_commentId: { userId: session.user.id, commentId: params.id } },
  });
  if (existing) {
    await prisma.$transaction([
      prisma.commentLike.delete({
        where: { userId_commentId: { userId: session.user.id, commentId: params.id } },
      }),
      prisma.comment.update({
        where: { id: params.id },
        data: { likeCount: { decrement: 1 } },
      }),
    ]);
  }
  const fresh = await prisma.comment.findUnique({ where: { id: params.id }, select: { likeCount: true } });
  return NextResponse.json({ liked: false, likes: fresh?.likeCount ?? 0 });
});
