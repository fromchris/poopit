# Loopit — React Native (Expo) app

Native iOS + Android port of the Loopit prototype. Uses the same Next.js
backend (auth, feed, generation agent, SSE) — only the client is rewritten.

The web frontend in `app/` on `master` is **not touched**. This branch
adds a parallel native app under `mobile/` that hits the same API.

## Porting status

**Logic (reused as-is, platform-agnostic):**

- Zustand store shape, action names
- Type definitions (`Playable`, `Me`, `FeedTab`, …)
- Wire format to the backend

**Presentation (rewritten in RN — can't literally reuse DOM):**

| Area | Status | Notes |
|---|---|---|
| Root shell + bottom tabs | ✅ done | `App.tsx`, `BottomTabs.tsx` |
| Feed (snap-scroll + infinite) | ✅ done | `FeedScreen` uses `FlatList` pagingEnabled |
| FeedItem layout | ✅ done | Card + action row + caption row, mirrors web |
| Gradient backgrounds | ✅ done | `Gradient` via `react-native-svg` |
| Tailwind color tokens | ✅ done | Parsed out in `lib/theme.ts` |
| Icons | ✅ partial | Only ones Feed uses — extend as screens are ported |
| Auth flow | 🟡 todo | Store has `me` slot; signin/signup screens not yet ported |
| Comment / share / remix sheets | 🟡 todo | Bottom-sheet flows |
| Create screen | 🟡 todo | Needs native media picker |
| Inbox / notifications | 🟡 todo | SSE in RN needs a polyfill or polling |
| Search / profile | 🟡 todo | Placeholder screens render |
| Interactive drama / llm-bundle | 🟡 todo | Use `react-native-webview` for these two kinds |
| Playables | 🟡 1 of 12 | BubblePop ported natively; others show a stub label |

Everything marked ✅ works end-to-end against a running backend. The
🟡 items render a clean "Coming soon" placeholder so the shell is
usable while you port the rest.

## Setup

```bash
cd mobile
npm install

# Required — point at your deployed (or LAN) Loopit backend. Simulators
# can't reach localhost on the host machine; use your LAN IP.
export EXPO_PUBLIC_BACKEND_URL=http://192.168.1.20:3000
```

## Running

### Fastest: Expo Go on your phone

```bash
npm start
# Scan the QR with the Expo Go app (iOS App Store / Play Store).
```

Expo Go ships the JS, you see the UI instantly. Limits: no custom native
modules (but none of ours need that for the feed + BubblePop demo).

### iOS simulator (macOS + Xcode only)

```bash
npm run ios
# First run does `expo prebuild` behind the scenes, generates ios/,
# installs Pods, and boots the iPhone simulator.
```

### Android emulator (any OS with Android Studio + JDK 21)

```bash
npm run android
# First run generates android/, builds the debug APK, and boots the
# emulator.
```

### EAS build for store-ready binaries

```bash
npm install -g eas-cli
eas login
eas build -p ios       # → .ipa uploaded to App Store Connect
eas build -p android   # → .aab uploaded to Play Console
```

## Testing against a local backend

1. On the dev box: `cd ..` (repo root), `pnpm dev` to start Next.js on
   `:3000`. Bind it to `0.0.0.0` so the phone can reach it:
   ```bash
   pnpm dev -- -H 0.0.0.0
   ```
2. Find your LAN IP (`ipconfig` / `ifconfig`), e.g. `192.168.1.20`.
3. In `mobile/`, set `EXPO_PUBLIC_BACKEND_URL=http://192.168.1.20:3000`
   and run `npm start`.
4. Open Expo Go, scan the QR. The phone loads the feed from the live
   backend.

### HTTP in release builds

iOS App Transport Security and Android cleartext-traffic rules block
plain HTTP once you're not in dev mode. For a staging build pointing
at an HTTP backend, add per-host exceptions:

**iOS** — `app.json` → `ios.infoPlist.NSAppTransportSecurity.NSExceptionDomains`:

```json
"NSAppTransportSecurity": {
  "NSExceptionDomains": {
    "192.168.1.20": { "NSExceptionAllowsInsecureHTTPLoads": true }
  }
}
```

**Android** — `app.json` → `android.usesCleartextTraffic: true`, or add
a `network_security_config.xml` for per-host allow-listing.

For production, serve HTTPS.

## File layout

```
mobile/
├── App.tsx                        # root shell: boot() + tab switcher
├── index.js                       # registers App with Expo
├── app.json                       # Expo config (iOS/Android IDs, perms)
├── babel.config.js                # expo preset + reanimated plugin
├── tsconfig.json
└── src/
    ├── lib/
    │   ├── api.ts                 # fetch wrapper w/ CSRF capture + base URL
    │   ├── store.ts               # zustand: booted, me, feed, like, follow
    │   ├── types.ts               # mirror of app/lib/types.ts (don't drift)
    │   ├── format.ts              # formatCount
    │   └── theme.ts               # Tailwind → hex + gradient parsing
    ├── components/
    │   ├── BottomTabs.tsx         # floating tab bar (Feed/Search/Create/Inbox/Me)
    │   ├── FeedItem.tsx           # per-card: rounded playable + actions + caption
    │   ├── Gradient.tsx           # SVG linear gradient helper
    │   └── Icons.tsx              # react-native-svg icons
    ├── screens/
    │   ├── FeedScreen.tsx         # FlatList paging + top Following/For You tabs
    │   └── PlaceholderScreen.tsx  # used by every not-yet-ported screen
    └── playables/
        ├── index.tsx              # kind → native component
        ├── BubblePop.tsx          # tap bubbles; full native port
        └── Stub.tsx               # label for not-yet-ported kinds
```

## Extending

To port a new screen:

1. Create `src/screens/<Name>Screen.tsx` using `View` / `Text` /
   `Pressable` / `ScrollView`. Reuse `src/lib/store.ts` — add any new
   actions there and mirror them to the web's store shape so behavior
   stays aligned.
2. Wire it into `App.tsx`'s tab switch.
3. If it needs native-only capability (camera, share, push), add the
   Expo module (`expo-camera`, `expo-sharing`, `expo-notifications`)
   and update `app.json` plugins + permissions.

To port a new playable:

1. Create `src/playables/<Kind>.tsx` with a `{ active }` prop.
2. Register it in `src/playables/index.tsx`'s switch.
3. Keep the same gesture/animation semantics as the web version.
   Reanimated is already wired (babel plugin + dep).

## Why not just reuse the web components?

We can't. React Native has no DOM — `<div>` / `<span>` / `<button>` /
CSS / Tailwind / Framer Motion don't exist. Cross-platform UI libraries
that pretend otherwise (React Native Web, Tamagui, NativeWind) each
leak real-world quirks. The pragmatic path is: share the logic (store,
API client, types, i18n dicts), rewrite the render layer in RN
primitives. Cost is linear in # of screens.

## Versions

| Package | Version |
|---|---|
| Expo | ^52.0.0 (new architecture enabled) |
| React Native | 0.76.5 |
| React | 18.3.1 |
| react-native-reanimated | ~3.16.1 |
| react-native-svg | 15.8.0 |
| react-native-safe-area-context | 4.12.0 |
| zustand | ^5.0.12 |
