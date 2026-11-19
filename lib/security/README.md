# Nonce CSP diagnostics

The page policy is **report-only**, emitted by `proxy.ts`. It is not yet an enforcing CSP and does not replace sanitization or authorization.

For each page response the proxy generates a cryptographically random 128-bit nonce, replaces caller-supplied nonce/CSP request headers, and supplies matching internal request CSP plus `x-nonce` to Next's renderer. Only `Content-Security-Policy-Report-Only` is sent as the page CSP response header. `next.config.ts` retains the baseline security headers and the separate enforced upload sandbox; it must not append another global diagnostic policy.

Next applies the request nonce to its framework/stream scripts. The root layout passes it to next-themes and analytics; article JSON-LD reads it from the server request. Script policy includes `strict-dynamic` and excludes `unsafe-inline`. Development alone allows `unsafe-eval`; production does not. Editable CSS/style attributes still require `style-src 'unsafe-inline'` in this phase. Fonts are same-origin after the local-font change.

Nonce-bearing documents use `Cache-Control: private, no-store, max-age=0`; do not apply Cloudflare cache-everything rules to them. The root layout already uses request headers/cookies and dynamic rendering. This does not disable database/query caches. APIs, Next assets, uploads, fonts, feeds, sitemaps, social images and static files do not receive page nonces or this cache directive. Upload sandbox protections remain separate.

## Verification

- Unit tests check entropy, header spoof rejection, request/response matching, production/development differences, application script props, safe JSON-LD serialization and asset exclusions.
- Browser checks verify matching scripts run, unapproved inline scripts are reported without being blocked, same-origin previews work, and validation does not need eval.
- An isolated production Next.js 16.4.1 fixture using the real proxy and theme provider verified all framework/application script nonces and hydration on public, login, admin, Studio and preview paths without the CMS database. It is not a complete production CMS workflow test.

## Deployment review before enforcement

After deployment, load public pages, articles, authentication, admin and Studio; test navigation, editor saves, uploads, preview frames, videos, selected S3 media and enabled analytics. Review browser CSP messages and the bounded `/api/security/csp-report` diagnostics. Reports are untrusted diagnostics, not proof of an attack; log summaries deliberately omit script contents, URLs and tokens.

Keep report-only until remaining legitimate reports are explained. Do not suppress them by adding script `unsafe-inline` or production `unsafe-eval`. HSTS, Permissions-Policy, narrower external media origins, Trusted Types compatibility and CSP enforcement remain later steps. The current framework's security-upgrade warning also needs separate resolution.
