import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  base: { service: "loopit" },
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "ctx.password",
      "ctx.passwordHash",
      "ctx.tokenHash",
    ],
    censor: "[REDACTED]",
  },
});
