"use client";

import type { ContentItem } from "@/lib/site-content";
import type { FrontEndThemeContext } from "@/lib/site-theme";
import { ThemeDynamicStyles } from "@/components/site/theme-dynamic-styles";
import { SiteHeader } from "@/components/site/header/site-header";
import { SiteFooter } from "@/components/site/footer/site-footer";
import { DEFAULT_THEME } from "@/components/site/utils";

/**
 * Standard page template
 */
export function PageTemplate({
  page,
  theme = DEFAULT_THEME,
}: {
  page: ContentItem;
  relatedPosts?: ContentItem[];
  theme?: FrontEndThemeContext;
}) {
  const isDark = theme.darkMode || theme.themeSlug === "ledger-dark";
  const isSerif =
    theme.headingFont === "serif" ||
    theme.themeSlug === "ledger-classic" ||
    theme.themeSlug === "ledger-reader";

  return (
    <div
      className={`min-h-screen transition-colors ${
        isDark ? "bg-[#0a0f1d] text-slate-100" : "bg-[#f8f7f4] text-slate-900"
      }`}
    >
      {theme.mods && <ThemeDynamicStyles mods={theme.mods} />}
      <SiteHeader theme={theme} />

      <main className="mx-auto max-w-4xl px-4 py-12 md:px-6">
        <div
          className={`rounded-2xl border p-8 sm:p-12 shadow-sm ${
            isDark ? "border-slate-800 bg-slate-900/60" : "border-slate-200 bg-white"
          }`}
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Editorial Page</p>
          <h1
            className={`mt-2 text-3xl sm:text-5xl font-bold tracking-tight ${
              isSerif ? "font-serif" : "font-sans"
            }`}
          >
            {page.title}
          </h1>

          <div
            className={`mt-8 prose max-w-none ${
              isDark ? "prose-invert" : "prose-slate"
            } prose-headings:font-bold prose-p:text-[1.05rem] prose-p:leading-8`}
          >
            <div dangerouslySetInnerHTML={{ __html: page.content }} />
          </div>
        </div>
      </main>

      <SiteFooter theme={theme} />
    </div>
  );
}
