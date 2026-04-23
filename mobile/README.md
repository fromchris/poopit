# Loopit — React Native (Expo) shell

Thin native iOS / Android wrapper around the Loopit web app. No frontend
code is duplicated — the WebView loads the deployed Next.js backend,
and the web's PWA manifest + service worker handle the "app" feel. All
features (feed, likes, comments, generation, SSE notifications, drama
iframes) work unchanged.

This is the React Native counterpart to the Capacitor setup on `master`.
Same idea, different native host.

## Why WebView instead of a component port

The constraint was: ship on iOS / Android **without changing the web
frontend's presentation or logic**. A true React-Native-component port
would require rewriting every `<div>` into `<View>`, every Tailwind
class into a `StyleSheet`, every `framer-motion` animation into
`reanimated` — that's a new frontend, not the same one.

A WebView shell keeps the web's rendering exactly as-is. When you ship
an update to the backend, the native app sees it on next launch — no
re-submission to the app store for JS-only changes.

## Setup

```bash
cd mobile
npm install

# Point at your deployed Loopit backend.
# For local development against a dev server, use your machine's LAN IP
# (the simulator can't reach localhost on its own).
export EXPO_PUBLIC_BACKEND_URL=https://loopit.example.com

# Metro dev server + QR code for Expo Go on a phone
npm start
```

## Building native binaries

Expo SDK 52 ships with the **new architecture** enabled (`newArchEnabled: true`
in `app.json`). The first build generates the `ios/` and `android/` projects
from scratch.

```bash
# iOS (requires macOS + Xcode + a paid Apple Developer account)
npm run ios

# Android (requires Android Studio + JDK 21)
npm run android
```

For store-ready builds, use EAS:

```bash
npm install -g eas-cli
eas login
eas build -p ios
eas build -p android
```

## Environment variables

Expo inlines anything prefixed `EXPO_PUBLIC_*` into the JS bundle at
build time. Keep secrets out — anything in here ships to users.

| Var | Purpose |
|---|---|
| `EXPO_PUBLIC_BACKEND_URL` | Required. HTTPS URL of the deployed Loopit backend. |

## Caveats

- HTTPS is effectively required. iOS ATS and Android cleartext-traffic
  rules both block plain HTTP in release builds. For local dev against
  `http://192.168.x.x:3000`, add ATS exceptions in `Info.plist` and
  set `android:usesCleartextTraffic="true"`.
- Apple review flags pure webview wrappers. Add one or two native
  capabilities (camera via `expo-camera`, push via `expo-notifications`,
  share via `expo-sharing`) before submitting.
- The WebView owns the back gesture on Android — a back-button handler
  (`App.tsx` → `BackHandler`) steps through WebView history before
  letting the OS exit.
- Cookies are shared with the web app's origin (`sharedCookiesEnabled`),
  so a logged-in web session carries into the native shell on the same
  device if the user ever opened Loopit in Safari / Chrome.
- Cross-origin features like SSE and the generation agent work the same
  as in any browser — if the backend has them, the WebView has them.

## Versions

| Package | Version | Note |
|---|---|---|
| Expo | 52.x | New architecture enabled |
| React Native | 0.76.x | Bundled with Expo 52 |
| React | 18.3.1 | Pinned by Expo |
| react-native-webview | 13.12.x | The actual WebView |
| react-native-safe-area-context | 4.12.x | Notch + home-indicator insets |
