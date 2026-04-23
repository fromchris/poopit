#!/usr/bin/env node
// Produce a self-contained deployable tarball under dist/.
// Assumes `output: "standalone"` in next.config.ts.

import { execSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(process.cwd());
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

let sha = "nogit";
try {
  sha = execSync("git rev-parse --short HEAD", { cwd: root })
    .toString()
    .trim();
} catch {}

const outName = `loopit-${pkg.version}-${sha}`;
const outDir = join(root, "dist", outName);
const tarPath = join(root, "dist", `${outName}.tar.gz`);

const log = (...a) => console.log("[package]", ...a);

log("building…");
execSync("pnpm build", { stdio: "inherit", cwd: root });

log("assembling standalone bundle at", outDir);
rmSync(outDir, { recursive: true, force: true });
rmSync(tarPath, { force: true });
mkdirSync(join(root, "dist"), { recursive: true });

// The standalone server and its traced node_modules.
cpSync(join(root, ".next", "standalone"), outDir, { recursive: true });

// Belt-and-braces: wipe any traced dev runtime data that slipped in.
// outputFileTracingExcludes covers the common case; this is a hard
// guarantee the recipient doesn't get our uploads / debug dumps.
rmSync(join(outDir, "storage"), { recursive: true, force: true });

// Next doesn't copy /public or /.next/static into the standalone dir —
// do it ourselves so the bundle is self-sufficient.
if (existsSync(join(root, "public"))) {
  cpSync(join(root, "public"), join(outDir, "public"), { recursive: true });
}
cpSync(join(root, ".next", "static"), join(outDir, ".next", "static"), {
  recursive: true,
});

// Ship the schema so migrations can be run against a prod DB with the
// Prisma CLI (installed separately).
if (existsSync(join(root, "prisma", "schema.prisma"))) {
  mkdirSync(join(outDir, "prisma"), { recursive: true });
  cpSync(
    join(root, "prisma", "schema.prisma"),
    join(outDir, "prisma", "schema.prisma"),
  );
}

// Ship .env.example so the operator knows what to fill.
if (existsSync(join(root, ".env.example"))) {
  cpSync(join(root, ".env.example"), join(outDir, ".env.example"));
}

const readme = `Loopit ${pkg.version} (${sha})

── Run ──────────────────────────────────────────────────────────────
1. cp .env.example .env
2. Edit .env:
     - DATABASE_URL (set to your Postgres URL for production)
     - SESSION_SECRET (48-byte base64url, required)
     - OPENAI_API_KEY / OPENAI_BASE_URL / OPENAI_MODEL (optional)
3. node server.js
     Listens on $PORT (default 3000). HOSTNAME=0.0.0.0 to expose.

── First-time migration (Postgres) ──────────────────────────────────
Requires the Prisma CLI, either from a dev checkout or:
   npm install --no-save prisma
Then:
   DATABASE_URL=<prod-url> npx prisma migrate deploy

── Notes ────────────────────────────────────────────────────────────
- Uploads and generated bundles land under ./storage/ by default.
  For multi-node or immutable deploys, set STORAGE_DRIVER=s3 and the
  S3_* env vars (see .env.example + RUNBOOK in the source repo).
- SSE endpoints (/api/notifications/stream, /api/generate) need
  proxy buffering disabled — see RUNBOOK.
`;
writeFileSync(join(outDir, "README.txt"), readme);

log("tar -czf", tarPath);
// tar is available on modern Windows 10+, macOS, and Linux. Run it
// with cwd inside dist/ and pass only the relative folder name so
// Windows drive letters (D:\…) aren't misread as remote hosts.
execSync(`tar -czf "${outName}.tar.gz" "${outName}"`, {
  stdio: "inherit",
  cwd: join(root, "dist"),
});

log("✓", tarPath);
