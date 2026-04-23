import { NextRequest } from "next/server";
import { prisma } from "@/app/server/db";
import { getSession } from "@/app/server/auth";
import { avatarBgFor, timeAgo } from "@/app/server/serialize";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id: conversationId } = await ctx.params;
  const session = await getSession(req);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const member = await prisma.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId, userId: session.user.id } },
  });
  if (!member) return new Response("Forbidden", { status: 403 });

  let lastSeen = new Date();
  let closed = false;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder();
      const send = (event: string, data: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        } catch {
          closed = true;
        }
      };

      send("hello", { userId: session.user.id });

      const poll = async () => {
        try {
          const rows = await prisma.message.findMany({
            where: {
              conversationId,
              createdAt: { gt: lastSeen },
              senderId: { not: session.user.id },
            },
            orderBy: { createdAt: "asc" },
            include: { sender: true },
          });
          for (const m of rows) {
            send("message", {
              id: m.id,
              body: m.body,
              fromMe: false,
              sender: {
                handle: m.sender.handle,
                avatar: m.sender.avatar,
                avatarBg: avatarBgFor(m.sender.id),
              },
              timeAgo: timeAgo(m.createdAt),
              createdAt: m.createdAt.toISOString(),
            });
            lastSeen = m.createdAt;
          }
        } catch {
          /* swallow */
        }
      };
      const interval = setInterval(poll, 2000);
      const keepalive = setInterval(() => send("ping", { t: Date.now() }), 25000);
      req.signal.addEventListener("abort", () => {
        closed = true;
        clearInterval(interval);
        clearInterval(keepalive);
        try {
          controller.close();
        } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
