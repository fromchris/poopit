import type { CapacitorConfig } from "@capacitor/cli";

// The native iOS/Android shells are thin WebView wrappers — they load
// Loopit from a deployed backend URL. Set CAPACITOR_SERVER_URL before
// running `pnpm cap:sync`, e.g.:
//
//   CAPACITOR_SERVER_URL=https://loopit.example.com pnpm cap:sync
//
// If unset, the app falls back to the capacitor-webdir/ splash, which
// just tells the user the build is misconfigured.
const remoteUrl = process.env.CAPACITOR_SERVER_URL;

const config: CapacitorConfig = {
  appId: "app.loopit.client",
  appName: "Loopit",
  webDir: "capacitor-webdir",
  ...(remoteUrl
    ? {
        server: {
          url: remoteUrl,
          cleartext: remoteUrl.startsWith("http://"),
          androidScheme: remoteUrl.startsWith("https://") ? "https" : "http",
        },
      }
    : {}),
  ios: {
    contentInset: "never",
    limitsNavigationsToAppBoundDomains: false,
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
  },
};

export default config;
