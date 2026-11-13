# Site security headers and XSS work plan

Status: planned. Created 11 November 2026. This document records work to do; it does not claim that the site has passed a security audit.

## Why this is needed

PageSpeed flagged a weak script Content Security Policy (CSP), missing or insufficient HSTS, absent Cross-Origin-Opener-Policy (COOP), and no Trusted Types enforcement. These findings identify missing browser protections. They do not prove an exploitable XSS vulnerability, and passing the audit would not prove the site is secure.

The current staging URL uses HTTP. Browser traffic, including login requests, cannot be protected in transit until HTTPS is enabled. HSTS sent over HTTP is ignored. The permanent domain and HTTPS configuration are deployment work; the application audit and most header work can begin before that.

## Current repository findings

- `next.config.ts` and `proxy.ts` do not define a site-wide CSP, COOP, HSTS, or Trusted Types policy. Deployment proxy headers must also be checked on actual responses; the repository alone cannot establish what Coolify currently sends.
- Studio HTML/SVG uses an explicit sanitization policy in `lib/studio/sanitize.ts`. Existing coverage is recorded in `docs/STUDIO_SECURITY_REVIEW.md`; that review explicitly did not cover the whole site.
- Article HTML is transformed and sanitized by `lib/post-content-media.ts`. Public article and page templates render HTML. Trace every source and rendering route, including imported WordPress content, before treating that boundary as complete.
- `widgets/custom-html`, `widgets/ad-manager`, Studio advanced widgets, article/page templates, JSON-LD, and theme CSS contain HTML/style/script insertion points. Their trust boundaries and escaping need individual review. The proposed AdSense integration in `docs/AD-MANAGER-PLAN.md` must be included in CSP planning.
- TinyMCE, YouTube/Vimeo embeds, analytics, the customizer preview iframe, and Studio previews may need distinct CSP directives or route-specific handling. Do not broaden the entire site's policy merely to accommodate one integration.

## Implementation order

### 1. Audit input and output for XSS

Trace content from form/API/import through validation, persistence, preview, and public rendering. Cover posts, pages, comments, media metadata, Studio documents, theme/custom CSS, plugin settings, ads, translations, redirects, and imported legacy HTML. Review authorization for inputs that may contain markup. Require a context-appropriate output rule: React text escaping for text, safe URL validation for links/media, JSON-safe serialization for structured data, and maintained HTML sanitization for allowed rich content. Do not accept arbitrary script tags, event handlers, `javascript:` URLs, or executable SVG through CMS inputs. Apply safe rendering to legacy stored content as well as new saves.

Add focused tests under `tests/` for stored and reflected payloads, DOM mutation cases, URL scheme bypasses, unsafe embeds, and role boundaries. Test the actual render paths, not only helper functions. Review third-party dependencies separately from browser headers.

### 2. Add baseline response headers

Define headers in one documented layer (application or Coolify proxy) and verify the final browser response, including public pages, admin, auth, previews, and error pages. Start with `X-Content-Type-Options: nosniff`, a deliberate `Referrer-Policy`, an appropriate `Permissions-Policy`, and framing restrictions (`frame-ancestors` or `X-Frame-Options`). Preserve same-origin customizer/Studio previews. Add COOP after testing any `window.open`, OAuth, sharing, or payment popup flow; `same-origin` may sever opener references, while `same-origin-allow-popups` has different tradeoffs. COOP is not a replacement for CSRF protection or authorization.

### 3. Deploy CSP in report-only mode

Inventory sources used by every route: Next.js scripts, inline bootstrap, JSON-LD, styles, images, fonts, API connections, analytics, editor assets, video frames, and future ad providers. Add `Content-Security-Policy-Report-Only` to documents, collect violation reports, and test real public/admin workflows in desktop and mobile browsers. Keep reports bounded and avoid sending sensitive content in telemetry. Start with restrictive `object-src` and `base-uri` rules. Review `frame-src`, `connect-src`, `img-src`, `font-src`, `style-src`, `form-action`, and `frame-ancestors` explicitly.

For executable scripts, use a per-response nonce or approved hashes and evaluate `strict-dynamic`. Do not rely on a broad host allowlist or an effective `unsafe-inline`. Next.js nonce handling can require dynamic rendering and change caching behavior, so measure this before site-wide enforcement. Attach the same nonce to permitted application scripts and verify framework-generated scripts. Keep provider scripts out of admin and preview routes unless required. A report-only policy observes violations; it does not block attacks.

After violations are resolved and the intended policy is tested, replace report-only with enforced CSP. Verify that the browser actually blocks injected test scripts while legitimate editing, embeds, analytics, and navigation still work. Avoid a permanent broad fallback added only to make an audit pass.

### 4. Test Trusted Types before enforcing

Add `require-trusted-types-for 'script'` to a report-only policy on supported browsers. Inventory DOM sinks in application code and third-party editor libraries. Repair incompatible paths with narrowly scoped, reviewed Trusted Types policies and sanitization. Then enforce where compatible; document any route-specific exception. Do not create a default policy that simply returns raw HTML. Trusted Types covers certain DOM XSS sinks and does not replace server-side sanitization or CSP.

### 5. Finish HTTPS and HSTS on the permanent domain

Enable a valid TLS certificate in Coolify, redirect HTTP to HTTPS, update public app/auth URLs and cookies, and check mixed content. Send HSTS only on HTTPS responses. Begin with a short `max-age`; increase it after successful operation. Use `includeSubDomains` only after every relevant subdomain supports HTTPS. Consider preload only as a separate, deliberate decision because rollback is difficult. Do not assume the current HTTP staging site is safe for real credentials.

## Verification and acceptance

- Inspect response headers from the deployed origin, not just `next.config.ts`, on homepage, article, category, login, admin, Studio, preview, error page, and representative static/API responses. Confirm there are no conflicting duplicate CSP/COOP headers from Coolify and Next.js.
- Exercise English and Arabic pages, login/MFA/password recovery, post editing and preview, Studio, media upload, customizer, YouTube/Vimeo, search, and any active plugin/ad integration.
- Confirm expected rich content renders and hostile HTML/URL payloads do not execute in both stored and preview paths. Keep regression tests in `tests/`.
- With CSP enforced, verify both a blocked injected script and working authorized scripts. With Trusted Types enforced, verify editor and preview workflows in supporting browsers.
- Run PageSpeed/Lighthouse again on the HTTPS domain. Record remaining findings and distinguish unsupported-browser limitations from application failures.

## References

- [Chrome: effective CSP against XSS](https://developer.chrome.com/docs/lighthouse/best-practices/csp-xss/)
- [Chrome: Trusted Types audit](https://developer.chrome.com/docs/lighthouse/best-practices/trusted-types-xss/)
- [MDN: COOP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cross-Origin-Opener-Policy)
- [MDN: HSTS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Strict-Transport-Security)
- [Next.js: response headers](https://nextjs.org/docs/app/api-reference/config/next-config-js/headers)
