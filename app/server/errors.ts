/**
 * Typed API errors. Throw one of these from a route handler; `withHandler`
 * serializes them to a consistent JSON shape for the client.
 *
 *   { error: { code: string; message: string; details?: unknown } }
 */
export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export class BadRequestError extends ApiError {
  constructor(message = "Bad request", details?: unknown) {
    super(400, "bad_request", message, details);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = "Not signed in") {
    super(401, "unauthorized", message);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = "Forbidden") {
    super(403, "forbidden", message);
  }
}

export class NotFoundError extends ApiError {
  constructor(message = "Not found") {
    super(404, "not_found", message);
  }
}

export class ConflictError extends ApiError {
  constructor(message = "Conflict", details?: unknown) {
    super(409, "conflict", message, details);
  }
}

export class RateLimitError extends ApiError {
  constructor(retryAfterSec: number) {
    super(429, "rate_limited", "Too many requests", { retryAfterSec });
  }
}

export class ModerationError extends ApiError {
  constructor(reason: string) {
    super(422, "moderation", "Content rejected by moderation", { reason });
  }
}
