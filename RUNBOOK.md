# Loopit — Ops Runbook

Production-grade backend included; some infrastructure must be provisioned
externally (CDN, object storage, video transcoder, Postgres). This runbook
tells you what to stand up and where to wire it in.

## Quick start (local dev)

```bash
pnpm install
cp .env.example .env
pnpm db:push      # create SQLite schema
pnpm db:seed      # demo accounts + playables
pnpm dev          # http://localhost:3000
```

Demo login: `@you.loop` / `looploop`, or tap "Try as guest".

With `OPENAI_API_KEY` unset, `/api/generate` falls back to a deterministic
offline synth — so the Create flow still works in dev. Set the key to enable
real tool-use generation (default model: `gpt-5.4`, override via `OPENAI_MODEL`).
To point at Azure OpenAI or a compatible endpoint, set `OPENAI_BASE_URL`.

## Switching to Postgres (production)

1. Provision a Postgres 15+ (RDS / Neon / Supabase / self-hosted).
2. In `prisma/schema.prisma`, change the datasource:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
3. Set `DATABASE_URL="postgresql://user:pass@host:5432/loopit?schema=public"`.
4. `pnpm prisma migrate deploy` (in the same container that runs Next).

**Production indexes to add after migration** (not in the portable schema):

```sql
-- fuzzy / FTS search
create extension if not exists pg_trgm;
create index playable_title_trgm   on "Playable" using gin (title       gin_trgm_ops);
create index playable_desc_trgm    on "Playable" using gin (description gin_trgm_ops);
create index tag_name_trgm         on "Tag"      using gin (name        gin_trgm_ops);

-- trending by window
create index playable_trending on "Playable" (visibility, "trendingScore" desc, "createdAt" desc)
  where "deletedAt" is null;

-- notification unread lookup (covering)
create index notification_unread on "Notification" ("recipientId", read, "createdAt" desc)
  where read = false;
```

Swap `/api/search`'s `contains` query to `similarity(title, :q) > 0.2` for
real fuzzy match; `app/api/search/route.ts` has a comment marking the line.

## CDN

The app ships strong `Cache-Control: immutable` on `/_next/static/*` and
`/dramas/*`, so any CDN (Cloudflare, CloudFront, Bunny, Fastly) can front it
without config changes.

1. Point CDN at your origin (the Next.js container / load balancer).
2. Cache rules:
   - `/_next/static/*` → cache everything, respect `Cache-Control` (1 year).
   - `/dramas/*`       → cache everything, 1 year.
   - `/api/*`          → bypass cache (no caching).
   - `/`               → short TTL (60s) or bypass.
3. Turn on Brotli.
4. Optional: edge-route `/api/health` to origin for synthetic monitoring.

## Object storage + S3

Uploaded user assets (playable bundles, thumbnails, avatars) go through
`app/server/storage.ts`.

1. Create an S3 bucket (or R2 / MinIO) named `loopit-assets`.
2. Put a CDN in front of it, note the public base URL.
3. Set env:
   ```
   STORAGE_DRIVER=s3
   S3_ENDPOINT=https://s3.eu-west-1.amazonaws.com   # or r2 endpoint
   S3_REGION=eu-west-1
   S3_BUCKET=loopit-assets
   S3_ACCESS_KEY_ID=...
   S3_SECRET_ACCESS_KEY=...
   S3_PUBLIC_BASE_URL=https://cdn.loopit.example
   ```
4. Install `@aws-sdk/client-s3` and fill in `S3Storage` in
   `app/server/storage.ts`. The interface is ready; just plug in `PutObjectCommand`
   and construct the signed URL.

## Video pipeline (HLS)

The drama bundled in `public/dramas/dqjtj-main.html` embeds its video as a
base64 data URI (35 MB). That's fine for the demo; for production, split
video out and serve HLS.

### Transcoding script

```bash
# inputs/<id>.mp4 → outputs/<id>/{240,480,720,1080}p + master.m3u8
ID="dqjtj-ep1"
IN="inputs/$ID.mp4"
OUT="outputs/$ID"
mkdir -p "$OUT"

for R in 240:400k 480:800k 720:2000k 1080:4500k; do
  HEIGHT=${R%:*}
  BITRATE=${R#*:}
  ffmpeg -y -i "$IN" \
    -vf "scale=-2:$HEIGHT" \
    -c:v libx264 -b:v $BITRATE -preset veryfast -profile:v main \
    -c:a aac -b:a 128k -ac 2 \
    -hls_time 4 -hls_playlist_type vod \
    -hls_segment_filename "$OUT/${HEIGHT}p_%03d.ts" \
    "$OUT/${HEIGHT}p.m3u8"
done

# master playlist
cat > "$OUT/master.m3u8" <<EOF
#EXTM3U
#EXT-X-STREAM-INF:BANDWIDTH=450000,RESOLUTION=426x240
240p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=900000,RESOLUTION=854x480
480p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2100000,RESOLUTION=1280x720
720p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=4600000,RESOLUTION=1920x1080
1080p.m3u8
EOF

# first-frame thumbnail (used as feed-grid cover)
ffmpeg -y -i "$IN" -ss 00:00:02 -vframes 1 -q:v 3 "$OUT/poster.jpg"

# upload to your bucket + cdn
aws s3 cp "$OUT/" "s3://loopit-assets/dramas/$ID/" --recursive \
  --cache-control "public, max-age=31536000, immutable"
```

### Rewiring the player

Refactor `public/dramas/dqjtj-main.html` (or produce a new shell) so that:
- The `<video>` loads from `https://cdn.loopit.example/dramas/$ID/master.m3u8`.
- The branching logic (choices, hotspots, QTEs) stays in the HTML.
- Use `hls.js` for non-Safari browsers — Safari plays HLS natively.

The feed already passes `bundleUrl` through unchanged, so switching the shell
is a drop-in on the server (update `Playable.bundleUrl`).

## LLM generation

- Requires `OPENAI_API_KEY`. Without it, the agent falls back to a
  deterministic keyword synth — useful in dev, but not the real experience.
- Model is `OPENAI_MODEL` (default `gpt-5.4`). For Azure or compatible APIs,
  set `OPENAI_BASE_URL` (e.g. `https://YOUR-RESOURCE.openai.azure.com/openai/deployments/DEPLOYMENT`).
- Rate limit is `RATE_LIMIT_GENERATE_PER_HOUR` (default 10). Tune per your
  token budget — the parameter-mode agent makes ~3-4 tool calls per run.
- `app/server/agent/generate.ts` uses **tool use**: the model calls
  `pick_mechanic → set_theme → set_metadata → finalize`. The result is a
  typed `PlayableSpec` rendered by the pre-built React components — so no
  model-written code ever executes on the client.
- To enable **code-mode** (generate arbitrary JS/HTML), add a new tool
  `generate_bundle` that returns HTML, save it via `storage.put(...)`, and
  link via `Playable.bundleUrl`. Before serving:
  - run a static check (no `eval`, no external `fetch`, no `document.cookie`),
  - sandbox the iframe (`sandbox="allow-scripts"` — no allow-same-origin),
  - keep the CSP on `/dramas/*` strict.

## Deploy cheat-sheet

```bash
# 1. build image
docker build -t loopit:$(git rev-parse --short HEAD) .

# 2. push to registry
docker tag loopit:$(git rev-parse --short HEAD) registry.example/loopit:latest
docker push registry.example/loopit:latest

# 3. run (compose)
docker compose up -d

# 4. first-time migration (postgres only)
docker compose exec app pnpm prisma migrate deploy
docker compose exec app pnpm db:seed    # once
```

### Behind a reverse proxy

SSE works out of the box but many proxies buffer by default — disable that:

```nginx
location /api/notifications/stream {
    proxy_pass http://app:3000;
    proxy_http_version 1.1;
    proxy_set_header Connection "";
    proxy_buffering off;
    proxy_cache off;
    proxy_read_timeout 3600s;
}
location /api/generate {
    proxy_pass http://app:3000;
    proxy_http_version 1.1;
    proxy_set_header Connection "";
    proxy_buffering off;
}
```

## Monitoring

- `/api/health` returns `{status, db, latencyMs, uptimeSec}`.
- pino JSON logs → stdout. Ship to Loki / Datadog / CloudWatch.
- Recommended alerts:
  - health check 5xx > 1/min for 5 min
  - p95 request duration > 1s for 10 min
  - `generate` job failure rate > 10% for 1 hr

## Security checklist

- [x] CSRF: double-submit cookie, enforced on all state-changing routes
- [x] Session cookie: httpOnly, SameSite=Lax, Secure in prod
- [x] CSP: strict on app, relaxed only for `/dramas/*` (sandboxed iframe)
- [x] Rate limits on auth, publish, comment, follow, like, generate
- [x] Content moderation (local blocklist + `moderateAsync` hook for remote)
- [x] Input validation with Zod on every route
- [x] Prisma parameterization — no raw SQL from user input
- [x] Hashed session tokens in DB (sha256, never plaintext)
- [x] Bcrypt password hashing (cost 12)
- [ ] Email verification — add when you turn on email sign-up
- [ ] 2FA — out of scope for prototype, TOTP is straightforward with `otplib`
- [ ] WAF / DDoS protection — handled at CDN layer (Cloudflare, etc.)
