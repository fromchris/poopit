import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { ApiError, BadRequestError, RateLimitError } from "./errors";
import { logger } from "./logger";
import { getSession, type Session } from "./auth";

export type RouteContext<P = Record<string, string>> = {
  req: NextRequest;
  params: P;
  session: Session | null;
  requireAuth: () => Session;
};

type Handler<P> = (ctx: RouteContext<P>) => Promise<Response> | Response;

/**
 * Wraps a Next.js route handler with:
 *  - session extraction
 *  - Zod/ApiError → JSON error response
 *  - request logging
 *
 * Usage (in app/api/whatever/route.ts):
 *   export const GET = withHandler(async ({ session }) => {
 *     return NextResponse.json({ you: session?.user.handle ?? null });
 *   });
 */
export function withHandler<P = Record<string, string>>(handler: Handler<P>) {
  return async (
    req: NextRequest,
    context: { params: Promise<P> } | { params: P }
  ): Promise<Response> => {
    const start = Date.now();
    const params = await Promise.resolve(
      (context as { params: Promise<P> }).params
    );
    try {
      const session = await getSession(req);
      const ctx: RouteContext<P> = {
        req,
        params,
        session,
        requireAuth: () => {
          if (!session) {
            throw new ApiError(401, "unauthorized", "Sign in required");
          }
          return session;
        },
      };
      const res = await handler(ctx);
      logger.debug(
        {
          method: req.method,
          path: new URL(req.url).pathname,
          status: res.status,
          durationMs: Date.now() - start,
          user: session?.user.handle,
        },
        "req"
      );
      return res;
    } catch (err) {
      return errorResponse(err, req, start);
    }
  };
}

function errorResponse(err: unknown, req: NextRequest, start: number): Response {
  if (err instanceof ZodError) {
    const details = err.issues.map((i) => ({ path: i.path.join("."), message: i.message }));
    return respond(new BadRequestError("Invalid input", details), req, start);
  }
  if (err instanceof ApiError) {
    return respond(err, req, start);
  }
  logger.error({ err, path: new URL(req.url).pathname }, "unhandled error");
  const api = new ApiError(500, "internal", "Internal server error");
  return respond(api, req, start);
}

function respond(err: ApiError, req: NextRequest, start: number): Response {
  const body = {
    error: { code: err.code, message: err.message, details: err.details },
  };
  const res = NextResponse.json(body, { status: err.status });
  if (err instanceof RateLimitError && err.details && typeof err.details === "object") {
    const d = err.details as { retryAfterSec?: number };
    if (d.retryAfterSec) res.headers.set("Retry-After", String(d.retryAfterSec));
  }
  logger.warn(
    {
      method: req.method,
      path: new URL(req.url).pathname,
      status: err.status,
      code: err.code,
      durationMs: Date.now() - start,
    },
    "req_error"
  );
  return res;
}

/** Parse a NextRequest body with a Zod schema, or throw BadRequestError. */
export async function parseJson<S extends z.ZodType>(
  req: NextRequest,
  schema: S
): Promise<z.infer<S>> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new BadRequestError("Invalid JSON body");
  }
  return schema.parse(raw);
}

/** Parse searchParams with a Zod schema. */
export function parseQuery<S extends z.ZodType>(req: NextRequest, schema: S): z.infer<S> {
  const obj = Object.fromEntries(new URL(req.url).searchParams.entries());
  return schema.parse(obj);
}
