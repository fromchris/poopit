import { NextResponse } from "next/server";
import { withHandler } from "@/app/server/handler";
import { assertCsrf, clearSessionCookie, revokeSession, sha256 } from "@/app/server/auth";

export const POST = withHandler(async ({ req, session }) => {
  const res = NextResponse.json({ ok: true });
  clearSessionCookie(res);

  if (session) {
    assertCsrf(req, session);
    const raw = req.cookies.get("loopit_sess")?.value;
    if (raw) await revokeSession(sha256(raw));
  }
  return res;
});
