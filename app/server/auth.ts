import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "./db";
import { ForbiddenError, UnauthorizedError } from "./errors";

const COOKIE = "loopit_sess";
const CSRF_COOKIE = "loopit_csrf";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const PROD = process.env.NODE_ENV === "production";

export type Session = {
  id: string;
  user: {
    id: string;
    handle: string;
    email: string | null;
    bio: string;
    avatar: string;
    isGuest: boolean;
  };
  csrfToken: string;
};

// ─────────────────── token utilities ───────────────────

function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

function sha256(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

function hashIp(ip: string): string {
  const secret = process.env.SESSION_SECRET ?? "dev";
  return createHash("sha256").update(`${ip}|${secret}`).digest("hex").slice(0, 16);
}

function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "0.0.0.0";
}

// ─────────────────── password hashing ───────────────────

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ─────────────────── session CRUD ───────────────────

type CreateSessionInput = {
  userId: string;
  userAgent?: string | null;
  ip?: string | null;
};

export async function createSession(input: CreateSessionInput) {
  const raw = randomToken(32);
  const csrf = randomToken(24);
  const session = await prisma.session.create({
    data: {
      userId: input.userId,
      tokenHash: sha256(raw),
      csrfToken: csrf,
      userAgent: input.userAgent?.slice(0, 255) ?? null,
      ipHash: input.ip ? hashIp(input.ip) : null,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    },
  });
  return { session, raw, csrf };
}

export async function revokeSession(tokenHash: string) {
  await prisma.session.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export function setSessionCookie(res: NextResponse, rawToken: string, csrf: string) {
  res.cookies.set(COOKIE, rawToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: PROD,
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
  // CSRF cookie is readable by JS so the client can echo it back in a header.
  res.cookies.set(CSRF_COOKIE, csrf, {
    httpOnly: false,
    sameSite: "lax",
    secure: PROD,
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
}

export function clearSessionCookie(res: NextResponse) {
  res.cookies.set(COOKIE, "", { maxAge: 0, path: "/" });
  res.cookies.set(CSRF_COOKIE, "", { maxAge: 0, path: "/" });
}

/** Load the session from cookies, returning null if absent/invalid/expired. */
export async function getSession(req: NextRequest): Promise<Session | null> {
  const raw = req.cookies.get(COOKIE)?.value;
  if (!raw) return null;
  const tokenHash = sha256(raw);
  const row = await prisma.session.findUnique({
    where: { tokenHash },
    include: { user: true },
  });
  if (!row || row.revokedAt || row.expiresAt < new Date()) return null;

  // Touch lastUsedAt infrequently (not every request) to avoid write amplification.
  if (Date.now() - row.lastUsedAt.getTime() > 10 * 60 * 1000) {
    prisma.session
      .update({ where: { id: row.id }, data: { lastUsedAt: new Date() } })
      .catch(() => {});
  }

  return {
    id: row.id,
    csrfToken: row.csrfToken,
    user: {
      id: row.user.id,
      handle: row.user.handle,
      email: row.user.email,
      bio: row.user.bio,
      avatar: row.user.avatar,
      isGuest: row.user.isGuest,
    },
  };
}

/**
 * Double-submit CSRF check. The client must include the `loopit_csrf` cookie
 * value in the `x-csrf-token` header on state-changing requests. This is
 * effective against cross-site POSTs because a third-party site cannot read
 * the cookie to populate the header.
 */
export function assertCsrf(req: NextRequest, session: Session) {
  if (!isStateChanging(req.method)) return;
  const header = req.headers.get("x-csrf-token");
  if (!header) throw new ForbiddenError("Missing CSRF token");
  const a = Buffer.from(header);
  const b = Buffer.from(session.csrfToken);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new ForbiddenError("Bad CSRF token");
  }
}

function isStateChanging(method: string): boolean {
  return method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE";
}

// ─────────────────── account helpers ───────────────────

function normalizeHandle(handle: string): string {
  const trimmed = handle.trim().replace(/^@+/, "@");
  return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
}

export async function createGuestUser() {
  const slug = randomToken(4).toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 6) || "guest";
  const handle = `@guest_${slug}`;
  const recoveryCode = randomToken(12);
  const user = await prisma.user.create({
    data: {
      handle,
      handleLower: handle.toLowerCase(),
      avatar: pickGuestAvatar(),
      bio: "Just looping.",
      isGuest: true,
      recoveryCode: sha256(recoveryCode),
    },
  });
  return { user, recoveryCode };
}

export async function createAccount(input: {
  handle: string;
  password: string;
  email?: string | null;
}) {
  const handle = normalizeHandle(input.handle);
  if (!/^@[a-z0-9._]{2,24}$/i.test(handle)) {
    throw new UnauthorizedError(
      "Handle must be 2-24 chars: letters, numbers, dot or underscore."
    );
  }
  const hash = await hashPassword(input.password);
  return prisma.user.create({
    data: {
      handle,
      handleLower: handle.toLowerCase(),
      email: input.email?.toLowerCase() ?? null,
      passwordHash: hash,
      bio: "",
      avatar: "🦄",
    },
  });
}

export { normalizeHandle, sha256, getClientIp };

function pickGuestAvatar() {
  const pool = ["🦄", "🫧", "🐦", "🎨", "⚙️", "🫠", "🌸", "🎧", "🌿", "👻", "🍓", "🐙"];
  return pool[Math.floor(Math.random() * pool.length)]!;
}
