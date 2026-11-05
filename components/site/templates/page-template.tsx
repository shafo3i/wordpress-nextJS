"use client";

import type { ContentItem } from "@/lib/site-content";
import type { FrontEndThemeContext } from "@/lib/site-theme";
import type { WidgetItem } from "@/lib/widgets/db";
import { ThemeDynamicStyles } from "@/components/site/theme-dynamic-styles";
import { SiteHeader } from "@/components/site/header/site-header";
import { SiteFooter } from "@/components/site/footer/site-footer";
import { SidebarWidgetRenderer } from "@/components/site/sidebar/sidebar-renderer";
import { StudioRenderer } from "@/components/site/studio/studio-renderer";
import { DEFAULT_THEME, isDarkTheme, isSerifHeading, t } from "@/components/site/utils";

/**
 * Dynamic Page Template supporting multiple layouts:
 * - default: Standard centered editorial container (max-w-4xl)
 * - full-width: Broad expansive layout (max-w-7xl) without sidebars
 * - with-sidebar: 2-column layout with the site's widget sidebar
 * - landing: Clean modern full-bleed landing canvas
 */
export function PageTemplate({
  page,
  theme = DEFAULT_THEME,
  sidebarWidgets = [],
  relatedPosts = [],
  footerWidgets,
}: {
  page: ContentItem;
  relatedPosts?: ContentItem[];
  sidebarWidgets?: WidgetItem[];
  theme?: FrontEndThemeContext;
  footerWidgets?: {
    col1?: WidgetItem[];
    col2?: WidgetItem[];
    col3?: WidgetItem[];
    col4?: WidgetItem[];
  };
}) {
  const isDark = isDarkTheme(theme);
  const isSerif = isSerifHeading(theme);
  const template = page.template || "default";
  const isRtl = theme.direction === "rtl";
  const pageBadge = t("site.page", theme, "Page");
  const editorialBadge = t("site.editorial_page", theme, "Editorial Page");

  const activeLocale = theme?.locale || theme?.defaultLocale || "en";
  const visibleWidgets = (sidebarWidgets || []).filter(
    (item) => !item.locale || item.locale === "all" || item.locale === activeLocale
  );
  const hasSidebar = visibleWidgets.length > 0;

  const isStudio = Boolean(page.studioEnabled && page.studioDocument);
  const studioTemplate =
    page.studioDocument?.pageTemplate ||
    page.studioDocument?.settings?.pageTemplate ||
    template;
  const isStudioCanvas = isStudio && studioTemplate === "studio_canvas";

  return (
    <div
      dir={theme.direction || "ltr"}
      lang={theme.locale || "en"}
      className="min-h-screen transition-colors bg-theme-bg text-theme-text"
      style={
        isStudio && page.studioDocument?.settings?.backgroundColor
          ? { backgroundColor: page.studioDocument.settings.backgroundColor }
          : undefined
      }
    >
      {theme.mods && <ThemeDynamicStyles mods={theme.mods} themeSlug={theme.themeSlug} />}
      {!isStudioCanvas && <SiteHeader theme={theme} />}

      {isStudio && page.studioDocument ? (
        <main className={studioTemplate === "studio_full_width" || studioTemplate === "studio_canvas" ? "w-full" : "w-full py-6"}>
          {!page.studioDocument.settings?.hideTitle &&
            studioTemplate !== "studio_full_width" &&
            studioTemplate !== "studio_canvas" && (
              <div className="mx-auto theme-container px-4 pb-6 md:px-6">
                <h1
                  className={`text-3xl sm:text-5xl font-bold tracking-tight ${
                    isSerif ? "font-serif" : "font-sans"
                  }`}
                >
                  {page.title}
                </h1>
              </div>
            )}
          <StudioRenderer
            widgetContent={page.studioContent}
            contentLocale={theme.locale || page.locale}
            pageLocale={page.locale}
            elements={page.studioDocument.elements}
            posts={relatedPosts}
            theme={theme}
            isEditor={false}
          />
        </main>
      ) : template === "landing" ? (
        /* Landing Page Layout: Seamless full-bleed canvas */
        <main className="mx-auto theme-container px-4 py-16 md:px-8">
          <div className="text-center mb-12">
            <h1
              className={`text-4xl sm:text-6xl font-extrabold tracking-tight ${isSerif ? "font-serif" : "font-sans"
                }`}
            >
              {page.title}
            </h1>
          </div>

          <div
            className={`prose max-w-none ${isDark ? "prose-invert" : "prose-slate"
              } prose-headings:font-bold prose-p:text-[1.1rem] prose-p:leading-8`}
          >
            <div dangerouslySetInnerHTML={{ __html: page.content }} />
          </div>
        </main>
      ) : template === "with-sidebar" ? (
        /* With Sidebar Layout: 2-Column content + sidebar widgets */
        <main className="mx-auto theme-container px-4 py-12 md:px-6">
          <div className={hasSidebar ? "grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]" : "w-full"}>
            <article
              className={`rounded-2xl border p-8 sm:p-12 theme-card border-theme-border bg-theme-surface`}
            >
              <p className="text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-theme-muted">{pageBadge}</p>
              <h1
                className={`mt-2 text-3xl sm:text-5xl font-bold tracking-tight ${isSerif ? "font-serif" : "font-sans"
                  }`}
              >
                {page.title}
              </h1>

              <div
                className={`mt-8 prose max-w-none ${isDark ? "prose-invert" : "prose-slate"
                  } prose-headings:font-bold prose-p:text-[1.05rem] prose-p:leading-8`}
              >
                <div dangerouslySetInnerHTML={{ __html: page.content }} />
              </div>
            </article>

            {hasSidebar && (
              <aside className="space-y-6">
                {visibleWidgets.map((item) => (
                  <SidebarWidgetRenderer
                    key={item.id}
                    item={item}
                    posts={relatedPosts}
                    theme={theme}
                  />
                ))}
              </aside>
            )}
          </div>
        </main>
      ) : template === "full-width" ? (
        /* Full Width Layout: Expansive max-w-7xl container */
        <main className="mx-auto theme-container px-4 py-12 md:px-6">
          <article
            className={`rounded-2xl border p-8 sm:p-12 theme-card border-theme-border bg-theme-surface`}
          >
            <p className="text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-theme-muted">{pageBadge}</p>
            <h1
              className={`mt-2 text-3xl sm:text-5xl font-bold tracking-tight ${isSerif ? "font-serif" : "font-sans"
                }`}
            >
              {page.title}
            </h1>

            <div
              className={`mt-8 prose max-w-none ${isDark ? "prose-invert" : "prose-slate"
                } prose-headings:font-bold prose-p:text-[1.05rem] prose-p:leading-8`}
            >
              <div dangerouslySetInnerHTML={{ __html: page.content }} />
            </div>
          </article>
        </main>
      ) : (
        /* Default Layout: Standard centered editorial container (max-w-4xl) */
        <main className="mx-auto max-w-4xl px-4 py-12 md:px-6">
          <article
            className={`rounded-2xl border p-8 sm:p-12 theme-card border-theme-border bg-theme-surface`}
          >
            <p className="text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-theme-muted">{editorialBadge}</p>
            <h1
              className={`mt-2 text-3xl sm:text-5xl font-bold tracking-tight ${isSerif ? "font-serif" : "font-sans"
                }`}
            >
              {page.title}
            </h1>

            <div
              className={`mt-8 prose max-w-none ${isDark ? "prose-invert" : "prose-slate"
                } prose-headings:font-bold prose-p:text-[1.05rem] prose-p:leading-8`}
            >
              <div dangerouslySetInnerHTML={{ __html: page.content }} />
            </div>
          </article>
        </main>
      )}

      {!isStudioCanvas && <SiteFooter theme={theme} footerWidgets={footerWidgets} />}
    </div>
  );
}
