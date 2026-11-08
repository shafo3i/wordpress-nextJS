# Theme Layout

Appearance → Theme Settings (`/admincp/theme-settings`) now contains layout controls rather than a second page builder. The block/widget catalogue and unused builder editor components were removed. Studio keeps its shared wireframe descriptors and remains the page builder.

The controls on this screen apply **only to the theme's default latest-posts homepage**:

- Full width, left sidebar, right sidebar or dual sidebars.
- Maximum sidebar width, 220–420 px, reduced responsively to protect content space.
- Space between columns, 0–80 px.
- Sticky sidebars on desktop.

Empty numeric fields inherit the template's existing dimensions. Left/right placement is physical in both English and Arabic; content retains its language direction. Empty widget areas remain hidden. Per-theme layout controls are separate from theme activation.

Studio pages manage their own structure and override neither these defaults nor other pages. The screen identifies when a static homepage is selected and links to its translated Studio pages. Post/category layouts, global container width, colours, typography, header and footer remain in the Customizer. Shared widget content remains under Widgets. Homepage selection remains in Settings.

Saving accepts only validated layout fields and patches the stored `homepage_settings_<theme>` record inside a transaction. Existing blocks, sections, widget configurations and unknown future fields are retained. The legacy layout key is mirrored; legacy blocks are not rewritten. Reset loads only layout defaults into the form and requires Save to persist them. No database migration or package update is needed.

Verification includes validation/authorization tests, a PostgreSQL temporary-table save/reset test and bilingual browser checks. Browser checks do not save live settings. The temporary-table test shadows `wp_options` on its own connection and confirms no live settings are changed.
