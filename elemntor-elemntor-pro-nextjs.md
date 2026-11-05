1. Why "Theme Settings as Homepage" vs. Page-Level Builder + Reading Settings?

Right now in news, the visual builder is coupled to Theme Settings:

Storage: getHomepageSettings saves a single JSON blob into wpOptions under homepage_settings_${themeSlug}.
Routing: app/page.tsx and app/[lang]/page.tsx hardcode rendering NewsHome, while regular pages (postType = 'page') only render static HTML (dangerouslySetInnerHTML={{ __html: page.content }}) via PageTemplate.
Why your intuition is right (Why the Page-Level + Reading Settings approach is superior)

In WordPress + Elementor, Theme Settings (Customizer / Site Settings) only control global design tokens (colors, typography, header/footer layout), never a single fixed homepage layout. Coupling the builder only to homepage_settings_${themeSlug} has major limitations:

Only 1 Builder Page Exists: You cannot build a custom "Politics Hub", "Video Portal", "About Us", or "Special Coverage" landing page using the section/column/widget builder.
No Drafts, Revisions, or A/B Homepage Swapping: Because homepage_settings_${themeSlug} is a single row in wp_options, you cannot design a "New Homepage v2" or "Election Day Homepage" as a draft page, preview it at /election-home, and flip a switch to make it the live homepage.
No Native Multilingual Page Mapping: Your Pages module (app/(admin)/admincp/pages/page.tsx) already supports per-language pages and translation linking via getPostTranslations, whereas homepage_settings_${themeSlug} shares one structure across all languages.
2. Reverse-Engineering Elementor & Elementor Pro (And Mapping to news)

By inspecting elementor and elementor-pro in your workspace, here is how they actually work under the hood and how each mechanism translates directly to your Next.js news architecture:

Layer 1: Every Page is a Document Stored in wp_posts + wp_postmeta

In Elementor\Core\Base\Document, Elementor does not create custom database tables for pages. Instead, it attaches 4 metadata keys in wp_postmeta to any wp_posts row (post, page, or elementor_library):

Elementor Meta Key (document.php)	Purpose in Elementor	Equivalent in news (cms-posts.ts)
_elementor_edit_mode	'builder' vs '' (tells WP whether to use the visual builder or standard HTML editor)	wp_postmeta key _builder_enabled ('1' or '0')
_elementor_data	JSON array of recursive Section -> Column/Container -> Widget tree	wp_postmeta key _builder_data storing PageBuilderSection[] from homepage-types.ts
_elementor_page_settings	Page-level layout (full_width, canvas, right_sidebar, padding, custom CSS)	wp_postmeta key _page_layout (full_width, right_sidebar, left_sidebar, dual_sidebar)
_elementor_template_type	Document type (wp-page, wp-post, header, footer, single, archive)	wp_postmeta key _template_type
Plain HTML Fallback for SEO & Search: When Elementor saves a document in DB::save_plain_text, it walks the JSON tree, renders plain HTML without builder chrome, and writes it to wp_posts.post_content. That way, full-text search and RSS feeds still work even if the page is built with the visual builder.
Layer 2: The Recursive Element Tree (Container/Section → Column → Widget)

In Document::get_sections_elements_data, every node in _elementor_data has an id, elType (section | column | widget), settings, and child elements:

json
[
  {
    "id": "sec_1",
    "elType": "section",
    "settings": { "layout": "boxed", "background": "default" },
    "elements": [
      {
        "id": "col_1",
        "elType": "column",
        "settings": { "_column_size": 66 },
        "elements": [
          {
            "id": "w_1",
            "elType": "widget",
            "widgetType": "posts-grid",
            "settings": { "category": "politics", "posts_per_page": 6 }
          }
        ]
      }
    ]
  }
]

You already have 90% of this data model in PageBuilderSection (PageBuilderSection → PageBuilderRow → PageBuilderColumn → BuilderItem) and BuilderSectionRenderer. The only missing piece is moving that JSON from wp_options (homepage_settings_*) into wp_postmeta (postId + metaKey = '_builder_data') so any page in wp_posts can use BuilderSectionRenderer.

Layer 3: Assigning Any Page as the Homepage (WordPress Reading Settings)

WordPress and Elementor handle homepage assignment via two options in wp_options (stored via services/settings.service.ts):

show_on_front: 'posts' (default theme feed / NewsHome) or 'page' (a static/builder page).
page_on_front: The wp_posts.ID of the published page selected as the homepage (and per-language equivalents via your translation table!).

When a visitor requests / (app/page.tsx) or /{lang} (app/[lang]/page.tsx):

Check show_on_front and page_on_front in wp_options.
If show_on_front === "page" and page_on_front is set:
Fetch that page (or its translated counterpart for lang).
If that page has _builder_enabled === "1", render its _builder_data sections using BuilderSectionRenderer.
Otherwise render PageTemplate.
And when a visitor requests any other page slug (e.g., /politics-hub or /about), PageTemplate checks if page.builderSections exists—if so, it renders the visual builder layout instead of static HTML!
Layer 4: What Elementor Pro Adds (Theme Builder & Display Conditions)

If you look at elementor-pro/modules/theme-builder/module.php and Conditions_Manager, Elementor Pro extends the exact same page builder to non-static routes using two concepts:

Dynamic Widgets / Dynamic Tags (module.php#L63-L80): Special widgets that pull from the current route context (Post_Title, Post_Content, Post_Featured_Image, Archive_Title, Archive_Posts, Site_Logo).
Locations & Display Conditions (conditions-manager.php):
Templates are saved as posts (post_type = 'elementor_library') with _elementor_template_type set to header, footer, single-post, archive, or error-404.
Each template stores _elementor_conditions (e.g., ["include/archive/category/politics"] or ["include/singular/post_in_category/opinion"]).
At render time, Next.js checks if an active template matches the current route condition; if matched, it renders that builder template instead of the hardcoded PostTemplate or category archive!
Summary Roadmap to Implement This in news
Page Meta Storage (wp_postmeta): Store _builder_enabled (boolean), _builder_data (PageBuilderSection[]), and _page_layout (HomepageLayout) per page in wpPostmeta.
Page Editor Integration (/admincp/pages/[id]): Add an "Edit with Page Builder" toggle/tab inside the Page form that loads the visual Section/Row/Column/Block/Widget builder directly for that page.
Universal Page Rendering (PageTemplate): Update PageTemplate so any page with _builder_enabled renders BuilderSectionRenderer (fetching live posts for any editorial blocks placed on that page).
Homepage Assignment (Settings / Customizer): Add show_on_front ("posts" | "page") and page_on_front (pageId) in DEFAULT_SETTINGS so you can pick any published page from a dropdown to serve as the site's homepage in app/page.tsx and app/[lang]/page.tsx.

Would you like to plan out or start implementing this transition (embedding the Page Builder into Pages and adding the Homepage Page Selector)?