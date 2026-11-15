# CMS rate limiting with Valkey

Implemented 15 November 2026. Deployment connectivity still needs checking in Coolify.

## Agreed scope

- Better Auth configuration, authentication limits, session storage, Next.js startup, Docker server code and PostgreSQL schema remain unchanged.
- One Redis-compatible client (`redis`) and one helper (`lib/rate-limit.ts`) handle the new CMS quotas.
- Both existing Compose files pass `REDIS_URL` to the application at runtime. No new service is defined in Compose: Valkey is already managed separately in Coolify.

## How it works

The helper reuses a lazy connection per Node process. A single Lua operation checks the allowance, increments an accepted counter and sets its expiry atomically. Rejected attempts do not extend the window. Counter keys contain HMAC digests, not raw account IDs, addresses or tokens. It never reads authentication sessions or PostgreSQL.

Authenticated services pass the actor ID returned by their existing authorization check. Quotas are checked before transactions, filesystem writes, imports or decoding. Read-only page visits and saved storage-inventory reads are not charged. Cached video posters do not need Valkey; generating a missing poster uses a shared site budget.

| Operation | Allowance |
| --- | --- |
| CMS writes: posts, pages, taxonomy, comments, users/roles, settings, appearance, plugins/reviews, translations and redirects | 120 per actor/minute, shared across write services |
| Autosave | 30 per actor/minute |
| Media upload | 30 files and 256 rounded-up MiB per actor/minute |
| Logo normalization | 10 per actor/minute; normal media registration also applies |
| Studio content endpoint | 240 per actor/minute |
| Imports, exports, cleanup, replacement and language sync | 3 per operation/actor per 5 minutes |
| Manual upload/orphan scan | 2 per actor per 5 minutes |
| Thumbnail regeneration | 60 batches per actor/minute |
| SMTP test | 3 per actor/minute; its existing check remains enabled |
| Newsletter subscription attempts | 60 per site/hour; existing confirmation/cooldown checks remain enabled |
| Newsletter confirmation/unsubscribe | 30 per site/minute |
| Newsletter email | 5 per recipient/15 minutes and 200 per site/hour |
| Uncached local video-poster extraction | 20 per site/minute |

Limits are fixed windows. A nested call to another protected write service can consume another allowance. Existing Postgres quotas for views, credential administration and newsletter cooldowns are preserved; this pass does not migrate those older controls. Ordinary public search, feeds and redirect lookups are not newly throttled.

## Failure behavior

Missing or unreachable Valkey fails closed for the protected operation, with a bounded connection/command wait. Other read-only pages and Better Auth remain independent. API handlers return 429 with Retry-After, or 503 for an unavailable limiter, with no-store responses. Existing admin error notices show localized failures. Post save rejection does not clear recovery copies; browser tests cover English and Arabic editor content retention.

## Coolify and local development

1. Keep Valkey private on the application's destination network.
2. Set the generated internal URL as `REDIS_URL` on the existing application, runtime only. Do not use a NEXT_PUBLIC variable.
3. Deploy the image through the existing pipeline. No seed or database migration is required.
4. Verify a normal CMS save/upload, then inspect application logs for connection failures without publishing credentials.
5. For local development, provide a reachable local Valkey instance or an SSH tunnel and set the local `REDIS_URL`. The private Docker hostname from Coolify does not resolve from a Windows workstation. Missing configuration intentionally does not disable protection.

No live database changes, real email delivery, or deployed Valkey access were used during development. Unit tests use isolated clients and mocked side effects; the live Lua/concurrency behavior and actual Coolify network reachability still need deployment verification. Application quotas supplement, rather than replace, Cloudflare traffic protection.
