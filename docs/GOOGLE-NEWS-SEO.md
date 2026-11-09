# Google News, SEO and mobile delivery

Implemented 9 November 2026. No database migration, package upgrade, Search Console submission or live deployment was performed.

## Metadata and indexing

Public homepages, CMS pages, article routes and category archives generate metadata from shared URL rules and the existing CMS settings. Article/page SEO titles, descriptions, social images, canonical overrides and noindex flags are used on the public site. Title templates are applied once. Canonical links respect the global canonical setting. Actual published translations supply language alternates.

Public articles expose server-rendered NewsArticle JSON-LD with the real headline, excerpt, author when known, publication date, modification date, language, image, canonical URL and publisher identity/logo. Script serialization escapes HTML delimiters. Missing author/image information is omitted rather than invented. Noindex content does not receive article schema.

The existing search-visibility setting and supported robots directives drive page metadata and robots.txt. The code does not automatically enable indexing. Drafts, password-protected posts, future publications and inactive-language posts are not publicly resolved as published articles.

The public site base URL prefers NEXT_PUBLIC_SITE_URL, then NEXT_PUBLIC_APP_URL, then the configured home/siteurl options. Set the final public HTTPS origin correctly for the deployment; do not leave an old WordPress host or localhost as the production origin.

Request-level React caching deduplicates selected metadata, language, theme, logo and article/page reads. This is not a persistent content cache; it does not require editors to clear a long-lived cache after publishing.

## Sitemaps

- `/sitemap.xml`: published, indexable homepages/pages/articles and localized categories. Translations use their actual language URLs. Available article images use resolved media paths. Page modification dates come from records; generation does not pretend that all content was updated at the current time.
- `/news-sitemap.xml`: only published, indexable posts from the preceding 48 hours, with original publication dates, real titles and language codes. With no eligible recent articles, it returns an empty valid feed; it never substitutes old articles.
- Oversized feeds return sitemap indexes. News parts live at `/news-sitemap/0.xml`, etc.; standard parts at `/sitemaps/0.xml`, etc. Splitting respects entry counts and a conservative serialized byte budget. Invalid/out-of-range parts return 404; generation errors return 503 rather than a success-looking fallback.
- Password protection, noindex, inactive languages and non-self canonical overrides are respected when selecting sitemap content. Global indexing disablement produces empty feeds.
- Sitemap cache headers allow short shared caching (60 seconds), with another 60 seconds of stale-while-revalidate. The admin dashboard describes sitemap eligibility, not confirmed Google indexing.

## Responsive media and upload safety

Registered image dimensions and uncropped derivatives are read from attachment metadata where available. Imported attachment paths resolve to the persistent uploads directory. Arbitrary external image URLs entered by editors retain their original host.

Editorial sliders, cards, archives and article images use a shared image component. Trusted local uploads use Next.js responsive image optimization; external images remain browser requests rather than arbitrary server-side fetches. The optimizer is restricted to the uploads namespace. Hero images reserve layout space and receive appropriate loading priority.

The native upload server and the Next.js uploads fallback share one validator for namespaces, paths, symlinks, MIME types and byte ranges. The fallback lets the internal image optimizer find files created after server startup, without requiring a redeploy or restart. No original image files were resized, overwritten or removed by optimization.

## Verification and measurements

Regression tests cover metadata overrides, publication eligibility, URL validation, schema injection escaping, multilingual output, responsive-media validation and sitemap splitting/XML. Browser checks inspect real English/Arabic article metadata/schema and document language, validate the sitemap responses, reject unsafe optimization sources, and optimize a temporary image created after startup. That source fixture is removed afterward; posts and settings are not edited.

Mobile Lighthouse comparisons use separate local production builds with the same existing homepage, article and archive content. These are simulated mobile lab runs, not real-user Core Web Vitals or guarantees for the deployed domain. They do not measure field INP. Image caches, database latency, local disk load and third-party fonts can affect results. Exact before/after results are recorded in the completion report; raw local reports are ignored under `.local/wordpress-migration/`.

Measured local results (Lighthouse 13.6.0, mobile defaults):

| Page | Transferred before | Transferred after | Simulated LCP before | Simulated LCP after | Performance score before → after |
| --- | ---: | ---: | ---: | ---: | ---: |
| Homepage | 25.66 MB | 1.20 MB | 71.8–83.5 s | 4.51 s | 44–50 → 56 |
| Article | 4.24 MB | 0.65 MB | 5.10 s | 4.42 s | 58 → 70 |
| Category archive | 23.96 MB | 0.83 MB | 32.00 s | 2.95 s | 60 → 81 |

The homepage baseline was repeated to expose variation rather than treating one cold run as definitive. Final CLS was approximately 0.0082 on the homepage and zero on the sampled article/archive. LCP remains above the recommended 2.5-second target in these local runs. Server response latency and client rendering still need validation on the actual hosting environment; no field Core Web Vitals pass is claimed.

The final verification included valid XML with 5,079 standard sitemap URLs and one eligible recent news article from the existing dataset. Those counts change with publication dates and CMS settings. Older imported articles remain eligible for the standard sitemap, not the 48-hour news feed. Test requests blocked post-view tracking, and the temporary upload fixture was removed.

## Production validation

1. Deploy with the correct public domain and existing persistent uploads volume. Retain the intended search-visibility setting; staging should use its own indexing policy.
2. Inspect both language versions of representative pages, their canonical/hreflang links, publication dates and schema. Test sample public article URLs with Google's Rich Results Test.
3. Verify the final domain in Search Console and submit `/sitemap.xml` and `/news-sitemap.xml`. Check URL Inspection, indexing, news traffic and real-user Core Web Vitals after sufficient data is available.
4. Confirm visible bylines, dates, publisher/ownership information and contact pages. Technical markup cannot replace editorial transparency or guarantee Google News inclusion.

References: [Google News sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap), [Article structured data](https://developers.google.com/search/docs/appearance/structured-data/article), [language alternates](https://developers.google.com/search/docs/specialty/international/localized-versions), [Core Web Vitals](https://web.dev/articles/vitals), [Google News discovery](https://support.google.com/news/publisher-center/answer/9606634?hl=en).
