# Ad Manager: proposed workflow and security

Status: proposed design, not yet implemented. Currently the plugin has one automatic article banner and Studio widgets store independent ad content.

## Central ad library

Add an Ads list, separate from plugin Settings. Administrators can create, edit, preview, pause and archive multiple ads. Each record has a name, type, language, status, sponsor and optional start/end dates. Image ads use the media picker, destination URL and alternative text.

Studio's Ad widget selects an existing ad by ID and controls placement, dimensions, spacing and responsive visibility. Automatic article placements also select an existing ad, before or after content. Editing the creative centrally updates all references. Widgets and global Settings no longer duplicate creative HTML or image fields.

Plugin Settings controls global behavior and automatic placement rules. The Ads list manages creatives. Preserve current banners/widget configuration through an explicit migration, without silently deleting existing content.

## Supported types

- **Image banner:** uploaded media, validated destination URL and sponsor/disclosure. Use sponsored/noopener/noreferrer attributes as appropriate.
- **Safe HTML (Advanced):** allowlisted tags, attributes and URL schemes; remove scripts, inline event handlers and executable URLs. Sanitize on write and enforce safety on render, including legacy/imported records.
- **Google AdSense:** accept validated publisher and slot IDs with supported layout options. Generate integration markup internally and load Google's official script once on eligible public pages. Do not accept arbitrary pasted JavaScript.

The current safe-HTML renderer cannot execute AdSense scripts. Correct labels suggesting otherwise until a dedicated integration is implemented and tested.

## Security boundary

Arbitrary scripts can read page/form content, redirect visitors and invoke authenticated actions. HttpOnly cookies do not prevent scripts from making authenticated requests. Administrator access does not protect against mistakenly pasting compromised code.

Keep unrestricted JavaScript disabled. Add further networks through dedicated reviewed adapters. AdSense configuration reduces accepted input, but Google's code still executes as a trusted third party.

- Only administrators manage ads, provider configuration and global placement rules; enforce authorization server-side on every query/mutation.
- No provider scripts in admin, Studio or editorial previews. Show placeholders there.
- Validate IDs, media, URL schemes, referenced ads, input sizes and schedule boundaries. Do not introduce an arbitrary server-side URL-fetch endpoint.
- Apply and test a Content Security Policy using the integration's required domains. Check current official provider documentation during implementation; avoid broad wildcard permissions.
- Implement applicable consent controls before loading provider code. Verify current requirements against official documentation and the site's audience/regions.
- Sandboxed iframes may isolate suitable HTML creatives, but do not replace sanitization or automatically support every ad network.

## Scheduling and placements

Store dates in UTC and display the site's timezone. Use start-inclusive/end-exclusive eligibility. Render only active, eligible ads in the selected language. Missing, expired or archived ads render nothing safely. Respect device visibility and reserve dimensions where appropriate to reduce layout shifts.

Make automatic placement rules visible and avoid accidental duplication between article banners and Studio widgets. Rotation, targeting and reporting are separate features; do not advertise them before implementation.

## Structure and rollout

Use dedicated ad records with validated type-specific fields; widgets store references. Follow ADMIN_CRUD_STANDARDS.md, bilingual dictionaries, database languages, an all-languages default, pagination, search, status filters and clear error/success states. Audit configuration changes. Preserve records when disabling the plugin and prefer archiving referenced ads to deletion.

Implementation order:

1. Image-ad CRUD and migration of existing configuration.
2. Shared widget selection and automatic article placements.
3. Status, language, scheduling and responsive eligibility.
4. Safe HTML editor and renderer.
5. Dedicated AdSense adapter, consent and CSP verification.

## Verification

Keep tests under tests/ and excluded from deployment. Cover unauthorized actions, malicious HTML/URLs, schedule boundaries, languages, reference updates, missing ads, duplicate scripts, consent and scripts remaining absent from admin/Studio. Use mocked requests and provider test facilities; automated checks must not generate real ad impressions or clicks. Verify mobile layout as well as desktop.
