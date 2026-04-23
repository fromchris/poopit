import { NextResponse } from "next/server";
import { z } from "zod";
import { withHandler, parseJson } from "@/app/server/handler";
import { createSession, getClientIp, normalizeHandle, setSessionCookie, verifyPassword } from "@/app/server/auth";
import { prisma } from "@/app/server/db";
import { consume } from "@/app/server/rateLimit";
import { UnauthorizedError } from "@/app/server/errors";

const body = z.object({
  handle: z.string().min(2).max(32),
  password: z.string().min(1).max(128),
});

export const POST = withHandler(async ({ req }) => {
  await consume("auth", `ip:${getClientIp(req)}`);
  const input = await parseJson(req, body);
  const lower = normalizeHandle(input.handle).toLowerCase();

  const user = await prisma.user.findUnique({ where: { handleLower: lower } });
  if (!user || !user.passwordHash) {
    // Same error for unknown user vs wrong password (timing-safe).
    await verifyPassword(input.password, "$2a$12$xxxxxxxxxxxxxxxxxxxxxx");
    throw new UnauthorizedError("Invalid handle or password");
  }
  const ok = await verifyPassword(input.password, user.passwordHash);
  if (!ok) throw new UnauthorizedError("Invalid handle or password");
  if (user.deletedAt) throw new UnauthorizedError("Account disabled");

  const { raw, csrf } = await createSession({
    userId: user.id,
    userAgent: req.headers.get("user-agent"),
    ip: getClientIp(req),
  });

  const res = NextResponse.json({
    user: {
      id: user.id,
      handle: user.handle,
      avatar: user.avatar,
      bio: user.bio,
      isGuest: user.isGuest,
    },
    csrfToken: csrf,
  });
  setSessionCookie(res, raw, csrf);
  return res;
});
