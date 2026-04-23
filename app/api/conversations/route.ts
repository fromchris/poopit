import { NextResponse } from "next/server";
import { z } from "zod";
import { withHandler, parseJson } from "@/app/server/handler";
import { assertCsrf, normalizeHandle } from "@/app/server/auth";
import { prisma } from "@/app/server/db";
import { avatarBgFor, timeAgo } from "@/app/server/serialize";
import { NotFoundError, BadRequestError } from "@/app/server/errors";

/** List my conversations (most recently active first). */
export const GET = withHandler(async ({ requireAuth }) => {
  const session = requireAuth();
  const rows = await prisma.conversation.findMany({
    where: { members: { some: { userId: session.user.id } } },
    orderBy: { lastMessageAt: "desc" },
    take: 50,
    include: {
      members: { include: { user: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1, include: { sender: true } },
    },
  });

  const items = rows.map((c) => {
    const me = c.members.find((m) => m.userId === session.user.id);
    const others = c.members.filter((m) => m.userId !== session.user.id);
    const peer = others[0]?.user;
    const last = c.messages[0];
    const unread =
      !last || last.senderId === session.user.id
        ? 0
        : !me?.lastReadAt || last.createdAt > me.lastReadAt
        ? 1
        : 0;
    return {
      id: c.id,
      peer: peer
        ? {
            handle: peer.handle,
            avatar: peer.avatar,
            avatarBg: avatarBgFor(peer.id),
          }
        : null,
      lastMessage: last
        ? {
            body: last.body,
            fromMe: last.senderId === session.user.id,
            timeAgo: timeAgo(last.createdAt),
          }
        : null,
      unread,
      lastMessageAt: c.lastMessageAt.toISOString(),
    };
  });

  return NextResponse.json({ items });
});

/** Create or return an existing 1:1 conversation with a peer by handle. */
const body = z.object({
  handle: z.string().min(2).max(32),
});

export const POST = withHandler(async ({ req, requireAuth }) => {
  const session = requireAuth();
  assertCsrf(req, session);
  const input = await parseJson(req, body);
  const peerHandle = normalizeHandle(input.handle);
  if (peerHandle.toLowerCase() === session.user.handle.toLowerCase()) {
    throw new BadRequestError("Cannot DM yourself");
  }
  const peer = await prisma.user.findUnique({
    where: { handleLower: peerHandle.toLowerCase() },
  });
  if (!peer) throw new NotFoundError("User not found");

  // Find any conversation where both are members.
  const existing = await prisma.conversation.findFirst({
    where: {
      AND: [
        { members: { some: { userId: session.user.id } } },
        { members: { some: { userId: peer.id } } },
      ],
    },
  });
  if (existing) {
    return NextResponse.json({ id: existing.id, created: false });
  }

  const created = await prisma.conversation.create({
    data: {
      members: {
        create: [
          { userId: session.user.id },
          { userId: peer.id },
        ],
      },
    },
  });
  return NextResponse.json({ id: created.id, created: true });
});
