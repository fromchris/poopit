import { NextResponse } from "next/server";
import { z } from "zod";
import { withHandler, parseJson } from "@/app/server/handler";
import { assertCsrf } from "@/app/server/auth";
import { prisma } from "@/app/server/db";

export const GET = withHandler(async ({ session }) => {
  if (!session) return NextResponse.json({ user: null });
  return NextResponse.json({
    user: session.user,
    csrfToken: session.csrfToken,
  });
});

const patchBody = z.object({
  handle: z.string().min(2).max(32).optional(),
  bio: z.string().max(160).optional(),
  avatar: z.string().max(8).optional(), // emoji
});

export const PATCH = withHandler(async ({ req, requireAuth }) => {
  const session = requireAuth();
  assertCsrf(req, session);
  const patch = await parseJson(req, patchBody);

  const data: Record<string, string> = {};
  if (patch.bio !== undefined) data.bio = patch.bio;
  if (patch.avatar !== undefined) data.avatar = patch.avatar;
  if (patch.handle) {
    const handle = patch.handle.startsWith("@") ? patch.handle : `@${patch.handle}`;
    data.handle = handle;
    data.handleLower = handle.toLowerCase();
  }
  const user = await prisma.user.update({
    where: { id: session.user.id },
    data,
  });
  return NextResponse.json({
    user: {
      id: user.id,
      handle: user.handle,
      avatar: user.avatar,
      bio: user.bio,
      email: user.email,
      isGuest: user.isGuest,
    },
  });
});
