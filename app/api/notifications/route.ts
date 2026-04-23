import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { withHandler, parseQuery } from "@/app/server/handler";
import { prisma } from "@/app/server/db";
import { serializeNotification } from "@/app/server/serialize";

const query = z.object({
  type: z.enum(["all", "like", "comment", "follow", "remix", "system"]).default("all"),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(30),
});

export const GET = withHandler(async ({ req, requireAuth }) => {
  const session = requireAuth();
  const q = parseQuery(req, query);

  const where: Prisma.NotificationWhereInput = {
    recipientId: session.user.id,
  };
  if (q.type !== "all") where.type = q.type;

  const rows = await prisma.notification.findMany({
    where,
    orderBy: [{ createdAt: "desc" }],
    take: q.limit + 1,
    ...(q.cursor ? { cursor: { id: q.cursor }, skip: 1 } : {}),
    include: { actor: true },
  });
  const hasMore = rows.length > q.limit;
  const page = hasMore ? rows.slice(0, q.limit) : rows;
  const unread = await prisma.notification.count({
    where: { recipientId: session.user.id, read: false },
  });
  return NextResponse.json({
    items: page.map(serializeNotification),
    nextCursor: hasMore ? page[page.length - 1]!.id : null,
    unread,
  });
});
