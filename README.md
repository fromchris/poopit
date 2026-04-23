# Loopit

A TikTok-style vertical feed for **AI-generated interactive playables** —
tiny one-screen experiences users can tap, draw, or play, remix with a
prompt, then share. Built as a full-stack prototype with a real database,
session auth, an LLM generation agent, SSE notifications, uploads, and a
PWA shell.

> This is a working prototype, not a product. It aims to demonstrate that
> the whole loop — feed → remix → generate → publish → feed — can run on
> a single Next.js process with Postgres behind it.

---

## Contents

- [What it does](#what-it-does)
- [Architecture](#architecture)
- [Project layout](#project-layout)
- [Quick start](#quick-start)
- [Environment variables](#environment-variables)
- [Scripts](#scripts)
- [Playables](#playables)
- [Generation agent](#generation-agent)
- [Tech stack](#tech-stack)
- [Packaging](#packaging)
- [Deploying](#deploying)
- [Mobile app (iOS / Android)](#mobile-app-ios--android)
- [Production readiness](#production-readiness)

---

## What it does

From the phone's perspective:

- **Feed**: vertical snap-scroll with Following / For You tabs, pull-to-refresh,
  keyboard nav (↑↓ / j/k, `l` to like), play event tracking, infinite scroll.
- **Create**: type a prompt ("a cat that purrs louder the more you pet it"),
  optionally attach photos/videos, and a background job runs GPT-5.4 to
  produce a one-screen HTML playable. The Inbox pings when it's ready.
- **Remix**: from any playable, hit the remix button and enter a prompt
  — the source playable's spec is seeded into the agent as context.
- **Interact**: likes, comments (nested replies, sheet UI), follows, shares
  (Web Share API + copy-link fallback), bookmarks, reports.
- **Profile**: your playables + liked + remixed tabs, follower/following
  lists, edit-profile sheet, settings (reduced motion, data saver, language).
- **Inbox**: likes / comments / follows / remixes / generation-ready pings,
  delivered live over SSE.
- **DMs**: 1:1 conversations with a streaming reply channel (for future
  AI-assistant remix flows — the wiring is there).
- **Search**: playables / creators / tags with trending chips.
- **PWA**: installable, service-worker cached shell, offline-ready for the
  already-visited feed.
- **Deep links**: `/p/<id>` for a standalone playable (shareable), plus URL
  params `?tab=`, `?q=`, `?u=`, `?p=` for all tabs — back/forward works.
- **i18n**: English + 简体中文 (`app/lib/i18n.ts`).

## Architecture

```
 ┌───────────────────────────────────────────────────────────┐
 │  Next.js 16 app (single process)                          │
 │                                                            │
 │  ┌────────────┐   ┌────────────┐   ┌────────────────────┐ │
 │  │ React feed │──▶│ REST + SSE │──▶│ Prisma (sqlite)    │ │
 │  │  (zustand) │   │ /api/*     │   │  (postgres in prod)│ │
 │  └────────────┘   └─────┬──────┘   └────────────────────┘ │
 │                         │                                  │
 │                         ▼                                  │
 │                 ┌────────────────┐     ┌────────────────┐ │
 │                 │ Background job │────▶│ fs/S3 storage  │ │
 │                 │ runner         │     │ (bundles, media)│ │
 │                 └───────┬────────┘     └────────────────┘ │
 │                         │                                  │
 │                         ▼                                  │
 │           ┌──────────────────────────┐                    │
 │           │  LLM agent               │                    │
 │           │  openai /v1/responses    │  streaming SSE      │
 │           │  GPT-5.4 · xhigh · cache │  → progress events  │
 │           └──────────────────────────┘                    │
 └───────────────────────────────────────────────────────────┘
```

**Frontend** is the `app/` directory: the snap-scroll Feed, a roster of 12
playables, overlays (comment sheet, share sheet, remix sheet, etc.), and
a zustand store that holds feed state and subscribes to the notification
SSE channel with deduplication. All UI is phone-native (notch-aware,
home-indicator-safe, rounded-card layout).

**Backend** lives in `app/api/` (route handlers) and `app/server/` (core):

- `server/db.ts` — Prisma client singleton.
- `server/auth.ts` — bcrypt sign-up/sign-in, hashed session tokens,
  httpOnly cookies, CSRF double-submit.
- `server/handler.ts` — shared route wrapper: Zod validation, error
  shaping, logging, rate-limit enforcement.
- `server/rateLimit.ts` — per-window token buckets, env-tuned.
- `server/moderation.ts` — local blocklist + `moderateAsync` hook for
  swapping in a remote moderation API.
- `server/storage.ts` — `fs` driver (default) and an `s3` stub ready for
  production (AWS SDK, R2, MinIO all compatible).
- `server/serialize.ts` — Prisma rows → wire format.

**Generation agent** is in `app/server/agent/`:

- `openaiClient.ts` — direct `fetch()` to `/v1/responses` (bypasses the
  SDK to support any OpenAI-compatible gateway).
- `generate.ts` — multi-turn tool loop
  (`pick_mechanic → set_theme → set_metadata → finalize`) for the
  pre-built playable mechanics.
- `codeMode.ts` — generates an arbitrary HTML bundle (sandboxed iframe).
- `codeAnalyze.ts` — Babel AST pass to forbid `eval`, network access,
  cookie access in generated code before it's saved.
- `runner.ts` — fire-and-forget background runner with persisted step
  progress. Publishes the playable + creates a `generation_ready`
  notification on success.

## Project layout

```
app/
├── api/                      # REST + SSE route handlers
│   ├── auth/                 # signup, signin, signout, guest, me
│   ├── feed/                 # for-you + following
│   ├── playables/            # CRUD, like, play, comments
│   ├── comments/             # delete, like
│   ├── users/                # profile, follow, followers
│   ├── conversations/        # DMs + streaming reply
│   ├── notifications/        # list + SSE stream
│   ├── generate/             # fire-and-forget job queue
│   ├── me/                   # my generations, my likes
│   ├── uploads/              # photo/video multipart
│   ├── files/                # local fs storage serving
│   ├── reports/              # abuse
│   ├── search/               # playables/creators/tags
│   └── health/               # uptime + db latency
├── components/               # React UI
│   ├── Feed.tsx              # snap-scroll container
│   ├── FeedItem.tsx          # one card: rounded playable + actions + caption
│   ├── BottomTabs.tsx        # floating pill nav
│   ├── CreateScreen.tsx      # prompt + media picker
│   ├── EditorScreen.tsx      # post-generation tweak + publish
│   ├── {Comment,Share,Remix,Author,Overflow,Report}Sheet.tsx
│   ├── InboxScreen.tsx       # live notifications
│   ├── ProfileScreen.tsx     # tabs + follower lists
│   ├── SearchScreen.tsx      # trending + results
│   ├── PendingJobs.tsx       # in-flight generations with progress
│   └── …
├── lib/
│   ├── store.ts              # zustand: feed, auth, sheets, notifications
│   ├── api.ts                # fetch wrapper with CSRF + JSON errors
│   ├── types.ts              # Playable, Comment, User, Notification …
│   ├── i18n.ts               # en / zh dictionaries, useT() hook
│   ├── url.ts                # parse + update URL query params
│   └── mockData.ts           # fallback demo data (useful offline)
├── playables/                # 12 playable renderers (see below)
├── p/[id]/                   # standalone shareable playable page
├── server/                   # server-only modules (see architecture)
├── layout.tsx                # root shell, PWA manifest link, locale lang
├── page.tsx                  # single-page shell, tab switcher
└── globals.css               # Tailwind + safe-area tokens
prisma/
├── schema.prisma             # User, Playable, Tag, Like, Comment, Follow,
│                             # Play, Notification, GenerationJob, Upload,
│                             # Conversation, Message, Report …
└── seed.ts                   # demo accounts + 30+ starter playables
public/
├── dramas/dqjtj-main.html    # self-contained 35 MB interactive drama
├── icons/                    # PWA icons
├── manifest.webmanifest
└── sw.js                     # service worker
Dockerfile, docker-compose.yml, .dockerignore
RUNBOOK.md                    # ops / deploy / CDN / S3 / HLS / monitoring
```

## Quick start

```bash
pnpm install
cp .env.example .env
pnpm db:push           # create SQLite schema at prisma/loopit.db
pnpm db:seed           # demo accounts + 30+ starter playables
pnpm dev               # http://localhost:3000
```

Demo login: `@you.loop` / `looploop`, or tap "Try as guest".

With `OPENAI_API_KEY` unset, `/api/generate` falls back to a deterministic
keyword synth — so the Create tab still works offline. Set the key to
enable real tool-use generation.

## Environment variables

From `.env.example`. Only the first two are required.

| Var | Purpose |
|---|---|
| `DATABASE_URL` | `file:./prisma/loopit.db` for dev; `postgresql://…` for prod. |
| `SESSION_SECRET` | 48-byte base64url. `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |
| `OPENAI_API_KEY` | Optional. Without it, the agent uses a deterministic local synth. |
| `OPENAI_MODEL` | Default `gpt-5.4`. |
| `OPENAI_BASE_URL` | Point at Azure / OpenRouter / a custom gateway. Omit for `api.openai.com`. |
| `OPENAI_REASONING_EFFORT` | `minimal` / `low` / `medium` / `high` / `xhigh`. |
| `STORAGE_DRIVER` | `fs` (default, writes to `./storage/`) or `s3`. |
| `S3_*` | Endpoint, region, bucket, keys, public base URL for S3 / R2. |
| `NODE_ENV`, `LOG_LEVEL`, `PORT` | Standard ops. |
| `RATE_LIMIT_*_PER_*` | Token-bucket tuning for generate / comment / like. |

## Scripts

```bash
pnpm dev           # Next.js dev server (Turbopack)
pnpm build         # prisma generate + next build
pnpm start         # production server
pnpm package       # build + bundle a deployable tarball (see below)

pnpm db:push       # push schema to DB without a migration (dev)
pnpm db:migrate    # generate + apply a migration (dev)
pnpm db:seed       # load demo data
pnpm db:studio     # Prisma Studio (GUI) on 5555

pnpm lint          # eslint
```

## Playables

Twelve playable kinds ship in `app/playables/`. Each is a React component
that accepts `{ active, src }`:

| Kind | File | Interaction |
|---|---|---|
| `bubble-pop` | `BubblePop.tsx` | Tap bubbles before they drift off-screen |
| `color-splat` | `ColorSplat.tsx` | Tap to splat, watch colors blend |
| `draw-pad` | `DrawPad.tsx` | Free-draw with finger, clear button |
| `emoji-stamp` | `EmojiStamp.tsx` | Rubber-stamp emoji anywhere |
| `fidget-spinner` | `FidgetSpinner.tsx` | Swipe to spin, friction decay |
| `match-pair` | `MatchPair.tsx` | Memory match grid |
| `rhythm-tap` | `RhythmTap.tsx` | Tap on the beat |
| `shake-mix` | `ShakeMix.tsx` | Device-motion or shake button to mix |
| `squishy-blob` | `SquishyBlob.tsx` | Drag to deform an SVG blob |
| `tap-rain` | `TapRain.tsx` | Tap to spawn falling drops |
| `interactive-drama` | `InteractiveDrama.tsx` | Iframe-hosts a full HTML drama with choices/QTEs |
| `llm-bundle` | `LlmBundle.tsx` | Iframe-hosts arbitrary HTML generated by the code-mode agent |

The feed's `FeedItem` renders the kind via `PlayableRenderer`. Only
`interactive-drama` and `llm-bundle` use sandboxed iframes; the rest are
pure React and compose with the feed's pointer events naturally.

## Generation agent

Two modes live side by side:

**Parameter mode** (`generate.ts`)
The model calls tools to fill out a `PlayableSpec`:
`pick_mechanic → set_theme → set_metadata → finalize`. The client renders
the spec with a pre-built component. **No model-written code ever
executes on the client.** This is the safer default.

**Code mode** (`codeMode.ts`)
The model returns a self-contained HTML bundle (one `<html>` doc, no
network, no storage). `codeAnalyze.ts` walks the AST and rejects:

- `eval`, `Function()` constructor
- `fetch`, `XMLHttpRequest`, `WebSocket`
- `document.cookie`, `localStorage`, `sessionStorage`
- `window.parent`, `top`, `postMessage` to escape the sandbox

Passing bundles are stored via `storage.put(...)` and served through
`/api/files/...` inside an iframe with
`sandbox="allow-scripts"` (no `allow-same-origin`).

Both modes stream progress over SSE. `runner.ts` persists each step
(`planning`, `drafting`, `rendering`, `publishing`) to the
`GenerationJob` table, so a refresh resumes the progress UI and the
Inbox ping fires once — deduplicated server-side by a per-run
`emitted` set and client-side by a `seenIds` set in the store.

Gateway quirks handled:

- `store: true` is ignored by some gateways, so we resend the full
  conversation history each turn instead of relying on
  `previous_response_id`.
- Local URLs are unreachable from hosted gateways — vision inputs get
  converted to base64 data URIs before being sent.
- Hard timeout 5 min, idle timeout 90 s. On failure, the request body
  is dumped to `storage/openai-last-fail.json` for replay.

## Tech stack

- **Framework**: Next.js 16.2 (App Router, Turbopack), React 19.2.
- **UI**: Tailwind CSS 4, Framer Motion 12, custom icons (no icon lib).
- **State**: Zustand 5 (client), Prisma 6 (server).
- **Database**: SQLite in dev, Postgres in prod (one-line swap in
  `prisma/schema.prisma`).
- **Auth**: bcryptjs, httpOnly cookies, CSRF double-submit, guest accounts
  with recovery codes.
- **Streaming**: native `ReadableStream` + SSE — no socket.io.
- **LLM**: OpenAI Responses API via `fetch` (SDK-free, gateway-friendly).
- **Code analysis**: @babel/parser + @babel/traverse.
- **Logs**: pino (JSON, stdout).
- **Validation**: Zod on every route.
- **PWA**: manifest + a handwritten service worker (no workbox).

## Packaging

Two ways to produce a deployable artifact:

### 1. Self-contained tarball (no Docker needed)

```bash
pnpm package
# → dist/loopit-<version>-<sha>.tar.gz   (~175 MB)
```

The script runs `next build` with `output: "standalone"`, then assembles:

```
dist/loopit-<version>-<sha>/
├── server.js            # minimal Node server (no need for `next start`)
├── node_modules/        # traced — only packages actually imported at runtime
├── .next/static/        # client JS/CSS chunks
├── public/              # static assets (PWA manifest, icons, drama bundle)
├── prisma/schema.prisma # for running migrations against the prod DB
├── package.json
├── .env.example
└── README.txt           # operator runbook for just this bundle
```

Deploy target only needs **Node 20+**. To run:

```bash
tar xzf loopit-<version>-<sha>.tar.gz
cd loopit-<version>-<sha>
cp .env.example .env    # edit DATABASE_URL, SESSION_SECRET, OPENAI_*
node server.js          # listens on $PORT (default 3000)
```

For first-time Postgres migrations the bundle ships the schema but not
the Prisma CLI — install it separately on the target or run migrations
from a dev checkout against the prod `DATABASE_URL`:

```bash
npm install --no-save prisma
DATABASE_URL=<prod-url> npx prisma migrate deploy
```

### 2. Docker image

```bash
docker build -t loopit:$(git rev-parse --short HEAD) .
docker push <your-registry>/loopit:latest
```

The `Dockerfile` is multi-stage and produces a small runtime image. See
[`docker-compose.yml`](./docker-compose.yml) for a one-node deploy.

## Deploying

```bash
docker compose up -d
docker compose exec app pnpm prisma migrate deploy
docker compose exec app pnpm db:seed
```

For the full story — Postgres switchover, CDN cache rules, S3 wiring,
HLS transcoding, reverse-proxy SSE tuning, monitoring, and the security
checklist — see [`RUNBOOK.md`](./RUNBOOK.md).

## Mobile app (iOS / Android)

Loopit is a full-stack app, so the mobile shells don't bundle the server
— they're WebView wrappers pointing at a deployed backend. Pick one of
three distribution paths:

### Option A — PWA "Add to Home Screen" (zero build)

The app ships a manifest + service worker, so Safari / Chrome on a
phone already offers "Add to Home Screen". Users get a standalone
icon, full-screen shell, offline cached UI. No app-store account
needed. Good enough for most use cases.

### Option B — Capacitor (iOS + Android store-ready)

Thin native shell that loads your backend URL in a WebView. Same code
for both platforms.

```bash
# 1. point at your deployed backend
export CAPACITOR_SERVER_URL=https://loopit.example.com

# 2. generate the native projects (one-time)
pnpm cap:add:ios         # requires macOS + Xcode
pnpm cap:add:android     # requires Android Studio + JDK 21

# 3. sync config + web fallback into each project
pnpm cap:sync

# 4. open in the native IDE to build / sign / upload
pnpm cap:open:ios        # → archive for App Store
pnpm cap:open:android    # → signed AAB for Play Store
```

The scaffolded `ios/` and `android/` projects are tracked in git once
generated; build outputs (`build/`, `Pods/`, `.gradle/`,
`DerivedData/`) are gitignored.

Swapping the backend URL later: change `CAPACITOR_SERVER_URL`, rerun
`pnpm cap:sync`, rebuild. The native binary itself doesn't need to
change.

### Option C — React Native / Expo shell

A functionally equivalent alternative to Capacitor, built on React
Native via Expo. Lives on the `react-native` branch under
[`mobile/`](https://github.com/fromchris/poopit/tree/react-native/mobile).

```bash
git checkout react-native
cd mobile
npm install
export EXPO_PUBLIC_BACKEND_URL=https://loopit.example.com
npm run ios        # or: npm run android
```

Same WebView pattern — native shell points at the deployed backend,
no frontend code duplicated. Pick this over Capacitor only if you
already have a React Native toolchain in the org, or you're
planning to add native screens alongside the WebView later.

### Option D — TWA (Android-only, smaller footprint)

If you only need Play Store presence, Google's
[bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap) wraps
the already-shipped PWA into a Trusted Web Activity AAB — no
WebView wrapper, uses Chrome under the hood. Much smaller binary
than Capacitor. Doesn't help with iOS.

### Caveats

- The WebView must be allowed to reach your backend over HTTPS.
  Plain HTTP requires `cleartext: true` in `capacitor.config.ts`
  (done automatically when `CAPACITOR_SERVER_URL` starts with
  `http://`) plus a network-security exception on Android.
- App Store review may push back on "webview wrapper" apps that
  don't use any native capability. Adding native plugins
  (`@capacitor/camera`, `@capacitor/push-notifications`,
  `@capacitor/share`) both improves the UX and reduces rejection
  risk.
- iOS builds require a Mac + a paid Apple Developer Program
  account ($99/yr). Android only needs Android Studio locally and
  a $25 one-time Play Console fee.

## Production readiness

**Short answer**: it runs, and the security surface is taken seriously,
but it is not yet a production deploy. Here's the honest state.

### What is production-grade already

- Auth: bcrypt (cost 12), httpOnly + `SameSite=Lax` session cookies,
  CSRF double-submit, SHA-256-hashed session tokens in DB, guest
  accounts with recovery codes.
- Zod validation on every route, Prisma parameterized queries, per-route
  rate limits (token-bucket, env-tuned).
- Structured JSON logs (pino) to stdout, `/api/health` liveness probe.
- Database schema + indexes + seed + migration scripts.
- Docker + compose shipping config.
- Agent safety: Babel AST allowlist on generated bundles
  (no `eval`, `fetch`, `document.cookie`, `localStorage`,
  `window.parent`), iframe `sandbox="allow-scripts"`, CSP-ready.
- SSE dedup (server `emitted` set + client `seenIds` set) so
  notifications don't double-fire across refreshes or reconnects.

### Blockers — fix before opening to the public

1. **SQLite → Postgres.** Change the datasource in
   `prisma/schema.prisma` and run `prisma migrate deploy`. Add the
   `pg_trgm` + trending + unread-notification indexes from RUNBOOK.
2. **Generate a real `SESSION_SECRET`.** The value in `.env.example`
   is a placeholder. Use
   `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`.
3. **S3 driver is a stub.** `app/server/storage.ts` has the interface
   but the S3 branch's `PutObjectCommand` isn't wired. Install
   `@aws-sdk/client-s3` and fill it in before switching from `fs`.
4. **i18n hydration mismatch.** `app/lib/i18n.ts` reads
   `navigator.language` during store init, so SSR renders `en` and
   the client hydrates `zh` on Chinese-locale browsers → React
   hydration error. Non-fatal in prod, but causes an extra render and
   blocks Next.js dev overlay. A `useEffect` that defers the locale
   read fixes it in ~5 lines.
5. **Single-node assumptions.** Rate-limits and SSE broadcast are
   in-process. Running >1 replica needs Redis (or equivalent) for
   both — otherwise buckets reset and notifications only reach the
   process that holds the stream.
6. **Reverse-proxy SSE tuning.** nginx (and most proxies) buffer by
   default and will break streaming. Disable buffering on
   `/api/notifications/stream` and `/api/generate` — config snippet
   in RUNBOOK.
7. **Real LLM credentials.** The agent is wired to a custom gateway
   for development. Point `OPENAI_BASE_URL` / `OPENAI_API_KEY` at
   your production endpoint and verify cost + rate limits.

### Recommended — before scaling or taking paid users

- **Background job queue.** The in-process runner is fine for one
  node and short jobs; swap to BullMQ / Redis once you have >1
  replica or generations that outlast a 5-minute timeout.
- **Real content moderation.** Current moderation is a local
  blocklist with a `moderateAsync` hook. Wire it to OpenAI
  moderation / Perspective / Sightengine.
- **HLS for the drama.** The shipped interactive drama
  (`public/dramas/dqjtj-main.html`) inlines its video as a 35 MB
  base64 data URI. RUNBOOK has the ffmpeg transcoding script and
  player refactor.
- **Image/video upload pipeline.** Uploads land on disk raw — add
  mime sniffing beyond the extension check, EXIF stripping, and a
  thumbnail / poster pipeline (sharp is already a dependency).
- **CDN in front.** Static assets already ship
  `Cache-Control: immutable`. Point Cloudflare / Fastly / Bunny at
  the origin with the rules in RUNBOOK.
- **Monitoring.** Ship pino stdout to Loki / Datadog / CloudWatch
  and alert on `/api/health` 5xx rate, p95 latency, generate-job
  failure rate.
- **Automated tests.** Coverage is currently zero. At minimum: an
  auth + feed happy-path test and a schema regression test per API
  route.
- **Email verification and 2FA.** Out of scope for the prototype;
  TOTP with `otplib` is straightforward once you turn on email
  sign-up.

### Known limitations / compromises

- i18n covers UI chrome; generated playable captions are whatever the
  model emits.
- Agent hard timeout is 5 minutes; hitting it fails the job rather
  than resuming.
- Content reports land in the DB but there's no triage UI.
- 12 built-in playable renderers are shipped; code-mode
  generations produce arbitrary HTML in a sandboxed iframe.

### Security checklist

| Item | Status |
|---|---|
| CSRF double-submit on state-changing routes | ✅ |
| httpOnly + SameSite session cookies, `Secure` in prod | ✅ |
| bcrypt password hashing (cost 12) | ✅ |
| SHA-256 session tokens in DB (no plaintext) | ✅ |
| Zod validation on every route | ✅ |
| Prisma parameterized queries (no raw SQL from user input) | ✅ |
| Per-route rate limits | ✅ (in-memory) |
| Content moderation hook | ✅ (local blocklist) |
| Sandboxed iframe for generated HTML | ✅ |
| AST allowlist on generated bundles | ✅ |
| Strict CSP on app, relaxed for `/dramas/*` | ✅ |
| Email verification | ❌ |
| 2FA (TOTP) | ❌ |
| WAF / DDoS protection | ❌ (CDN layer) |

---

This project is a demo / prototype. It is not affiliated with Loopit.
