import { NextResponse } from "next/server";
import { z } from "zod";
import { withHandler, parseQuery } from "@/app/server/handler";
import { prisma } from "@/app/server/db";
import { serializePlayable } from "@/app/server/serialize";

const query = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(40).default(20),
});

export const GET = withHandler(async ({ req, requireAuth }) => {
  const session = requireAuth();
  const q = parseQuery(req, query);
  const rows = await prisma.like.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: q.limit + 1,
    ...(q.cursor ? { cursor: { userId_playableId: { userId: session.user.id, playableId: q.cursor } }, skip: 1 } : {}),
    include: {
      playable: {
        include: {
          creator: true,
          tags: { include: { tag: true } },
        },
      },
    },
  });
  const hasMore = rows.length > q.limit;
  const page = hasMore ? rows.slice(0, q.limit) : rows;
  return NextResponse.json({
    items: page
      .filter((l) => !l.playable.deletedAt)
      .map((l) => serializePlayable({ ...l.playable, likes: [{ userId: session.user.id }] }, session.user.id)),
    nextCursor: hasMore ? page[page.length - 1]!.playableId : null,
  });
});
