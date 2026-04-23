import { NextResponse } from "next/server";
import { z } from "zod";
import { withHandler, parseJson, parseQuery } from "@/app/server/handler";
import { assertCsrf } from "@/app/server/auth";
import { prisma } from "@/app/server/db";
import { consume } from "@/app/server/rateLimit";
import { serializeComment } from "@/app/server/serialize";
import { moderateText } from "@/app/server/moderation";
import { ModerationError, NotFoundError } from "@/app/server/errors";

const listQuery = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(30),
});

export const GET = withHandler<{ id: string }>(async ({ req, params, session }) => {
  const q = parseQuery(req, listQuery);
  const rows = await prisma.comment.findMany({
    where: { playableId: params.id, deletedAt: null, parentId: null },
    orderBy: [{ createdAt: "desc" }],
    take: q.limit + 1,
    ...(q.cursor ? { cursor: { id: q.cursor }, skip: 1 } : {}),
    include: {
      author: true,
      likes: session ? { where: { userId: session.user.id }, select: { userId: true } } : false,
    },
  });
  const hasMore = rows.length > q.limit;
  const page = hasMore ? rows.slice(0, q.limit) : rows;
  return NextResponse.json({
    items: page.map((c) => serializeComment(c, session?.user.id ?? null)),
    nextCursor: hasMore ? page[page.length - 1]!.id : null,
  });
});

const postBody = z.object({
  body: z.string().min(1).max(500),
  parentId: z.string().optional(),
});

export const POST = withHandler<{ id: string }>(async ({ req, params, requireAuth }) => {
  const session = requireAuth();
  assertCsrf(req, session);
  await consume("comment", `user:${session.user.id}`);
  const input = await parseJson(req, postBody);

  const bad = moderateText(input.body);
  if (bad) throw new ModerationError(bad);

  const playable = await prisma.playable.findUnique({ where: { id: params.id } });
  if (!playable || playable.deletedAt) throw new NotFoundError();

  const created = await prisma.comment.create({
    data: {
      playableId: playable.id,
      authorId: session.user.id,
      body: input.body,
      parentId: input.parentId ?? null,
    },
    include: { author: true },
  });
  await prisma.playable.update({
    where: { id: playable.id },
    data: { commentCount: { increment: 1 } },
  });
  if (playable.creatorId !== session.user.id) {
    await prisma.notification.create({
      data: {
        recipientId: playable.creatorId,
        actorId: session.user.id,
        type: "comment",
        targetId: playable.id,
        targetTitle: playable.title,
        preview: input.body.slice(0, 140),
      },
    });
  }
  return NextResponse.json({
    comment: serializeComment({ ...created, likes: [] }, session.user.id),
  });
});
