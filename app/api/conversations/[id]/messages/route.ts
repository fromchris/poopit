import { NextResponse } from "next/server";
import { z } from "zod";
import { withHandler, parseJson, parseQuery } from "@/app/server/handler";
import { assertCsrf } from "@/app/server/auth";
import { prisma } from "@/app/server/db";
import { consume } from "@/app/server/rateLimit";
import { avatarBgFor, timeAgo } from "@/app/server/serialize";
import { ForbiddenError, NotFoundError } from "@/app/server/errors";
import { moderateText } from "@/app/server/moderation";
import { ModerationError } from "@/app/server/errors";

async function assertMember(conversationId: string, userId: string) {
  const m = await prisma.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  if (!m) throw new ForbiddenError();
}

const listQuery = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const GET = withHandler<{ id: string }>(async ({ req, params, requireAuth }) => {
  const session = requireAuth();
  await assertMember(params.id, session.user.id);
  const q = parseQuery(req, listQuery);

  const rows = await prisma.message.findMany({
    where: { conversationId: params.id, deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: q.limit + 1,
    ...(q.cursor ? { cursor: { id: q.cursor }, skip: 1 } : {}),
    include: { sender: true },
  });
  const hasMore = rows.length > q.limit;
  const page = hasMore ? rows.slice(0, q.limit) : rows;

  // Mark read.
  await prisma.conversationMember.update({
    where: { conversationId_userId: { conversationId: params.id, userId: session.user.id } },
    data: { lastReadAt: new Date() },
  });

  return NextResponse.json({
    items: page
      .slice()
      .reverse()
      .map((m) => ({
        id: m.id,
        body: m.body,
        fromMe: m.senderId === session.user.id,
        sender: {
          handle: m.sender.handle,
          avatar: m.sender.avatar,
          avatarBg: avatarBgFor(m.sender.id),
        },
        timeAgo: timeAgo(m.createdAt),
        createdAt: m.createdAt.toISOString(),
      })),
    nextCursor: hasMore ? page[page.length - 1]!.id : null,
  });
});

const postBody = z.object({
  body: z.string().min(1).max(2000),
});

export const POST = withHandler<{ id: string }>(async ({ req, params, requireAuth }) => {
  const session = requireAuth();
  assertCsrf(req, session);
  await assertMember(params.id, session.user.id);
  await consume("comment", `user:${session.user.id}`);
  const input = await parseJson(req, postBody);
  const bad = moderateText(input.body);
  if (bad) throw new ModerationError(bad);

  const msg = await prisma.message.create({
    data: {
      conversationId: params.id,
      senderId: session.user.id,
      body: input.body,
    },
    include: { sender: true },
  });
  await prisma.conversation.update({
    where: { id: params.id },
    data: { lastMessageAt: new Date() },
  });

  // Find the other members so SSE streams can pick this up.
  const others = await prisma.conversationMember.findMany({
    where: { conversationId: params.id, userId: { not: session.user.id } },
  });
  if (!others.length) throw new NotFoundError();

  return NextResponse.json({
    message: {
      id: msg.id,
      body: msg.body,
      fromMe: true,
      sender: {
        handle: msg.sender.handle,
        avatar: msg.sender.avatar,
        avatarBg: avatarBgFor(msg.sender.id),
      },
      timeAgo: "now",
      createdAt: msg.createdAt.toISOString(),
    },
  });
});
