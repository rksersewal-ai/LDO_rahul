import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Content Security Policy.
 *
 * Pragmatic policy for an internal LAN app: everything is same-origin and there
 * are no third-party CDNs/fonts/analytics. 'unsafe-inline' is required for
 * Next.js' inline bootstrap script and for Tailwind/inline styles (a nonce-based
 * strict CSP would require wiring nonces through the app and is deferred). All
 * other directives are locked down to 'self'.
 *
 * 'unsafe-eval' is included in development only: React dev mode uses eval() for
 * error callstack reconstruction and Turbopack uses it for source maps. It is
 * intentionally absent from production builds.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  isDev ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'" : "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "worker-src 'self' blob:",
  "frame-ancestors 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  // Effective only over HTTPS; harmless over plain HTTP on the LAN.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
];

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: [
    "pg",
    "bcryptjs",
    "bullmq",
    "ioredis",
    "sharp",
    "pdf-parse",
    "tesseract.js",
    "nodemailer",
  ],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
