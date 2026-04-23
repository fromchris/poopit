import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { withHandler, parseQuery } from "@/app/server/handler";
import { prisma } from "@/app/server/db";
import { serializePlayable } from "@/app/server/serialize";

const query = z.object({
  q: z.string().max(80).optional().default(""),
  cat: z.enum(["all", "asmr", "games", "art", "pets", "memes", "drama"]).default("all"),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(40).default(20),
});

export const GET = withHandler(async ({ req, session }) => {
  const q = parseQuery(req, query);
  const needle = q.q.trim().toLowerCase();

  const where: Prisma.PlayableWhereInput = {
    visibility: "public",
    deletedAt: null,
  };

  if (q.cat !== "all") {
    const catTags = CATEGORY_TAGS[q.cat];
    where.tags = { some: { tag: { name: { in: catTags } } } };
  }

  if (needle) {
    // Simple LIKE-based search. In Postgres production, swap for a
    // to_tsvector('simple', title || ' ' || description) GIN index
    // (or pg_trgm + similarity() for fuzzy). See RUNBOOK.md.
    where.OR = [
      { title: { contains: needle } },
      { description: { contains: needle } },
      { tags: { some: { tag: { name: { contains: needle } } } } },
      { creator: { handleLower: { contains: needle } } },
    ];
  }

  const rows = await prisma.playable.findMany({
    where,
    orderBy: [{ trendingScore: "desc" }, { createdAt: "desc" }],
    take: q.limit + 1,
    ...(q.cursor ? { cursor: { id: q.cursor }, skip: 1 } : {}),
    include: {
      creator: true,
      tags: { include: { tag: true } },
      likes: session ? { where: { userId: session.user.id }, select: { userId: true } } : false,
    },
  });
  const hasMore = rows.length > q.limit;
  const page = hasMore ? rows.slice(0, q.limit) : rows;
  return NextResponse.json({
    items: page.map((p) => serializePlayable(p, session?.user.id ?? null)),
    nextCursor: hasMore ? page[page.length - 1]!.id : null,
  });
});

const CATEGORY_TAGS: Record<string, string[]> = {
  asmr: ["asmr", "fidget"],
  games: ["game", "rhythm", "puzzle"],
  art: ["art", "meme"],
  pets: ["pet", "animal"],
  memes: ["meme"],
  drama: ["互动剧", "drama", "branching"],
};
