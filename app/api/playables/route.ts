import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { withHandler, parseJson } from "@/app/server/handler";
import { assertCsrf } from "@/app/server/auth";
import { prisma } from "@/app/server/db";
import { consume } from "@/app/server/rateLimit";
import { moderateText } from "@/app/server/moderation";
import { serializePlayable } from "@/app/server/serialize";
import { ModerationError } from "@/app/server/errors";

const KINDS = [
  "bubble-pop",
  "squishy-blob",
  "rhythm-tap",
  "color-splat",
  "fidget-spinner",
  "interactive-drama",
] as const;

const publishBody = z.object({
  kind: z.enum(KINDS),
  title: z.string().min(1).max(80),
  description: z.string().min(1).max(240),
  theme: z.string().min(3).max(120),
  tags: z.array(z.string().min(1).max(24)).max(8).default([]),
  params: z.record(z.string(), z.unknown()).default({}),
  bundleUrl: z.string().url().optional().nullable(),
  sourceId: z.string().optional().nullable(),
});

/** POST /api/playables — publish a new playable. */
export const POST = withHandler(async ({ req, requireAuth }) => {
  const session = requireAuth();
  assertCsrf(req, session);
  await consume("publish", `user:${session.user.id}`);

  const input = await parseJson(req, publishBody);
  const bad = moderateText(`${input.title}\n${input.description}`);
  if (bad) throw new ModerationError(bad);

  const tagCreates = input.tags.map((name) => ({
    tag: {
      connectOrCreate: {
        where: { name: name.toLowerCase() },
        create: { name: name.toLowerCase() },
      },
    },
  }));

  const playable = await prisma.playable.create({
    data: {
      kind: input.kind,
      title: input.title,
      description: input.description,
      theme: input.theme,
      params: JSON.stringify(input.params),
      bundleUrl: input.bundleUrl ?? null,
      sourceId: input.sourceId ?? null,
      creatorId: session.user.id,
      tags: { create: tagCreates },
    },
    include: {
      creator: true,
      tags: { include: { tag: true } },
    },
  });

  // Bump remix count + notify original creator.
  if (input.sourceId) {
    await prisma.playable.update({
      where: { id: input.sourceId },
      data: { remixCount: { increment: 1 } },
    });
    const src = await prisma.playable.findUnique({ where: { id: input.sourceId } });
    if (src && src.creatorId !== session.user.id) {
      await prisma.notification.create({
        data: {
          recipientId: src.creatorId,
          actorId: session.user.id,
          type: "remix",
          targetId: playable.id,
          targetTitle: src.title,
          preview: input.description.slice(0, 140),
        },
      });
    }
  }

  return NextResponse.json({ playable: serializePlayable(playable, session.user.id) });
});

/** GET /api/playables?cursor=&limit=&creator=&tag= — generic listing. */
const query = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  creator: z.string().optional(),
  tag: z.string().optional(),
});

export const GET = withHandler(async ({ req, session }) => {
  const url = new URL(req.url);
  const q = query.parse(Object.fromEntries(url.searchParams));

  const where: Prisma.PlayableWhereInput = {
    visibility: "public",
    deletedAt: null,
  };
  if (q.creator) where.creator = { handleLower: q.creator.toLowerCase() };
  if (q.tag) where.tags = { some: { tag: { name: q.tag.toLowerCase() } } };

  const rows = await prisma.playable.findMany({
    where,
    orderBy: [{ createdAt: "desc" }],
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
