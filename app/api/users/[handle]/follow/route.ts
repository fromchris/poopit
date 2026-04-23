import { NextResponse } from "next/server";
import { withHandler } from "@/app/server/handler";
import { assertCsrf } from "@/app/server/auth";
import { prisma } from "@/app/server/db";
import { consume } from "@/app/server/rateLimit";
import { BadRequestError, NotFoundError } from "@/app/server/errors";

export const POST = withHandler<{ handle: string }>(async ({ req, params, requireAuth }) => {
  const session = requireAuth();
  assertCsrf(req, session);
  await consume("follow", `user:${session.user.id}`);

  const target = await loadTarget(params.handle);
  if (target.id === session.user.id) throw new BadRequestError("Cannot follow yourself");

  try {
    await prisma.follow.create({
      data: { followerId: session.user.id, followeeId: target.id },
    });
    if (target.id !== session.user.id) {
      await prisma.notification.create({
        data: {
          recipientId: target.id,
          actorId: session.user.id,
          type: "follow",
        },
      });
    }
  } catch {
    // unique constraint — already following
  }
  return NextResponse.json({ following: true });
});

export const DELETE = withHandler<{ handle: string }>(async ({ req, params, requireAuth }) => {
  const session = requireAuth();
  assertCsrf(req, session);
  const target = await loadTarget(params.handle);
  await prisma.follow
    .delete({ where: { followerId_followeeId: { followerId: session.user.id, followeeId: target.id } } })
    .catch(() => {});
  return NextResponse.json({ following: false });
});

async function loadTarget(raw: string) {
  const handle = decodeURIComponent(raw);
  const user = await prisma.user.findUnique({
    where: { handleLower: handle.toLowerCase() },
    select: { id: true, handle: true },
  });
  if (!user) throw new NotFoundError("User not found");
  return user;
}
