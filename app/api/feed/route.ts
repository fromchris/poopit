import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { withHandler, parseQuery } from "@/app/server/handler";
import { prisma } from "@/app/server/db";
import { serializePlayable } from "@/app/server/serialize";

const query = z.object({
  tab: z.enum(["for-you", "following"]).default("for-you"),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(20).default(10),
});

export const GET = withHandler(async ({ req, session }) => {
  const { tab, cursor, limit } = parseQuery(req, query);
  const viewerId = session?.user.id ?? null;

  const followedHandles = viewerId ? await loadFollowedHandles(viewerId) : new Set<string>();

  let where: Prisma.PlayableWhereInput = {
    visibility: "public",
    deletedAt: null,
  };

  const orderBy: Prisma.PlayableOrderByWithRelationInput[] =
    tab === "for-you"
      ? [{ trendingScore: "desc" }, { createdAt: "desc" }]
      : [{ createdAt: "desc" }];

  if (tab === "following") {
    if (followedHandles.size === 0) {
      return NextResponse.json({ items: [], nextCursor: null });
    }
    where = { ...where, creator: { handle: { in: [...followedHandles] } } };
  }

  const rows = await prisma.playable.findMany({
    where,
    orderBy,
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      creator: true,
      tags: { include: { tag: true } },
      likes: viewerId ? { where: { userId: viewerId }, select: { userId: true } } : false,
    },
  });

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const items = page.map((p) => serializePlayable(p, viewerId, followedHandles));

  return NextResponse.json({
    items,
    nextCursor: hasMore ? page[page.length - 1]!.id : null,
  });
});

async function loadFollowedHandles(viewerId: string) {
  const rows = await prisma.follow.findMany({
    where: { followerId: viewerId },
    select: { followee: { select: { handle: true } } },
  });
  return new Set(rows.map((r) => r.followee.handle));
}
