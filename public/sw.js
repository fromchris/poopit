// Loopit service worker — minimal app-shell + static-asset cache.
// Strategy:
//   - Static assets (/_next/static/*, /icons/*, manifest):  cache-first
//   - Drama bundles (/dramas/*):                            cache-first (immutable)
//   - API (/api/*):                                         network-only
//   - Document (HTML):                                      network-first with offline fallback
//
// Bump VERSION whenever caches should be invalidated.

const VERSION = "loopit-v1";
const STATIC_CACHE = `${VERSION}-static`;
const RUNTIME_CACHE = `${VERSION}-runtime`;

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      cache.addAll(["/", "/manifest.webmanifest", "/icons/icon-192.svg", "/icons/icon-512.svg"]).catch(() => {})
    )
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names.filter((n) => !n.startsWith(VERSION)).map((n) => caches.delete(n))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Don't touch cross-origin.
  if (url.origin !== self.location.origin) return;

  // Never cache APIs (dynamic) or SSE streams.
  if (url.pathname.startsWith("/api/")) return;

  const isStatic =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/manifest.webmanifest" ||
    url.pathname.startsWith("/dramas/") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".jpg") ||
    url.pathname.endsWith(".woff2");

  if (isStatic) {
    event.respondWith(cacheFirst(req, STATIC_CACHE));
    return;
  }

  // HTML navigation: network-first → cache fallback.
  if (req.destination === "document" || req.headers.get("accept")?.includes("text/html")) {
    event.respondWith(networkFirst(req, RUNTIME_CACHE));
    return;
  }
});

async function cacheFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  if (cached) return cached;
  try {
    const res = await fetch(req);
    if (res.ok && res.status !== 206) cache.put(req, res.clone()).catch(() => {});
    return res;
  } catch {
    if (cached) return cached;
    throw new Error("offline + uncached");
  }
}

async function networkFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone()).catch(() => {});
    return res;
  } catch {
    const cached = await cache.match(req);
    if (cached) return cached;
    return new Response(
      "<!DOCTYPE html><title>Loopit · offline</title><body style=\"font-family:system-ui;background:#000;color:#fff;display:grid;place-items:center;height:100vh;text-align:center\"><div><h1>You're offline</h1><p style=\"opacity:.6\">Last-cached feed items stay available when you reconnect.</p></div></body>",
      { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 503 }
    );
  }
}
