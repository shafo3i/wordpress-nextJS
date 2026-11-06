# Post date filters and views

## Admin date filters

The Posts list offers the month/year values present in saved articles and a custom From/To range. Both endpoint dates are inclusive. An empty endpoint leaves that side unrestricted. Dates use UTC calendar boundaries, matching the stored WordPress post dates.

Changing the filter resets pagination and retains the current search, category, language, status and sorting. Invalid or reversed ranges cannot be submitted; invalid URL ranges return no posts rather than ignoring the filter.

## Views

The admin Posts list includes a Views column with numeric ascending/descending sorting. Imported `post_views_count` totals remain the baseline, with `_legatus_post_views_count` as the fallback when no valid canonical total exists. Duplicate metadata rows are not added together.

Public articles display a localized counter. Appearance → Customize → Single article contains the view-count visibility toggle. Hiding the display does not stop counting. Customizer previews never record views.

A visit is eligible after the article remains visible for 1.5 seconds. A signed, HttpOnly visitor cookie limits repeated views of the same article to one per 30 minutes. Admin/editor sessions, recognized automated user agents, prerendering and iframe previews are excluded. Only published posts can be counted. Concurrent updates use a transaction and post row lock to prevent lost increments.

These are approximate page views, not unique readers or a full analytics system. Bot detection is heuristic; clearing cookies or using another browser can produce another eligible view. A coarse request budget limits repeated requests. Client-supplied totals are never accepted, and the endpoint rejects cross-origin requests.

Tracking stores hashed visitor/request identifiers in the existing `rate_limit` table; it does not store raw IP addresses there. Opportunistic cleanup removes old tracking entries in bounded batches. No database reset or new migration is required. Deploy the updated application normally.

## Verification

- Unit tests cover date validation/boundaries, visitor signatures, bot detection and endpoint exclusions.
- `scripts/test-post-filters-views.ts` checks real PostgreSQL queries using session-local temporary tables, including imported baselines, reload suppression, expiry, sorting and unpublished exclusions.
- `scripts/verify-post-filters-views.ts` checks the local public article, admin filters/sorting and Customizer toggle. It uses an automated browser and confirms the sampled article's real total remains unchanged. It requires the ignored local migration credentials file and is not a production deployment step.
