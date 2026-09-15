"use client";

import Link from "next/link";
import type { ContentItem } from "@/lib/site-content";
import type { FrontEndThemeContext } from "@/lib/site-theme";
import { ThemeDynamicStyles } from "@/components/site/theme-dynamic-styles";
import { SiteHeader } from "@/components/site/header/site-header";
import { SiteFooter } from "@/components/site/footer/site-footer";
import { DEFAULT_THEME, formatDate, isDarkTheme, isSerifHeading } from "@/components/site/utils";

/**
 * Single post article template
 */
export function PostTemplate({
  article,
  relatedPosts,
  theme = DEFAULT_THEME,
}: {
  article: ContentItem;
  relatedPosts: ContentItem[];
  theme?: FrontEndThemeContext;
}) {
  const isDark = isDarkTheme(theme);
  const isSerif = isSerifHeading(theme);
  const sidebarCategories = Array.from(
    new Set(article.categories.concat(...relatedPosts.map((post) => post.categories)))
  );

  return (
    <div
      className={`min-h-screen transition-colors ${
        isDark ? "bg-[#0a0f1d] text-slate-100" : (theme.themeSlug?.includes("reader") || theme.themeSlug?.includes("longform")) ? "bg-[#fbf9f5] text-stone-900" : "bg-[#f8f7f4] text-slate-900"
      }`}
    >
      {theme.mods && <ThemeDynamicStyles mods={theme.mods} />}
      <SiteHeader theme={theme} />

      <main className="mx-auto max-w-5xl px-4 py-10 md:px-6">
        <div className="mb-8 border-b border-slate-200/70 dark:border-slate-800 pb-8">
          <div className="mb-4 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.18em]">
            {article.categories.map((category) => (
              <span
                key={`${article.id}-${category}`}
                className="rounded bg-slate-200/70 dark:bg-slate-800 px-2 py-1"
              >
                {category}
              </span>
            ))}
          </div>

          <h1
            className={`text-3xl sm:text-5xl font-bold tracking-tight leading-tight ${
              isSerif ? "font-serif" : "font-sans"
            }`}
          >
            {article.title}
          </h1>

          <div className="mt-4 flex items-center gap-3 text-xs text-slate-400">
            <span className="font-semibold text-slate-600 dark:text-slate-300">
              {article.authorName}
            </span>
            <span>•</span>
            <time dateTime={article.date.toISOString()}>{formatDate(article.date)}</time>
          </div>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1.7fr_0.7fr]">
          <article
            className={`prose max-w-none rounded-2xl border p-6 sm:p-8 shadow-sm ${
              isDark
                ? "prose-invert border-slate-800 bg-slate-900/60"
                : "prose-slate border-slate-200 bg-white"
            } prose-headings:font-bold prose-p:text-[1.05rem] prose-p:leading-8`}
          >
            {article.imageUrl && (
              <div className="mb-6 rounded-xl overflow-hidden not-prose">
                <img
                  src={article.imageUrl}
                  alt={article.title}
                  className="w-full h-80 object-cover"
                />
              </div>
            )}
            <div dangerouslySetInnerHTML={{ __html: article.content }} />
          </article>

          <aside className="space-y-6">
            <div
              className={`rounded-2xl border p-5 shadow-sm ${
                isDark ? "border-slate-800 bg-slate-900/40" : "border-slate-200 bg-white"
              }`}
            >
              <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Topics</h2>
              <ul className="mt-3 space-y-1.5 text-xs font-medium">
                {sidebarCategories.map((topic) => (
                  <li key={topic} className="rounded bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5">
                    {topic}
                  </li>
                ))}
              </ul>
            </div>

            <div
              className={`rounded-2xl border p-5 shadow-sm ${
                isDark ? "border-slate-800 bg-slate-900/40" : "border-slate-200 bg-white"
              }`}
            >
              <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">More Stories</h2>
              <div className="mt-3 space-y-3">
                {relatedPosts.map((story) => (
                  <Link
                    key={story.id}
                    href={`/posts/${story.slug}`}
                    className="flex gap-2.5 rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    {story.imageUrl && (
                      <img
                        src={story.imageUrl}
                        alt={story.title}
                        className="w-14 h-14 object-cover rounded flex-shrink-0"
                      />
                    )}
                    <div>
                      <p className="text-[10px] font-semibold uppercase text-slate-400">
                        {story.categories[0] ?? "Story"}
                      </p>
                      <h3 className="mt-0.5 text-xs font-semibold leading-snug line-clamp-2">
                        {story.title}
                      </h3>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>

      <SiteFooter theme={theme} />
    </div>
  );
}
