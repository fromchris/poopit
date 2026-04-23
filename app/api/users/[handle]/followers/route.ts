import { NextResponse } from "next/server";
import { z } from "zod";
import { withHandler, parseQuery } from "@/app/server/handler";
import { prisma } from "@/app/server/db";
import { avatarBgFor } from "@/app/server/serialize";
import { NotFoundError } from "@/app/server/errors";

const query = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(30),
  kind: z.enum(["followers", "following"]).default("followers"),
});

export const GET = withHandler<{ handle: string }>(async ({ req, params, session }) => {
  const q = parseQuery(req, query);
  const handle = decodeURIComponent(params.handle);
  const user = await prisma.user.findUnique({ where: { handleLower: handle.toLowerCase() } });
  if (!user) throw new NotFoundError();

  const rows =
    q.kind === "followers"
      ? await prisma.follow.findMany({
          where: { followeeId: user.id },
          orderBy: { createdAt: "desc" },
          take: q.limit + 1,
          ...(q.cursor ? { cursor: { followerId_followeeId: parseCursor(q.cursor) }, skip: 1 } : {}),
          include: { follower: true },
        })
      : await prisma.follow.findMany({
          where: { followerId: user.id },
          orderBy: { createdAt: "desc" },
          take: q.limit + 1,
          ...(q.cursor ? { cursor: { followerId_followeeId: parseCursor(q.cursor) }, skip: 1 } : {}),
          include: { followee: true },
        });

  const hasMore = rows.length > q.limit;
  const page = hasMore ? rows.slice(0, q.limit) : rows;

  const viewerId = session?.user.id;
  const myFollows = viewerId
    ? new Set(
        (
          await prisma.follow.findMany({
            where: { followerId: viewerId },
            select: { followeeId: true },
          })
        ).map((f) => f.followeeId)
      )
    : new Set<string>();

  const items = page.map((r) => {
    const other =
      q.kind === "followers"
        ? (r as { follower: { id: string; handle: string; avatar: string; bio: string } }).follower
        : (r as { followee: { id: string; handle: string; avatar: string; bio: string } }).followee;
    return {
      handle: other.handle,
      avatar: other.avatar,
      avatarBg: avatarBgFor(other.id),
      bio: other.bio,
      isFollowing: myFollows.has(other.id),
      isYou: other.id === viewerId,
    };
  });

  return NextResponse.json({
    items,
    nextCursor: hasMore
      ? makeCursor(page[page.length - 1]!.followerId, page[page.length - 1]!.followeeId)
      : null,
  });
});

function makeCursor(followerId: string, followeeId: string): string {
  return Buffer.from(`${followerId}:${followeeId}`).toString("base64url");
}
function parseCursor(raw: string): { followerId: string; followeeId: string } {
  const [followerId, followeeId] = Buffer.from(raw, "base64url").toString().split(":");
  return { followerId: followerId!, followeeId: followeeId! };
}
