# Plugins and editorial reviews

## Deploying these changes

Run this **additive migration before deploying the newsletter changes**, against the database used by the deployed application:

```powershell
pnpm exec tsx scripts/migrate-newsletter.ts
```

The command uses DATABASE_URL from the local environment. Confirm that it targets the intended database; a direct PostgreSQL connection is preferred for maintenance. Do not run a seed or reset the database.

The migration creates cms_newsletter_subscribers and cms_newsletter_rate_limits. It imports the legacy newsletter_subscribers option, retains active/unsubscribed states and subscriber language, normalizes email addresses, and reports imported/skipped counts without printing addresses. The legacy option remains untouched as a recovery source. Rerunning does not overwrite existing subscribers. Invalid legacy records are skipped and reported; inspect them privately if the skipped count is nonzero.

Back up the database first. No emails are sent by the migration. Existing active subscribers are retained as active, not represented as newly verified. New signups require confirmation.

If the migration has not run, the subscriber screen displays an availability message and new signup returns an error. Public articles still render. No schema creation occurs in web requests. scripts/ remains excluded from Docker images; run this maintenance command from the source checkout or a separate maintenance environment.

## Plugin administration and rendering

- Plugin state, settings and subscriber mutations require the administrator role. Editors may review claims but cannot activate plugins, change global plugin configuration or access subscriber lists.
- Mutations validate slugs and configuration. Plugin state changes are transactional and serialized with a transaction-scoped PostgreSQL advisory lock, keeping installed/active lists consistent.
- Render hooks belong to an individual initialized runtime. Concurrent requests do not clear or reuse another request's hooks.
- Ad HTML is sanitized and interpolated values are escaped. Arbitrary scripts and inline event handlers are deliberately unsupported.
- The catalog describes bundled modules; invented ratings, review counts, installation counts and example external links are removed.
- Uninstall removes a module from the installed/active lists. Configuration, subscribers and editorial reviews are retained.

## Fact checking

Use Plugins > Fact Check > Settings. Search the most recent thirty matching titles or enter a post ID to find older articles directly. Administrators and editors can record:

- The specific claim being reviewed.
- Evidence URLs (HTTPS) and an explanation, including corrections.
- A status: unreviewed, in review, supported, misleading, false or insufficient evidence.
- Explicit approval of a completed verdict for publication.

Completed verdicts require a claim, explanation, at least one evidence URL and explicit approval. Reviewer identity and time come from the authenticated session and server. A version check prevents a stale reviewer overwriting another review. All previous reviews are retained in the post's _cms_fact_review_history metadata.

Only an approved verdict tied to the current article title, body and excerpt is displayed. Editing those fields invalidates the review automatically; the old verdict disappears until the revised article is reviewed and approved. Moving a review back into an unfinished state also hides the previous public verdict. Publishing a post never automatically approves it.

The old generic verified badge and fixed audit ID are gone. This implementation records an editorial assessment; it does not certify the truth of arbitrary articles or assert membership in a fact-checking organization. No paid APIs or AI services are called. Research assistance can be added later behind an explicit provider configuration, but approval should remain an editorial decision. Do not generate ClaimReview markup for ordinary news articles just because the plugin is enabled.

## Related posts

Choose category matches, tag matches or recent posts. Matching searches the full archive by taxonomy IDs, not the latest ten articles. Results exclude the current post, unpublished/future/password-protected content and other languages, then fill remaining slots with recent public posts in the same language. Count (1–12), list/grid layout, thumbnails and dates are connected to rendering.

## Newsletter

- Article footer signup uses a React form rather than inline scripts. Homepage and sidebar forms use the same implementation.
- Newsletter branding has separate versions for active languages. Blank wording falls back to the current language dictionary, without borrowing another language's authored wording.
- Welcome subjects/bodies are managed in Settings > Email & Notifications, including language versions. Legacy plugin-specific subject/message values remain stored but are no longer presented as functional settings.
- Signup validates input, limits request size, rejects cross-origin browser requests, includes a honeypot and uses a shared database rate limit (60 signup attempts/hour) and a ten-minute per-address resend cooldown.
- New subscribers are pending until they confirm a random, hashed, single-use token within 24 hours. The signup response does not disclose whether an address is already subscribed.
- Confirmation messages require working SMTP even if optional welcome emails are disabled. Welcome emails are sent only after confirmation, subject to both the plugin welcome switch and the global email notification switch.
- Confirmation and unsubscribe GET links display an explicit POST confirmation button. Mail scanners visiting a GET link do not change subscriptions.
- Unsubscribe links use a signature bound to the subscriber ID. Include the same unsubscribe mechanism in any future newsletter campaign sender. Changing BETTER_AUTH_SECRET invalidates previously signed unsubscribe links.
- Subscriber management uses paginated TanStack Query reads and mutations, with an all-languages default and optional language filtering. CSV export exports the current page, escapes CSV values and guards spreadsheet formula injection.
- This module collects subscriptions and sends confirmation/optional welcome messages. It does not yet send scheduled campaigns. Confirmation/welcome delivery is synchronous and has no durable retry queue. Delivery failures are logged without revealing subscription membership in the public response. Readers can request another confirmation after the resend cooldown; confirmation remains valid if a welcome email fails.

## Other modules

- Reading time and social share plugins are retired. They cannot be reactivated, and their old settings are preserved. Use Customizer > Single Article for their replacements. Reading time counts the source article rather than appended plugin panels.
- Ads support a safe banner before/after article content; they do not claim to support scheduling or arbitrary ad-network scripts.
- The article alert respects its pulse switch and the configured default language when generating links. It remains an article alert; the Studio ticker is the appropriate module for a moving news strip.
- Table of contents creates real heading anchors and respects the minimum-heading/collapse settings.
- Article audio uses a native accessible player for a shared audio URL. For article-specific recordings use the post editor's audio support. Automatic speech synthesis has been removed rather than presenting an unreliable control.

## Verification

Tests are under tests/ and excluded from Docker images. Browser fixtures intercept server actions and signup requests, so they do not send email or change live articles. Persistence integration tests are opt-in:

```powershell
$env:PLUGIN_INTEGRATION='1'
pnpm exec vitest run tests/unit/plugins/persistence.integration.test.ts --maxWorkers=1
```

They use connection-local temporary tables that shadow the real tables; no real posts, subscriber records or plugin options are changed. They cover concurrent subscription upserts, token expiry/replay, rate limits, review history/invalidation, consistent plugin state and full-archive related-post matching.
