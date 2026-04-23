import { NextResponse } from "next/server";
import { z } from "zod";
import { withHandler, parseJson } from "@/app/server/handler";
import { createAccount, createSession, getClientIp, normalizeHandle, setSessionCookie } from "@/app/server/auth";
import { prisma } from "@/app/server/db";
import { consume } from "@/app/server/rateLimit";
import { ConflictError } from "@/app/server/errors";

const body = z.object({
  handle: z.string().min(2).max(32),
  password: z.string().min(6).max(128),
  email: z.string().email().optional().nullable(),
});

export const POST = withHandler(async ({ req }) => {
  await consume("auth", `ip:${getClientIp(req)}`);
  const input = await parseJson(req, body);

  const lower = normalizeHandle(input.handle).toLowerCase();
  const existing = await prisma.user.findUnique({ where: { handleLower: lower } });
  if (existing) throw new ConflictError("Handle already taken");

  const user = await createAccount(input);
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
      isGuest: false,
    },
    csrfToken: csrf,
  });
  setSessionCookie(res, raw, csrf);
  return res;
});
