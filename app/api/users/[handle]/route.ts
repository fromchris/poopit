import { NextResponse } from "next/server";
import { withHandler } from "@/app/server/handler";
import { prisma } from "@/app/server/db";
import { avatarBgFor, serializePlayable } from "@/app/server/serialize";
import { NotFoundError } from "@/app/server/errors";

export const GET = withHandler<{ handle: string }>(async ({ params, session }) => {
  const handle = decodeURIComponent(params.handle);
  const user = await prisma.user.findUnique({
    where: { handleLower: handle.toLowerCase() },
    include: {
      _count: { select: { playables: true, followedBy: true, following: true } },
      playables: {
        where: { visibility: "public", deletedAt: null },
        take: 12,
        orderBy: { createdAt: "desc" },
        include: {
          creator: true,
          tags: { include: { tag: true } },
        },
      },
    },
  });
  if (!user || user.deletedAt) throw new NotFoundError();

  const viewerId = session?.user.id ?? null;
  const isFollowing = viewerId
    ? !!(await prisma.follow.findUnique({
        where: { followerId_followeeId: { followerId: viewerId, followeeId: user.id } },
      }))
    : false;
  const totalLikes = await prisma.playable
    .aggregate({ where: { creatorId: user.id }, _sum: { likeCount: true } })
    .then((r) => r._sum.likeCount ?? 0);

  return NextResponse.json({
    user: {
      handle: user.handle,
      avatar: user.avatar,
      avatarBg: avatarBgFor(user.id),
      bio: user.bio,
      isFollowing,
      counts: {
        playables: user._count.playables,
        followers: user._count.followedBy,
        following: user._count.following,
        likes: totalLikes,
      },
    },
    playables: user.playables.map((p) => serializePlayable(p, viewerId)),
  });
});
