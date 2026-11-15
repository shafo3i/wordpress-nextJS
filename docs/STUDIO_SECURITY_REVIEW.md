# Studio security pass — 5 November 2026

## Integration recheck — 15 November 2026

The sections below this recheck are the historical 5 November report, including its dependency versions and audit counts. Those counts are not a current dependency audit.

### Findings and corrections

- Studio document mutations now enforce `verifyAdmin` directly and are server-only, including calls that bypass the Pages service wrappers. This preserves the agreed policy: editors manage Posts, Media and Tags, with read-only category selection; Studio/Pages remain administrator-only. The existing legacy guard name in route actions already resolves to the administrator guard.
- Authentication failures in the save action propagate through the framework rather than being swallowed as storage failures. Actual save errors still return the generic translated error key, without database details.
- Document saves and editor-mode changes acquire the same advisory transaction lock as Pages, then lock and check the target page. Trashed/non-page/missing targets are rejected before replacing metadata. Studio cannot unpublish the assigned homepage; ordinary drafts remain editable. Document, template and homepage changes still commit together, and failures preserve the earlier layout. The lock coordinates these mutations; it does not implement optimistic conflict detection between two editors.
- Studio feeds previously omitted the public site's password/future-date exclusions. Item and count queries now require an empty post password and a publication GMT date no later than the current time, in addition to published status and an active requested language. No private/draft preview exception was added.
- Studio's separate feed projection now reads the existing featured-video metadata and reuses the shared safe video resolver/thumbnail helper. Featured images retain priority; selected YouTube/uploaded videos supply the existing thumbnail path and play indicator. Unsafe video values do not become image URLs, and raw article HTML stays out of the feed response.
- Existing document validation, localized feed keys, sanitized widget configuration, final HTML/SVG sanitization, responsive visibility/design settings, undo/redo and serialized save behavior were rechecked. No new document format or layout defaults were introduced.

### Verification and limits

- Regression tests first reproduced the missing direct service guard, homepage/trash protection, public visibility predicates and selected-video mapping, then passed after the fixes. The focused run passed **236 tests across 17 files**, including Studio state/schema/sanitizer/rendering/API/action/service checks and the two tests that timed out under concurrent verification load.
- **27 isolated browser tests passed; 8 opt-in live-CMS tests were skipped.** These cover EN/AR editorial layouts, responsive typography, border/radius controls, hydration, featured video/image priority, legacy widget HTML, and hostile HTML/SVG payloads in a real browser DOM. They do not establish authenticated end-to-end behavior on the deployed site.
- Full unit suite: **998 passed, 19 opt-in tests skipped across 127 files**. The first run under concurrent browser/type-check load hit two existing 5-second timeouts; both tests passed in the focused rerun, and the standalone full rerun passed without changing their timeouts. TypeScript and scoped ESLint checks passed.
- No live database access/mutation, seed, migration, dependency upgrade, email, commit, push or deployment was performed. Existing Studio documents require no reseeding. Generated uploaded-video posters still require the previously configured deployed FFmpeg path; that infrastructure was not exercised here.
- Remaining work includes shared rate limiting, response headers/CSP/COOP/Trusted Types/HTTPS-HSTS, the final site-wide/deployed review, and separately scoped Studio durable autosave/revisions and concurrent-editor conflict detection. This repository pass is not a whole-site security clearance.

## Scope and changes

This pass covers the Studio document/save/render boundary and editor state. It is not a whole-site security clearance.

- Save requests use the existing server admin/editor guard; homepage assignment additionally requires an administrator.
- Studio markup uses [DOMPurify](https://github.com/cure53/DOMPurify) through [isomorphic-dompurify](https://github.com/kkomelin/isomorphic-dompurify), with separate explicit HTML/SVG allowlists. Sanitization runs before persistence and before preview/public rendering, including legacy documents. No executable custom-code mode is provided.
- Registered site widgets embedded in Studio receive sanitized HTML content/configuration and checked URL fields. Other site-widget entry points outside Studio have not been changed or audited by this pass.
- Placeholder translations are React text, not interpolated raw HTML. Legacy heading tag names are constrained to approved text tags. SVG paint URLs are limited to local fragments; embedded documents, animations, handlers, and external references are removed.
- Unknown widget names and type/payload mismatches are rejected by document validation. Duplicate element IDs and excessive layout sizes/depths are rejected. Rendering work for rating widgets is bounded.
- Page metadata and homepage assignment commit transactionally. Service failures return a generic browser error rather than internal database details. Submitted objects are not mutated by sanitization.
- Editor saves are serialized; server responses acknowledge only the captured snapshot. New edits remain dirty. History includes the page title/template, has a fixed size limit, and does not share duplicated tab configuration.

## Validation and its limits

Completed checks: **121 unit/service/render tests and 13 Chromium security tests passed**. TypeScript passes. Focused lint reports zero errors and four existing image-optimization warnings.

The unit/service tests exercise input validation, definition/factory consistency, sanitization, permissions, transaction contracts, undo/redo, duplication, dirty tracking, network failure, and in-flight edits. Transaction tests use mocks; they do not establish PostgreSQL rollback behavior or site isolation.

The browser suite bundles the actual sanitizer for the browser and inserts hostile payloads into an isolated headless Chromium DOM. It covers handlers, encoded JavaScript URLs, iframe/object injection, namespace/mutation cases, DOM-clobbering forms, SVG events/animation/external references, and legacy Custom HTML/ad inputs. It also verifies legitimate HTML/SVG output and that jsdom is excluded from the browser bundle. It does not drive an authenticated production CMS or establish that every possible XSS payload is blocked.

No production data migration, database-backed end-to-end test, independent penetration test, or complete deployment review has been performed. Autosave, durable revisions, and cross-browser/user optimistic locking are still outstanding.

## Dependency audit: unresolved whole-site findings

`pnpm audit --prod` after patching the sanitizer dependency chain reports **7 critical, 25 high, 33 moderate, and 8 low findings**. No remaining finding has an `isomorphic-dompurify` dependency path. The newly introduced chain's Undici dependency was updated to the compatible patched release (at least 7.30.1).

The existing framework/authentication versions remain unchanged in this Studio-scoped refactor. The audit identifies, among other findings:

| Existing package | Reported issue | Follow-up |
| --- | --- | --- |
| Next.js 16.2.6 | Multiple critical advisories, including [Windows server RCE](https://github.com/advisories/GHSA-p293-qw3h-jr36), [SVG image optimization RCE](https://github.com/advisories/GHSA-2464-fhr4-w9xw), and [typed-array cache RCE](https://github.com/advisories/GHSA-673q-mjm6-r5xr) | Upgrade to a version resolving every current advisory; review runtime/deployment applicability and test the application after migration. |
| Better Auth 1.7.3 | [OAuth state account-sign-in issue](https://github.com/advisories/GHSA-965c-763c-88jm) | Upgrade to the patched release and verify the configured authentication flows. Advisory impact depends on the enabled configuration. |
| proxy-addr, through shadcn's dependencies | [IPv4-mapped IPv6 trust-subnet issue](https://github.com/advisories/GHSA-jqcg-44mw-7w3h) | Patch the dependency and establish whether this CLI dependency is reachable in the deployed server. |

These are dependency-advisory matches, not proof of successful exploitation of this application. They still prevent claiming that the whole site is safe to deploy based on this pass.
