import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    const isProd = process.env.NODE_ENV === "production";

    // CSP for the app shell. The drama iframe is same-origin, so we allow
    // `frame-src 'self'` and `frame-ancestors 'self'` (NOT 'none' — that
    // would block our own iframes). The drama HTML itself doesn't set CSP,
    // so it inherits nothing; its bundled scripts run within the iframe's
    // own document context.
    const appCsp = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline' ${isProd ? "" : "'unsafe-eval'"}`.trim(),
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "media-src 'self' blob: data:",
      "font-src 'self' data:",
      // `connect-src 'self'` covers fetch + EventSource; SSE + SW registration OK.
      "connect-src 'self'",
      "worker-src 'self'",
      "frame-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
    ].join("; ");

    return [
      // 1. Drama + user-uploaded bundles: permissive CSP so the bundled
      //    scripts + video work, but still same-origin-only embedding.
      {
        source: "/dramas/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      // 2. Static Next bundles: long immutable cache.
      {
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      // 3. App shell: strict CSP + other hardening headers.
      //    Negative lookahead excludes /dramas so the drama bundle isn't
      //    double-CSPed (Next `headers()` concatenates matching rules).
      {
        source: "/:path((?!dramas|_next/static).*)",
        headers: [
          { key: "Content-Security-Policy", value: appCsp },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          ...(isProd
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=63072000; includeSubDomains; preload",
                },
              ]
            : []),
        ],
      },
    ];
  },
};

export default nextConfig;
