import { NextResponse } from "next/server";
import { withHandler } from "@/app/server/handler";
import { createGuestUser, createSession, getClientIp, setSessionCookie } from "@/app/server/auth";
import { consume } from "@/app/server/rateLimit";

/** Creates a throwaway account and signs the user in. */
export const POST = withHandler(async ({ req }) => {
  await consume("auth", `ip:${getClientIp(req)}`);
  const { user, recoveryCode } = await createGuestUser();
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
      isGuest: true,
    },
    recoveryCode, // shown once — lets the user reclaim this account later
    csrfToken: csrf,
  });
  setSessionCookie(res, raw, csrf);
  return res;
});
