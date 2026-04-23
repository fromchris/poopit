import { NextResponse } from "next/server";
import { prisma } from "@/app/server/db";

export async function GET(): Promise<Response> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: "ok",
      db: "up",
      uptimeSec: Math.floor(process.uptime()),
      latencyMs: Date.now() - start,
      now: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      {
        status: "degraded",
        db: "down",
        error: err instanceof Error ? err.message : "unknown",
      },
      { status: 503 }
    );
  }
}
