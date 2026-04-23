import { NextResponse } from "next/server";
import { withHandler } from "@/app/server/handler";
import { assertCsrf } from "@/app/server/auth";
import { prisma } from "@/app/server/db";
import { serializePlayable } from "@/app/server/serialize";
import { ForbiddenError, NotFoundError } from "@/app/server/errors";

export const GET = withHandler<{ id: string }>(async ({ params, session }) => {
  const row = await prisma.playable.findFirst({
    where: { id: params.id, deletedAt: null, visibility: "public" },
    include: {
      creator: true,
      tags: { include: { tag: true } },
      likes: session ? { where: { userId: session.user.id }, select: { userId: true } } : false,
    },
  });
  if (!row) throw new NotFoundError();
  return NextResponse.json({ playable: serializePlayable(row, session?.user.id ?? null) });
});

export const DELETE = withHandler<{ id: string }>(async ({ req, params, requireAuth }) => {
  const session = requireAuth();
  assertCsrf(req, session);
  const row = await prisma.playable.findUnique({ where: { id: params.id } });
  if (!row || row.deletedAt) throw new NotFoundError();
  if (row.creatorId !== session.user.id) throw new ForbiddenError();
  await prisma.playable.update({
    where: { id: row.id },
    data: { deletedAt: new Date(), visibility: "deleted" },
  });
  return NextResponse.json({ ok: true });
});
