# CMS Build Roadmap

## Product Direction

This project is a standalone publishing CMS with WordPress-like functionality and workflows. It uses its own product identity, database names, TypeScript APIs, plugin runtime, and PostgreSQL implementation.

The goal is to preserve the useful WordPress mental model without depending on WordPress code or WordPress plugins.

The admin experience should intentionally resemble the classic WordPress administration area:

- Left vertical navigation.
- Compact top admin bar.
- Dense, practical screens.
- Familiar labels such as Posts, Pages, Media, Comments, Appearance, Plugins, Users, Tools, and Settings.
- Simple panels, tables, forms, notices, tabs, and list actions.
- Minimal decoration and no marketing-style layouts.
- No glassmorphism, oversized hero sections, dashboard-card overload, or fashionable consumer-app styling.
- Desktop-first administration with usable responsive behavior on smaller screens.

## Authentication Model

The platform has two separate login experiences.

### Administrator Login

Login route:

```text
/cms-admin
```

Purpose:

- Platform administrators.
- CMS administrators.
- Plugin and theme management.
- Site configuration.
- User and role administration.
- Multisite/network administration.

Authorization:

- Requires an authenticated Better Auth session.
- Requires the Better Auth admin role or an equivalent platform administrator role.
- Protected by the shared `isAdmin()` server helper.
- Successful login should redirect to `/cms-admin/dashboard`.
- Unauthenticated administrator pages should redirect to `/cms-admin`.
- Authenticated non-admin users should receive an authorization error or be redirected away from the admin area.

### User Login

Route:

```text
/cms-login
```

Purpose:

- Public users.
- Authors, editors, contributors, subscribers, and other site members.
- User registration, sign-in, sign-out, password recovery, and account settings.

Authorization:

- Uses Better Auth’s normal user authentication flow.
- Does not grant access to `/cms-admin` unless the user also has the administrator role.
- Site-level permissions will be added for multisite roles.

### Authentication Rules

- Keep Better Auth as the source of truth for identity and global roles.
- Keep the server and client admin plugins enabled.
- Always pass request headers when resolving a server session.
- Use `isAuthenticated()` for normal protected server actions and route handlers.
- Use `isAdmin()` for administrator-only server actions and route handlers.
- Never rely only on client-side checks for authorization.
- Do not duplicate `auth.api.getSession()` checks throughout the application.

## Route Map

### Public Website

```text
/
/posts/[slug]
/pages/[slug]
/category/[slug]
/tag/[slug]
/author/[slug]
/search
/cms-login
```

### Administrator Area

```text
/cms-admin                         administrator login
/cms-admin/dashboard               protected dashboard
/cms-admin/posts
/cms-admin/posts/new
/cms-admin/posts/[id]/edit
/cms-admin/pages
/cms-admin/pages/new
/cms-admin/pages/[id]/edit
/cms-admin/media
/cms-admin/comments
/cms-admin/categories
/cms-admin/tags
/cms-admin/menus
/cms-admin/widgets
/cms-admin/themes
/cms-admin/plugins
/cms-admin/users
/cms-admin/settings
/cms-admin/tools
/cms-admin/sites
/cms-admin/network
```

The exact folder grouping may use Next.js route groups, but the public URLs should remain stable and recognizable.

## Architecture Rules

### Core Platform

Core behavior belongs in the platform:

- Users and authentication.
- Roles and permissions.
- Sites and multisite routing.
- Posts and pages.
- Media.
- Taxonomies.
- Comments.
- Menus.
- Themes.
- Settings.
- Plugin installation and lifecycle.
- Hooks and filters.
- Admin navigation.

### Optional Features

Optional features belong in plugins:

- SEO.
- Analytics.
- Contact forms.
- Newsletters.
- Ecommerce.
- Advertising.
- Backups.
- Caching.
- Import and export extensions.
- Additional editors and blocks.
- External integrations.

Core should expose extension points instead of hard-coding every optional feature.

## Implementation Phases

### Phase 1: Foundation and Conventions

- Define the product name and terminology.
- Keep all CMS tables under the project’s own naming convention.
- Document route, schema, API, and plugin naming rules.
- Establish server-only and client-safe module boundaries.
- Add a shared error and redirect strategy for authentication failures.
- Confirm the database migration workflow.
- Add a seed path for the first site, administrator, default theme, and default settings.

Exit criteria:

- A clean development database can be created from migrations.
- An administrator can be seeded.
- The application has stable public and administrator route conventions.

### Phase 2: Authentication and Authorization

- Build `/cms-admin/login` for administrators.
- Build `/cms-login` for normal users.
- Add sign-in, sign-up where appropriate, sign-out, and session display.
- Add administrator redirects and unauthorized responses.
- Add role-aware server guards.
- Add site-level role groundwork for multisite users.
- Add password recovery and email verification when the mail provider is configured.

Exit criteria:

- A normal user cannot open the administrator area.
- An administrator can sign in through the administrator login.
- Server actions and route handlers enforce authorization independently of the UI.

### Phase 3: Classic Administrator Shell

Build the classic admin frame before individual feature screens:

- Dark compact top admin bar.
- Fixed or collapsible left navigation.
- Current-section highlighting.
- Submenus for related screens.
- Main content area with page title and actions.
- Admin notices for success, warning, and error states.
- Breadcrumbs where useful.
- Screen options and contextual help later.
- Dense tables and practical forms.

Primary navigation:

```text
Dashboard
Posts
Media
Pages
Comments
Appearance
Plugins
Users
Tools
Settings
```

Do not begin with a modern dashboard redesign. The reference style is a working control panel, not a marketing page.

Exit criteria:

- `/cms-admin/dashboard` has a recognizable classic CMS shell.
- Navigation works on desktop and remains usable on mobile.
- All administrator pages share the same layout and authorization boundary.

### Phase 4: Dashboard

Implement the first dashboard using WordPress-like panels:

- At a Glance: post, page, comment, and site counts.
- Activity: recently published posts and recent comments.
- Quick Draft: title, content, and save draft action.
- Site information and current theme.
- Plugin notices and system notices.
- Optional plugin-provided dashboard widgets.

Dashboard data should come from server queries, not hard-coded counts.

Exit criteria:

- The dashboard shows real database data.
- Quick Draft creates a draft post for the current site.
- Plugins can register dashboard widgets later.

### Phase 5: Posts, Pages, and Taxonomies

Implement the core publishing workflow:

- Posts list with search, filters, pagination, and bulk actions.
- Add and edit post screens.
- Draft, pending, scheduled, published, private, and trashed states.
- Slug generation and editing.
- Excerpt and featured media support.
- Parent pages and page ordering.
- Categories and tags.
- Custom taxonomies through the plugin API.
- Revision history as a planned extension point.
- Autosave as a later reliability feature.

Exit criteria:

- Administrators can create, edit, publish, trash, and restore posts.
- Pages and taxonomies work per site.
- Public routes render published content only.

### Phase 6: Media Library

- Media upload endpoint.
- Media list and grid views.
- File metadata.
- Image dimensions and generated sizes.
- Attachment records connected to posts and pages.
- Media permissions.
- Storage adapter abstraction for local and object storage.
- Safe file validation and upload limits.

Exit criteria:

- An administrator can upload media and attach it to content.
- Invalid file types and oversized uploads are rejected.
- Public media URLs are safe and stable.

### Phase 7: Comments and Moderation

- Comment list with status filters.
- Pending, approved, spam, and trash states.
- Reply and threading support.
- Bulk moderation actions.
- Comment settings per site.
- Rate limiting and abuse controls.
- Comment metadata and moderation history through extensions.

Exit criteria:

- Comments can be moderated from the admin area.
- Public comments respect post comment settings.
- Guest and authenticated comments are handled safely.

### Phase 8: Themes and Appearance

- Theme registry and installation metadata.
- Per-site theme activation.
- Theme templates for posts, pages, archives, and comments.
- Theme settings.
- Widget areas and widget placement.
- Menus and menu locations.
- Customizer-like settings later.
- Theme asset loading with validation.

Exit criteria:

- A site can activate one installed theme.
- Different sites can activate different themes.
- Menus and widgets render through the active theme.

### Phase 9: Plugin Runtime

The plugin system should behave like WordPress conceptually, but use TypeScript APIs.

A plugin should contain:

```text
plugin-slug/
  manifest.ts
  index.ts
  migrations/
  admin/
  public/
  components/
```

Example manifest shape:

```ts
export default definePlugin({
  slug: "seo-tools",
  name: "SEO Tools",
  version: "1.0.0",
  requiresCms: ">=1.0.0",
  networkCapable: true,

  activate(context) {
    context.settings.register("seo-tools", {
      title: "SEO Tools",
    });

    context.hooks.addFilter("post.meta", addSeoMetadata);
    context.admin.addPage({
      slug: "seo-tools",
      title: "SEO Tools",
      capability: "manage_options",
      component: SeoSettingsPage,
    });
  },

  deactivate(context) {
    context.hooks.removeFilter("post.meta", addSeoMetadata);
  },
});
```

Plugin capabilities:

- Actions.
- Filters.
- Admin pages.
- Dashboard widgets.
- Settings pages.
- Custom post types.
- Custom taxonomies.
- Blocks and editor extensions.
- Widgets.
- API endpoints.
- Scheduled jobs.
- Database migrations.
- Activation and deactivation hooks.
- Uninstall cleanup.

Plugin states:

```text
installed
active
inactive
network-active
update-available
failed
```

Multisite activation should use a site-aware activation table so a plugin can be:

- Installed globally.
- Network activated.
- Activated for one site.
- Deactivated without uninstalling.

Do not execute arbitrary uploaded JavaScript or server code directly from an administrator upload without a trusted installation policy. The first plugin system should use reviewed, bundled TypeScript plugins. A marketplace or uploaded package system can be added later with signature verification and sandboxing decisions.

Exit criteria:

- A plugin can register settings and an admin page.
- A plugin can add a hook and filter.
- Activation and deactivation are recorded per the plugin lifecycle.
- Plugin failures do not silently corrupt the CMS.

### Phase 10: Users, Roles, and Site Membership

- User list and user editing.
- Better Auth global administrator role.
- Site membership table for multisite roles.
- Roles resembling WordPress: administrator, editor, author, contributor, subscriber.
- Capability checks instead of scattered role-string checks.
- User profile and password management.
- Invitations and site assignment.

Exit criteria:

- Global administrators can manage users.
- Site administrators cannot manage unrelated sites.
- Content actions are capability-checked on the server.

### Phase 11: Settings and Tools

Settings screens:

- General.
- Writing.
- Reading.
- Discussion.
- Media.
- Permalinks.
- Privacy.
- Network settings.

Tools:

- Import.
- Export.
- Site health.
- Database maintenance.
- Cache rebuild.
- Content repair and counter rebuild.
- Plugin and theme diagnostics.

### Phase 12: Multisite and Network Administration

- Network dashboard.
- Site list and site creation.
- Site-specific administrator assignment.
- Network plugins.
- Network themes.
- Network settings.
- Site switching for administrators.
- Domain and path routing.
- Site isolation tests for posts, options, menus, widgets, and themes.

Exit criteria:

- Two sites can coexist without content leakage.
- Site-specific settings and content remain isolated.
- Network-level resources remain globally manageable.

## Plugin Configuration Model

Plugins should not modify core tables directly unless their migration explicitly requires it. Prefer:

- `cms_options` for site settings.
- `cms_plugin_options` for namespaced plugin settings.
- `cms_postmeta`, `cms_termmeta`, `cms_commentmeta`, and `cms_usermeta` for extensible metadata.
- Dedicated plugin tables for relational or high-volume data.
- Registered hooks and capabilities for behavior.

Every plugin should declare:

- Unique slug.
- Display name.
- Version.
- CMS compatibility.
- Dependencies.
- Whether it supports network activation.
- Required capabilities.
- Activation and deactivation behavior.
- Uninstall behavior.

## Classic UI Rules

The administrator UI should be consistent with the supplied reference:

- Reuse existing components before creating new ones.
- Use shadcn/ui components for buttons, inputs, forms, dialogs, dropdowns, tabs, tables, alerts, and menus.
- Add missing shadcn components when needed instead of hand-building duplicate primitives.
- Keep each page compact and task-focused; avoid long decorative pages and unnecessary explanatory sections.
- Use a dark charcoal navigation rail.
- Use a blue primary action color and restrained gray page background.
- Keep typography compact and readable.
- Use plain bordered panels and tables.
- Do not use gradients.
- Do not use modern glassmorphism, blurred surfaces, floating decorative shapes, or oversized hero sections.
- Do not use rounded cards or rounded borders; use square or minimally rounded corners consistent with the classic reference.
- Do not introduce a modern dashboard aesthetic or consumer-app visual patterns.
- Use familiar list actions such as Edit, Quick Edit, Trash, Preview, and View.
- Keep actions close to the page title.
- Show counts, statuses, and filters clearly.
- Prefer text labels with small utility icons where appropriate.
- Avoid rounded promotional cards and decorative gradients.
- Avoid hiding essential controls inside unfamiliar interactions.
- Preserve whitespace for scanning, but do not make the interface spacious like a modern marketing dashboard.

## Engineering Rules

- Server-side authorization is mandatory.
- Every site-owned query must include the active `blog_id`.
- Every write must validate ownership and permissions.
- Use transactions for publishing, activation, deletion, and plugin lifecycle changes.
- Keep migrations checked in and review generated SQL before applying it.
- Do not silently change existing user data during schema changes.
- Add focused tests for authorization, site isolation, publishing, and plugin lifecycle.
- Keep WordPress-like behavior documented when the implementation intentionally differs.

## First Build Milestone

The first usable milestone should include:

1. Separate `/cms-admin/login` and `/cms-login` screens.
2. Protected classic admin shell.
3. Dashboard with real post, page, and comment counts.
4. Posts list.
5. Create and edit post flow.
6. Draft and publish behavior.
7. Public post rendering.
8. Categories and tags.
9. Plugin registry screen.
10. A sample internal plugin that adds one settings page and one dashboard widget.

This milestone gives the project the recognizable CMS loop: authenticate, enter the admin, create content, publish it, and extend the system through a plugin.
