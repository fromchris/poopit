import { prisma } from "./db";
import { RateLimitError } from "./errors";

/**
 * Persistent token-bucket rate limiter backed by the DB.
 *
 * Keys are "scope:userId" or "scope:ip:xxx".
 * `capacity` tokens; refills at `refillPerSec` to capacity.
 *
 * For multi-instance deploys, swap this for Redis (same semantics).
 * SQLite handles this fine for a single-node prototype with a few hundred writes/sec.
 */
export type LimitConfig = {
  capacity: number;
  refillPerSec: number;
};

export const LIMITS = {
  like: { capacity: 120, refillPerSec: 2 },
  comment: { capacity: 6, refillPerSec: 0.1 },
  follow: { capacity: 30, refillPerSec: 0.5 },
  publish: { capacity: 20, refillPerSec: 20 / 3600 },
  generate: {
    capacity: Number(process.env.RATE_LIMIT_GENERATE_PER_HOUR ?? 10),
    refillPerSec:
      Number(process.env.RATE_LIMIT_GENERATE_PER_HOUR ?? 10) / 3600,
  },
  auth: { capacity: 10, refillPerSec: 10 / 600 }, // 10 per 10min
} satisfies Record<string, LimitConfig>;

export async function consume(
  scope: keyof typeof LIMITS,
  key: string,
  cost = 1
): Promise<void> {
  const cfg = LIMITS[scope];
  const bucketKey = `${scope}:${key}`;
  const now = new Date();

  // Read-modify-write. Wrap in transaction to avoid races.
  await prisma.$transaction(async (tx) => {
    const row = await tx.rateLimitBucket.findUnique({ where: { key: bucketKey } });
    let tokens: number;
    if (!row) {
      tokens = cfg.capacity;
    } else {
      const elapsedSec = Math.max(0, (now.getTime() - row.updatedAt.getTime()) / 1000);
      tokens = Math.min(cfg.capacity, row.tokens + elapsedSec * cfg.refillPerSec);
    }
    if (tokens < cost) {
      const deficit = cost - tokens;
      const retryAfterSec = Math.ceil(deficit / cfg.refillPerSec);
      throw new RateLimitError(retryAfterSec);
    }
    tokens -= cost;
    await tx.rateLimitBucket.upsert({
      where: { key: bucketKey },
      create: { key: bucketKey, tokens, updatedAt: now },
      update: { tokens, updatedAt: now },
    });
  });
}
