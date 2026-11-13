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

### Module work completed before the site-wide rollout

- Categories: category-only mutation checks, bounded input validation, parent/translation validation, protected service boundaries and transactional language assignments.
- Users and roles: administrator-only access, safe query projections, validated role assignments, MFA preservation, self/administrator protection, transactional account changes, session/reset-token invalidation and safe password setup notifications. Details and validation limits are recorded in `docs/AUTH-FLOWS.md`.

- Settings: administrator-only page/query/action/service boundaries, validated settings and homepage references, consistent signup flags, protected SMTP credentials, verified SMTP TLS, bounded test-email delivery and escaped email output. See the Settings pass below.

These module fixes do not complete the site-wide audit. CSP, COOP, Trusted Types and the deployment header rollout below remain pending.

### Admin module queue (updated 11 November 2026)

Continue module by module, reviewing authorization, input validation, data exposure, mutation logic and XSS together. Follow HTML through saving, preview and public rendering in the same module pass; do not defer its XSS review until the header rollout. Permission changes alone do not constitute a full module audit.

Completed passes: Categories; Users and roles; Settings; Dashboard and Profile; Themes manager. Earlier authentication and Studio work provides existing coverage, but is not a claim that every integration has been audited.

Remaining queue, in recommended order:

1. Posts: authoring, autosave, revisions, preview, rich HTML, video embeds, imported content and public output.
2. Media: upload validation, file serving, filenames, metadata, edit/delete authorization and filesystem boundaries. Editor permissions have been corrected; the full audit remains pending.
3. Tags: validation, taxonomy boundaries, translations, mutation authorization and rendered output. Editor permissions have been corrected; the full audit remains pending.
4. Pages: rich HTML, preview, Studio integration and page-only mutation boundaries.
5. Comments: submitted HTML/text, moderation, bulk actions, links and public rendering.
6. Settings: completed repository pass on 13 November 2026; deployment checks remain below.
7. Appearance: Themes manager completed 13 November 2026. Customizer, Theme Settings, Menus and Widgets remain; include CSS/HTML, URLs, previews and theme/plugin insertion points.
8. Plugins: activation/configuration and each plugin's public/API paths; include ads/custom HTML, newsletter and fact-check output.
9. Languages and Translations: imports, synchronization, keys, stored text/HTML, permissions and public/email output.
10. Tools: imports/exports, redirects, search/replace, media utilities, SEO/feed tools and privileged diagnostics.
11. Dashboard and Profile: repository pass completed 13 November 2026; see the record below.
12. Studio integration recheck: review the existing Studio security report against current widgets, shared media, rendering and permissions; retain earlier regression coverage.

For each completed pass, record findings, fixes, tests and limitations here. After the module passes, perform the shared rendering/API review and the response-header, CSP, Trusted Types and HTTPS/HSTS rollout below. Verify deployed behavior separately from isolated tests.


### Settings security pass - 13 November 2026

Repository review covered the Settings page, queries/actions, shared option storage, logo selection/upload endpoint, analytics consumer, SEO/identity output, SMTP transport, credential encryption and active email rendering paths.

Fixed:
- Explicit administrator guards execute before action error handlers. Unauthorized Next.js redirects propagate rather than being converted into misleading save/upload errors. Bulk settings reads and the Settings save service also require an administrator. Other modules retain their generic option helpers and their own permission boundaries.
- Settings writes accept only the shared schema allowlist. URL, homepage identifier, SMTP host/name/user and locale inputs are bounded/validated. Serialized ciphertext cannot be supplied as an SMTP password. The selected homepage must reference a page; related settings write in one transaction. Signup flags are normalized together so an old disabled flag cannot silently contradict the registration checkbox.
- SMTP passwords remain absent from browser props; an empty password preserves the existing credential. Encryption no longer uses a hardcoded fallback or stores plaintext after a cryptographic failure. Malformed/tampered encrypted values fail closed. Legacy plaintext reads remain compatible; new saves encrypt. The existing key derivation order is retained to avoid silently changing the key for existing ciphertext.
- SMTP verifies certificates and requires STARTTLS when TLS is selected, or uses implicit TLS for SSL/port 465. Explicit administrator-selected None remains an unencrypted mode; it is not a secure production choice. Mail no longer fetches file/URL content, has connection/socket timeouts, uses a structured sender address, preserves password whitespace, strips subject line breaks and returns/logs generic transport failures without SMTP credential/error detail.
- Test mail requires a single valid recipient and bounded locale, with an atomic database quota of three attempts per administrator per minute across instances. Failed sends consume quota.
- The active localized email path escapes configured wording, site identity and substitutions; the legacy new-post notification path now escapes settings/article/author values and rejects unsafe URLs too. Raw header/footer scripts remain disabled and have no runtime consumer. Analytics requires a valid Google measurement identifier at save and render time. SEO uses structured Next metadata and validated URLs; identity/settings UI uses React text output.
- Logo uploads retain administrator checks, origin checks, bounded request streaming, raster decoding/re-encoding, pixel/byte limits and private no-store responses. Library selection requires an image attachment and validated ID; unsafe SVG/HTML uploads are rejected by existing regression coverage.

Validation: isolated Settings/action/service/SMTP/encryption/SEO/logo tests plus affected shared consumers; four browser fixture checks cover English/Arabic logo selection and independent site/email language wording. TypeScript and targeted lint pass. Tests do not send live mail or change deployed settings. PostgreSQL concurrency and actual SMTP certificate/delivery behaviour still need deployment verification.

Deployment notes:
- No migration or reseed is required; the test-email quota uses the existing rate_limit table.
- Preserve the existing encryption secret. Prefer a stable ENCRYPTION_KEY for deployment, but switching from an old fallback key requires deliberately re-entering/re-encrypting the SMTP password; do not rotate it blindly. Previously stored ciphertext cannot be repaired by changing code. Re-enter the password if its old key has already been lost.
- A mail server with an invalid certificate, or without the TLS mode selected, will now fail instead of bypassing certificate verification. Verify a real test email after deploying. Review any explicit None configuration before production.
- Full-suite checks also exposed separate admin-bar/editor expectations and a theme-layout action failure. Those modules remain in their own review queue; their failures are not counted as passing Settings checks.
- Site-wide CSP, COOP, Trusted Types, HTTPS/HSTS and the final cross-module/deployed review remain pending.

### Dashboard and Profile security pass - 13 November 2026

Dashboard:
- The page, dedicated server-only data query and quick-draft action require an administrator before reading private data or writing a draft. Editors retain their agreed Posts/Media/Tags/category-read permissions; Dashboard and Profile access has not been broadened.
- Quick drafts use a strict bounded schema. Client-supplied status/author fields are rejected; the server chooses draft status and the signed-in author. Textarea content is escaped before storing it as article HTML, so pasted tags/event handlers are literal text. Draft failures return localized generic errors rather than SQL/stack details. Titles and recent comment content render as React text.
- Stored post GUIDs are validated as HTTP(S) URLs without credentials before becoming external links. Queries select only displayed fields and bounded recent lists; health diagnostics remain administrator-only. The full Tools/health service audit remains in the Tools queue.
- Welcome-panel dismissal tolerates unavailable browser storage.

Profile:
- Profile props use explicit session fields and preserve the existing MFA state. Avatar URLs are validated before rendering; names and error notices render as text.
- A shared Better Auth before-hook validates self-update fields at the server boundary. Only bounded name/image fields are accepted; role, verification, banning and MFA fields cannot be supplied through self-update. The installed library still owns authentication, current-account targeting and credential verification.
- Password changes require the current password and a 12-128-character new password. Other-session revocation is forced server-side even if a client submits false. Profile/password/MFA mutation endpoints have database-backed rate limits through the existing auth configuration. Existing passwords are not changed or invalidated by this deployment.
- Password/edit/MFA dialogs unmount on close, clearing sensitive local state. MFA status is re-read from the server after successful enable/disable rather than guessed by toggling a boolean. Earlier actual-endpoint MFA/recovery tests remain part of verification.
- Sign-out errors are displayed rather than navigating away as if the request succeeded.
- Unsupported phone editing, browser-only notification saves and passkey setup are no longer offered as functioning controls. Personal notification settings/automatic sign-in alerts and passkeys are explicitly marked unavailable; implementing those features is separate work. No notification delivery or WebAuthn support is claimed.
- New and changed notices use both language templates; no schema migration or reseed is required.

Verification uses isolated Dashboard reads/writes, actual Better Auth in-memory profile/password/session/MFA endpoints and English/Arabic Profile browser fixtures. It does not mutate deployed accounts or send mail. Targeted TypeScript/lint checks pass. Live proxy/cookie/session expiry and PostgreSQL transaction behaviour still belong to deployment/final cross-module verification. Site-wide CSP/COOP/Trusted Types/HTTPS work remains pending.

### Themes manager security pass - 13 November 2026

- Page, server-only query, activation action and activation service require an administrator. Action authorization runs outside error handlers so Next redirects are not swallowed. Public active-theme reads remain available without exposing privileged mutation access.
- Activation accepts a bounded slug and only exact themes in the bundled registry; it cannot select a filesystem path, URL or uploaded code. Stylesheet, template and current-theme writes now share one transaction, preventing a failed activation from committing only part of the theme identity. Errors returned to the browser contain a localized generic key rather than database details.
- Search is bounded. Theme metadata renders as React text. The details view validates author links as credential-free HTTP(S) URLs, and repeated manifest tags are deduplicated. Activation errors remain visible instead of silently closing the modal.
- ZIP installation was a simulated success with no actual backend. That misleading form is replaced with a localized availability notice. Executable theme/package upload has not been introduced; themes continue to be registered in source and deployed with the application.
- Separate reported post-editor fix: selected tag pills normalize whitespace and deduplicate imported values; suggestions deduplicate repeated slugs. Adding/removing tags keeps the list unique, and input accepts Arabic as well as English commas. This fixes the duplicate Arabic React key warning without hiding console errors. It does not replace the pending full Tags-module audit.
- Verification: 12 isolated theme authorization/activation tests and two browser tests for theme metadata XSS/link rejection, failure messages, unavailable uploads and duplicate Arabic tags. TypeScript and targeted lint pass. Tests do not change the deployed active theme or migrate data.
- Customizer, Theme Settings, Widgets, Menus, shared CSS/HTML rendering and site-wide security headers remain in their own planned passes. CSP/COOP/Trusted Types/HSTS are not marked complete by this module review; deployed headers and final integration behaviour still need verification.

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

- [Nodemailer: SMTP transport security options](https://nodemailer.com/smtp)
