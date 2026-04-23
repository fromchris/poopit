import { NextResponse } from "next/server";
import { withHandler } from "@/app/server/handler";
import { assertCsrf } from "@/app/server/auth";
import { prisma } from "@/app/server/db";
import { ForbiddenError, NotFoundError } from "@/app/server/errors";

export const DELETE = withHandler<{ id: string }>(async ({ req, params, requireAuth }) => {
  const session = requireAuth();
  assertCsrf(req, session);
  const c = await prisma.comment.findUnique({ where: { id: params.id } });
  if (!c || c.deletedAt) throw new NotFoundError();
  if (c.authorId !== session.user.id) throw new ForbiddenError();
  await prisma.$transaction([
    prisma.comment.update({ where: { id: c.id }, data: { deletedAt: new Date() } }),
    prisma.playable.update({
      where: { id: c.playableId },
      data: { commentCount: { decrement: 1 } },
    }),
  ]);
  return NextResponse.json({ ok: true });
});
