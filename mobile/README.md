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
| Root shell + bottom tabs | ✅ | `App.tsx`, `BottomTabs.tsx` |
| Feed (snap-scroll + infinite) | ✅ | `FeedScreen` uses `FlatList` pagingEnabled |
| FeedItem layout | ✅ | Card + action row + caption row, mirrors web |
| Gradient backgrounds | ✅ | `Gradient` via `react-native-svg` |
| Tailwind color tokens | ✅ | Parsed out in `lib/theme.ts` |
| Icons | ✅ | 17 icons via `react-native-svg` |
| Auth flow | ✅ | `AuthScreen`: sign in / sign up / guest + recovery code alert |
| Bottom sheets | ✅ | Comment / Share / Remix / Overflow / Report |
| Create screen | ✅ | Prompt + media picker (`expo-image-picker`) + pending jobs poll |
| Inbox + notifications | ✅ | Read/unread list + SSE via `react-native-sse` |
| Search | ✅ | Debounced `/api/search` + trending chips + 2-col results |
| Profile | ✅ | Header + stats + Created/Liked/Remixed tabs + sign-out |
| Toast | ✅ | Bottom-center floating, fed from store |
| Playables (12 kinds) | ✅ | All 12 render real content; see table below |

All the above work end-to-end against a running backend.

### Playable coverage

| Kind | Status | Approach |
|---|---|---|
| bubble-pop | ✅ | Spawn + rise via `requestAnimationFrame` |
| tap-rain | ✅ | Pressable + fading drops |
| emoji-stamp | ✅ | Picker palette + tap-to-place |
| color-splat | ✅ | Random burst of colored circles |
| draw-pad | ✅ | Finger-draw via responder + `<Polyline>` |
| squishy-blob | ✅ | Drag + `Animated.spring` |
| fidget-spinner | ✅ | Flick → velocity decay loop |
| match-pair | ✅ | 4×4 emoji memory grid |
| rhythm-tap | ✅ | 600 ms beat, hit-window scoring |
| shake-mix | ✅ | Tap-to-swap recipes (real shake = `expo-sensors` later) |
| interactive-drama | ✅ | `react-native-webview` hosts the HTML bundle |
| llm-bundle | ✅ | Same WebView wrapper as drama |

## Known scope cuts

- **DMs** (`/api/conversations/*`): UI skipped — the web never wired
  it into a tab either.
- **Settings sheet / Edit-profile sheet / Followers list sheet**:
  reachable via Profile in the web; not yet carried over.
- **Real device-motion shake** for `shake-mix`: uses a tap button
  instead; `expo-sensors`' `Accelerometer` would be a small add.
- **Pull-to-refresh** on the feed: web has it; RN uses the snap
  paging model which makes PTR awkward on vertical feeds.
- **Jump-to-playable** from search/profile: `feedJumpToId` isn't
  wired in the store yet; search currently just pops back to feed.

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
├── App.tsx                        # root shell: boot() + tab switcher + auth modal
├── index.js                       # registers App with Expo
├── app.json                       # Expo config (iOS/Android IDs, perms)
├── babel.config.js                # expo preset + reanimated plugin
├── tsconfig.json
└── src/
    ├── lib/
    │   ├── api.ts                 # fetch wrapper w/ CSRF capture + base URL
    │   ├── store.ts               # zustand: auth, feed, comments, notifications, generate
    │   ├── types.ts               # mirror of app/lib/types.ts (don't drift)
    │   ├── format.ts              # formatCount
    │   ├── theme.ts               # Tailwind → hex + gradient parsing
    │   ├── uploads.ts             # expo-image-picker → /api/uploads multipart
    │   └── notifications.ts       # react-native-sse subscriber
    ├── components/
    │   ├── BottomTabs.tsx         # floating tab bar
    │   ├── BottomSheet.tsx        # plain Modal + slide animation
    │   ├── FeedItem.tsx           # per-card: rounded playable + actions + caption
    │   ├── Gradient.tsx           # SVG linear gradient helper
    │   ├── Icons.tsx              # 17 icons via react-native-svg
    │   └── Toast.tsx              # bottom-center toasts from store
    ├── screens/
    │   ├── FeedScreen.tsx         # paging FlatList + Following/For You + sheets
    │   ├── SearchScreen.tsx       # debounced /api/search + trending chips
    │   ├── CreateScreen.tsx       # prompt + media picker + pending jobs
    │   ├── InboxScreen.tsx        # notifications list (SSE-fed)
    │   ├── ProfileScreen.tsx      # header + stats + created/liked tabs
    │   ├── AuthScreen.tsx         # sign in / sign up / guest
    │   └── PlaceholderScreen.tsx  # unused now; kept for future stubs
    ├── sheets/
    │   ├── CommentSheet.tsx       # load + post + like + delete comments
    │   ├── ShareSheet.tsx         # copy link / native Share
    │   ├── RemixSheet.tsx         # prompt → /api/generate
    │   ├── OverflowSheet.tsx      # hide / report / delete (if owner)
    │   └── ReportSheet.tsx        # /api/reports
    └── playables/
        ├── index.tsx              # kind → component
        ├── BubblePop.tsx          # spawn + rise + pop
        ├── TapRain.tsx            # tap to spawn falling drops
        ├── EmojiStamp.tsx         # palette + tap-to-place
        ├── ColorSplat.tsx         # random colored splats
        ├── DrawPad.tsx            # responder + <Polyline>
        ├── SquishyBlob.tsx        # drag + spring
        ├── FidgetSpinner.tsx      # flick → velocity decay
        ├── MatchPair.tsx          # 4×4 memory grid
        ├── RhythmTap.tsx          # beat-timed tap
        ├── ShakeMix.tsx           # recipe carousel
        ├── InteractiveDrama.tsx   # react-native-webview host
        └── Stub.tsx               # kept for future kinds
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
