import { NextResponse } from "next/server";
import { withHandler } from "@/app/server/handler";
import { assertCsrf } from "@/app/server/auth";
import { prisma } from "@/app/server/db";

export const POST = withHandler(async ({ req, requireAuth }) => {
  const session = requireAuth();
  assertCsrf(req, session);
  const result = await prisma.notification.updateMany({
    where: { recipientId: session.user.id, read: false },
    data: { read: true },
  });
  return NextResponse.json({ markedRead: result.count });
});
