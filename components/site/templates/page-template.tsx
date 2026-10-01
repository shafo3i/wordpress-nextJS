"use client";

import type { ContentItem } from "@/lib/site-content";
import type { FrontEndThemeContext } from "@/lib/site-theme";
import type { WidgetItem } from "@/lib/widgets/db";
import { ThemeDynamicStyles } from "@/components/site/theme-dynamic-styles";
import { SiteHeader } from "@/components/site/header/site-header";
import { SiteFooter } from "@/components/site/footer/site-footer";
import { SidebarWidgetRenderer } from "@/components/site/sidebar/sidebar-renderer";
import { DEFAULT_THEME, isDarkTheme, isSerifHeading } from "@/components/site/utils";

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
  };
}) {
  const isDark = isDarkTheme(theme);
  const isSerif = isSerifHeading(theme);
  const template = page.template || "default";

  return (
    <div
      className={`min-h-screen transition-colors ${isDark ? "bg-[#0a0f1d] text-slate-100" : "bg-[#f8f7f4] text-slate-900"
        }`}
    >
      {theme.mods && <ThemeDynamicStyles mods={theme.mods} />}
      <SiteHeader theme={theme} />

      {template === "landing" ? (
        /* Landing Page Layout: Seamless full-bleed canvas */
        <main className="mx-auto container px-4 py-16 md:px-8">
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
        <main className="mx-auto container px-4 py-12 md:px-6">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
            <article
              className={`rounded-2xl border p-8 sm:p-12 shadow-sm ${isDark ? "border-slate-800 bg-slate-900/60" : "border-slate-200 bg-white"
                }`}
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Page</p>
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

            <aside className="space-y-6">
              {sidebarWidgets.length > 0 ? (
                sidebarWidgets.map((item) => (
                  <SidebarWidgetRenderer
                    key={item.id}
                    item={item}
                    posts={relatedPosts}
                    theme={theme}
                  />
                ))
              ) : (
                <div
                  className={`rounded-xl border p-6 text-center text-xs text-slate-400 ${isDark ? "border-slate-800 bg-slate-900/40" : "border-slate-200 bg-white"
                    }`}
                >
                  No widgets configured for the sidebar.
                </div>
              )}
            </aside>
          </div>
        </main>
      ) : template === "full-width" ? (
        /* Full Width Layout: Expansive max-w-7xl container */
        <main className="mx-auto container px-4 py-12 md:px-6">
          <article
            className={`rounded-2xl border p-8 sm:p-12 shadow-sm ${isDark ? "border-slate-800 bg-slate-900/60" : "border-slate-200 bg-white"
              }`}
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Page</p>
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
            className={`rounded-2xl border p-8 sm:p-12 shadow-sm ${isDark ? "border-slate-800 bg-slate-900/60" : "border-slate-200 bg-white"
              }`}
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Editorial Page</p>
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

      <SiteFooter theme={theme} footerWidgets={footerWidgets} />
    </div>
  );
}
