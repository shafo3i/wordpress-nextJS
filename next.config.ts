import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  async headers() {
    // Diagnostic only: inline Next/analytics scripts will report until a separately
    // reviewed nonce/hash rollout. Do not copy this into the enforcing CSP header.
    const reportPolicy = [
      "default-src 'self'",
      "script-src 'self' https://www.googletagmanager.com",
      "script-src-attr 'none'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' https: data: blob:",
      "font-src 'self' data:",
      "media-src 'self' https: blob:",
      "connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com",
      "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://maps.google.com https://www.google.com https://w.soundcloud.com",
      "worker-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
      "report-uri /api/security/csp-report",
    ].join("; ")
    // Keep same-origin customizer previews and outgoing share/auth popups usable.
    // More restrictive route-specific policies are applied after this baseline.
    const baseline = { source: "/:path*", headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
      { key: "Content-Security-Policy-Report-Only", value: reportPolicy },
    ] }
    // Also protect files served directly by Next's public-file handler in dev
    // or on hosts that do not use deploy/server.mjs.
    return [baseline, { source: "/uploads/:path*", headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Content-Security-Policy", value: "default-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; sandbox" },
      { key: "Referrer-Policy", value: "no-referrer" },
    ] }]
  },
  images: { localPatterns: [{ pathname: "/uploads/**", search: "" }] },
  experimental: {
    serverActions: { bodySizeLimit: "34mb" },
  },
  // jsdom reads package assets relative to its own directory. Keep the server
  // sanitizer in Node's module loader so bundling cannot relocate those reads.
  serverExternalPackages: ["isomorphic-dompurify", "jsdom"],
  // Sharp 0.35 loads libvips via its native addon; automatic tracing can miss it.
  // Trace real pnpm store directories only. Hoisted @img paths are symlinks;
  // avoid explicitly including both aliases and their targets in deployment.
  outputFileTracingIncludes: {
    "/*": [
      "./public/fonts/og/NotoSansArabic.ttf",
      "./node_modules/.pnpm/@img+sharp-linux-x64@*/node_modules/@img/sharp-linux-x64/lib/**/*",
      "./node_modules/.pnpm/@img+sharp-libvips-linux-x64@*/node_modules/@img/sharp-libvips-linux-x64/lib/**/*",
      "./node_modules/.pnpm/@img+sharp-linuxmusl-x64@*/node_modules/@img/sharp-linuxmusl-x64/lib/**/*",
      "./node_modules/.pnpm/@img+sharp-libvips-linuxmusl-x64@*/node_modules/@img/sharp-libvips-linuxmusl-x64/lib/**/*",
    ],
  },
}

export default nextConfig
