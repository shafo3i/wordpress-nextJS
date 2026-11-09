# Settings integration review

Reviewed 2026-11-09. No seed, schema migration, deployment, branding edits, or outgoing test emails were performed.

## Language and identity

- Admin interface labels follow the admin language preference. Settings now provides an explicit selector for that preference.
- Authentication screens follow an explicit active `lang`, the public callback language, the visitor language preference, then the default website language. The admin language cookie does not control public login screens.
- Public language navigation remembers the visitor preference. Unprefixed public content still belongs to the configured default language.
- Login, signup, recovery, verification, and MFA links preserve the selected UI language. The authentication API, sessions, and MFA checks remain in place.
- Settings > General > Site identity language edits the title and tagline for each active language.
- The default identity remains `blogname` / `blogdescription`, shared with Customizer. Other languages are stored in the existing options table as `site_identity_translations` JSON.
- An absent translated name inherits the default name. A missing translated tagline inherits the default; an explicitly empty translated tagline hides it.
- Resolved identity reaches public headers and footers, login branding, homepage/article/category metadata, article publisher schema, and News sitemap publication names. Customizer previews preserve translated identity when previewing a nondefault language.
- Names and descriptions are authored content: no automatic translation is performed. Enter the English identity before expecting an English publication name.

## Visible settings and their consumers

| Setting | Behavior / limitation |
| --- | --- |
| Site logo | Separate upload/removal flow; header and footer use the saved shared logo. |
| Site title and tagline | Language-aware identity as described above. Theme visibility controls still determine whether text is displayed. |
| Administration email | Used as a mail sender/notification fallback; changing it does not send a notification by itself. |
| Site URL | Updates both legacy `siteurl` and public `home` fallback. Deployment `NEXT_PUBLIC_SITE_URL` / `NEXT_PUBLIC_APP_URL` take precedence; the effective URL is shown in Settings. Auth base URL and trusted origins remain deployment configuration. |
| Registration | Enforced by the existing authentication creation hook. Signup links/forms also respect it. |
| Timezone | Passed to public date formatting, including headers, articles, archive cards, and editorial blocks. Stored publication timestamps and News sitemap UTC dates are unchanged. |
| Homepage mode/page | Existing homepage resolver switches between theme layout and the selected page/its language translation. |
| Search visibility | Metadata, robots, and sitemap eligibility use `blog_public`. |
| SEO title template/default description | Used by shared metadata builders. Explicit SEO descriptions remain shared content; untranslated site descriptions use the language-specific tagline. |
| Canonical setting | Shared article/home/category metadata honors the setting. |
| Robots directives | Supports `noindex`, `nofollow`, `max-image-preview`, `max-snippet`, and `max-video-preview`. Other directives are not implemented. |
| Share image/site name/Twitter card/handle/Facebook ID | Shared social metadata. A custom social site name is global; empty or default-matching names inherit localized identity. |
| Google/Bing verification | Now rendered as metadata verification tokens. Enter the token, not an entire meta element. External ownership verification is still performed in the provider's tools. |
| GA4 measurement ID | Now loads the supported analytics scripts on public pages after interactivity. It is excluded from admin and authentication routes. Invalid IDs are rejected. No ID means no scripts. |
| Custom header/footer scripts | **Unavailable and disabled.** Stored raw code is not executed. Arbitrary script injection has not been implemented. |
| SMTP fields | Existing SMTP sender reads saved configuration, then environment credentials when database credentials are incomplete. Save changes before sending the test email. |
| SMTP password | Stored value is omitted from browser props. Leaving the password blank preserves it; a newly entered value goes through existing encryption. |
| New-post admin notifications, recipient and template | **Unavailable and disabled.** The email helper exists, but publication events have no delivery trigger. Existing stored values are not represented as an active service. |
| Newsletter welcome toggle/template/footer | Existing newsletter subscription endpoint calls the welcome-email helper. Delivery requires that endpoint/integration and working SMTP. Template wording has per-language overrides in Settings; existing default-language wording is preserved. |
| Test email | Sends using saved SMTP settings and the selected email-template language. No live delivery test was performed in this review. |

Authentication email wording now follows the active language of the request or email link, with a site-default fallback. Newsletter wording can be edited per language in Settings; see `EMAIL-LANGUAGES.md`.

## Save safety and verification

- Settings actions retain their authorization check, validate supported keys and values centrally, and reject arbitrary option updates.
- Related option writes run in one database transaction. Successful saves revalidate the public layout and settings views.
- Tests live under `tests/`, which Docker excludes. Regression coverage includes locale selection, safe auth redirects, bilingual identity, metadata, timezone behavior, unsupported settings rejection, SMTP-secret omission, and transactional writes.
- `tests/verification/verify-auth-settings-browser.ts` checks both login routes and recovery language switching against a local server without signing in or changing saved settings.
- `tests/settings-identity.browser.spec.ts` checks translated identity editing using an isolated fixture; it does not write to the database.

After deployment, enter the translated identities, confirm the effective domain, and test outgoing mail with an address you control if you use email features.
