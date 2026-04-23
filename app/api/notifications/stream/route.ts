import { prisma } from "@/app/server/db";
import { getSession } from "@/app/server/auth";
import { NextRequest } from "next/server";
import { logger } from "@/app/server/logger";

/**
 * Server-Sent Events stream of new notifications for the signed-in user.
 *
 * For production scale, switch to Redis pub/sub (publish on write, fan out
 * to subscribers) or a durable queue. The polling-based version below is
 * fine up to ~1k concurrent users on a single node.
 */
export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }
  const userId = session.user.id;
  let lastSeen = new Date();
  let closed = false;
  const emitted = new Set<string>();

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

      // initial hello
      send("hello", { userId });

      const poll = async () => {
        try {
          const rows = await prisma.notification.findMany({
            where: { recipientId: userId, createdAt: { gt: lastSeen } },
            orderBy: { createdAt: "asc" },
            include: { actor: true },
          });
          for (const n of rows) {
            if (emitted.has(n.id)) continue;
            emitted.add(n.id);
            send("notification", {
              id: n.id,
              type: n.type,
              targetId: n.targetId,
              targetTitle: n.targetTitle,
              preview: n.preview,
              actor: n.actor
                ? { handle: n.actor.handle, avatar: n.actor.avatar }
                : null,
              createdAt: n.createdAt.toISOString(),
            });
            if (n.createdAt > lastSeen) lastSeen = n.createdAt;
          }
          // Bound the set so a long-lived stream doesn't grow unbounded.
          if (emitted.size > 500) {
            const it = emitted.values();
            for (let i = 0; i < 100; i++) emitted.delete(it.next().value as string);
          }
          const unread = await prisma.notification.count({
            where: { recipientId: userId, read: false },
          });
          send("badge", { unread });
        } catch (err) {
          logger.error({ err, userId }, "sse poll error");
        }
      };

      const interval = setInterval(poll, 3000);
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
      "X-Accel-Buffering": "no", // disable nginx buffering
    },
  });
}
