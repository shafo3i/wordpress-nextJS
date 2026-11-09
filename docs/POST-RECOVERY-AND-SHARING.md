# Article sharing, sessions and post recovery

## Sharing controls

Customizer > Single Article controls whether sharing is shown and which destinations appear: Facebook, X, WhatsApp, Telegram, LinkedIn, email, device sharing and copy link. These links share the current article automatically; no social account URL is required.

Customizer > Site Identity > Social Profiles manages the publication's own social profile URLs. Those are separate from article sharing.

## Sessions

The previous session expired after one hour but inherited a one-day renewal interval. Active use therefore could not renew it before expiry. The reported approximate ten-minute timeout was not independently reproduced.

Sessions now last eight hours and become eligible for renewal every five minutes. The admin checks the real session endpoint every four minutes while the tab is visible and recently active, and on focus. Inactive tabs do not continually extend sessions. Sensitive actions retain a thirty-minute freshness requirement.

If a session expires, the admin offers sign-in in another tab rather than automatically navigating away from unsaved work. An account change blocks uploading the previous account's recovery data. Existing expired sessions still require sign-in.

## Post recovery

Adding and editing posts saves changed form content in browser storage after approximately one second and backs up changed content to the server approximately every thirty seconds. The visual editor's buffered content is included. Recovery covers title, content, excerpt, image, categories, tags, language, status, slug, template, ordering and SEO fields.

Server copies are private to the authenticated account in the existing wp_usermeta table. Autosaving never changes the published post. On reopening a document, choose Restore or Keep current before saving. New posts have a draft identity in their editor URL; retain that URL to reopen the same draft.

Failed saves, lost connections and expired sessions retain browser recovery data. Browser storage availability is reported in the editor. Copies are eligible for recovery for seven days; this is not a guarantee of physical deletion at seven days. The server limits abandoned new-post copies to thirty per account.

Manual post writes use transactions and check the source modification token. Recovery writes check versions so an older tab cannot silently replace a newer server copy. If another tab saved the post, reload and explicitly reconcile the recoverable changes. Recovery requests are limited to 4 MiB, and content to two million characters.

Browser copies belong to the current browser and account. Server copies require authenticated access. This feature cannot recover text lost before recovery was implemented. It currently applies to Posts, not the separate Pages editor.

## Release and validation

No database migration or seed is required. Deploy the code and sign in again if necessary.

Tests live under tests/. Validation includes session renewal/expiry, sharing links, authorization and origin checks, failed-save recovery, Arabic and English editor recovery, account changes, and concurrent writes. PostgreSQL integration tests use connection-local temporary tables and do not modify real posts or accounts. Production webpack build, TypeScript and targeted lint checks passed.
