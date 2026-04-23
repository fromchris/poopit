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
- [Deploying](#deploying)
- [Known limitations](#known-limitations)

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

## Deploying

```bash
docker build -t loopit:$(git rev-parse --short HEAD) .
docker compose up -d
docker compose exec app pnpm prisma migrate deploy
docker compose exec app pnpm db:seed
```

For the full story — Postgres switchover, CDN cache rules, S3 wiring,
HLS transcoding, reverse-proxy SSE tuning, monitoring, and the security
checklist — see [`RUNBOOK.md`](./RUNBOOK.md).

## Known limitations

- Video in the shipped drama is inlined as a base64 data URI (35 MB).
  For production, split it out to HLS and serve from a CDN
  (script + player refactor in RUNBOOK).
- The fs storage driver is fine for a single node; the s3 driver
  interface is in place but the `PutObjectCommand` call is a stub —
  install `@aws-sdk/client-s3` and fill it in.
- Email verification and 2FA are out of scope for the prototype.
- The agent's hard timeout is 5 minutes; longer generations need a
  queue upgrade (BullMQ / Redis) before you can scale out.
- i18n covers UI chrome; generated playable captions are whatever the
  model emits.

---

This project is a demo / prototype. It is not affiliated with Loopit.
