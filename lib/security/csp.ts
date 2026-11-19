import { randomBytes } from "node:crypto"

/** A fresh, server-generated 128-bit nonce for each rendered page response. */
export function createCspNonce(): string {
  return randomBytes(16).toString("base64")
}

/** Diagnostic policy only. Do not change the response header to enforcement yet. */
export function buildReportOnlyCsp(nonce: string, development = false): string {
  if (!/^[A-Za-z0-9+/]{22}==$/.test(nonce))
    throw new TypeError("Invalid CSP nonce")
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://www.googletagmanager.com${development ? " 'unsafe-eval'" : ""}`,
    "script-src-attr 'none'",
    // Studio/Customizer styles and style attributes remain a separate hardening step.
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
}

export function isCspPagePath(pathname: string): boolean {
  return !(
    /^\/(?:api|_next|uploads|fonts|feed|sitemap)(?:\/|\.|$)/.test(pathname) ||
    /(?:^|\/)opengraph-image(?:\/|$)/.test(pathname) ||
    /\.(?:css|m?js|json|xml|txt|ico|svg|png|jpe?g|webp|avif|gif|woff2?|ttf|otf|pdf|mp4|webm|mp3|ogg)$/i.test(
      pathname
    )
  )
}
