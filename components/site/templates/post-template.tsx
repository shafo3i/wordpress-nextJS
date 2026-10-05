"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock, Share2, Check, Copy } from "lucide-react";
import type { ContentItem } from "@/lib/site-content";
import type { FrontEndThemeContext } from "@/lib/site-theme";
import { ThemeDynamicStyles } from "@/components/site/theme-dynamic-styles";
import { SiteHeader } from "@/components/site/header/site-header";
import { SiteFooter } from "@/components/site/footer/site-footer";
import { SidebarWidgetRenderer } from "@/components/site/sidebar/sidebar-renderer";
import type { WidgetItem } from "@/widgets/types";
import { DEFAULT_THEME, formatDate, isDarkTheme, isSerifHeading, getPostUrl, getCategoryUrl, t } from "@/components/site/utils";

/**
 * Single post article template with configurable layout architectures
 */
export function PostTemplate({
  article,
  relatedPosts,
  theme = DEFAULT_THEME,
  sidebarWidgets = [],
  footerWidgets,
}: {
  article: ContentItem;
  relatedPosts: ContentItem[];
  theme?: FrontEndThemeContext;
  sidebarWidgets?: WidgetItem[];
  footerWidgets?: {
    col1?: WidgetItem[];
    col2?: WidgetItem[];
    col3?: WidgetItem[];
  };
}) {
  const [copied, setCopied] = useState(false);
  const isDark = isDarkTheme(theme);
  const isSerif = isSerifHeading(theme);
  const mods = theme.mods || {};

  const singleLayout = mods.singleLayout || "sidebar-right";
  const singleContentWidth = mods.singleContentWidth || "standard";
  const showFeaturedImage = mods.singleShowFeaturedImage !== false;
  const showAuthorAvatar = mods.singleShowAuthorAvatar !== false;
  const showDate = mods.singleShowDate !== false;
  const showReadingTime = mods.singleShowReadingTime !== false;
  const showShareButtons = mods.singleShowShareButtons !== false;

  const sidebarCategories = Array.from(
    new Set(article.categories.concat(...relatedPosts.map((post) => post.categories)))
  );

  const wordCount = article.content
    ? article.content.replace(/<[^>]*>/g, "").split(/\s+/).filter(Boolean).length
    : 250;
  const readingMinutes = Math.max(1, Math.ceil(wordCount / 200));

  const handleCopy = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard?.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Determine container width based on layout
  const containerClass =
    singleLayout === "centered"
      ? singleContentWidth === "narrow"
        ? "max-w-[720px] mx-auto px-4"
        : singleContentWidth === "standard"
        ? "max-w-[900px] mx-auto px-4"
        : "theme-container mx-auto px-4 sm:px-6" // Wide: full container
      : "theme-container mx-auto px-4 sm:px-6"; // sidebar-right, sidebar-left, full-container

  const renderSidebar = () => {
    if (sidebarWidgets && sidebarWidgets.length > 0) {
      return (
        <aside className="space-y-6">
          {sidebarWidgets.map((item) => (
            <SidebarWidgetRenderer
              key={item.id}
              item={item}
              theme={theme}
              posts={relatedPosts}
            />
          ))}
        </aside>
      );
    }

    return (
      <aside className="space-y-6">
        {/* Topics Widget */}
        <div className="theme-widget rounded-2xl border p-5 shadow-sm">
          <h2 className="theme-widget-title text-xs font-bold uppercase tracking-[0.18em] text-theme-muted mb-3">
            {theme.dict?.["site.topics_categories"] || (theme.locale === "ar" ? "المواضيع والتصنيفات" : "Topics & Categories")}
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {sidebarCategories.map((topic) => (
              <Link
                key={topic}
                href={getCategoryUrl(topic.toLowerCase(), theme)}
                className="theme-badge rounded-md px-2.5 py-1 text-[0.6875rem] font-semibold uppercase transition-opacity hover:opacity-85"
              >
                {topic}
              </Link>
            ))}
          </div>
        </div>

        {/* Related Stories Widget */}
        <div className="theme-widget rounded-2xl border p-5 shadow-sm">
          <h2 className="theme-widget-title text-xs font-bold uppercase tracking-[0.18em] text-theme-muted mb-3">
            {t("site.more_from_newsroom", theme, "More from Newsroom")}
          </h2>
          <div className="space-y-3">
            {relatedPosts.map((story) => (
              <Link
                key={story.id}
                href={getPostUrl(story.slug, theme)}
                className="flex gap-2.5 rounded-lg p-2 hover:bg-theme-border/30 transition-colors group"
              >
                {story.imageUrl && (
                  <img
                    src={story.imageUrl}
                    alt={story.title}
                    className="w-14 h-14 object-cover rounded flex-shrink-0"
                  />
                )}
                <div className="min-w-0">
                  <span className="text-[0.625rem] font-semibold uppercase text-theme-muted block truncate">
                    {story.categories[0] ?? t("site.dispatch", theme, "Dispatch")}
                  </span>
                  <h3 className="mt-0.5 text-xs font-semibold leading-snug line-clamp-2 group-hover:text-[var(--theme-primary)] transition-colors">
                    {story.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </aside>
    );
  };

  return (
    <div
      dir={theme.direction || "ltr"}
      lang={theme.locale || "en"}
      className="min-h-screen transition-colors bg-theme-bg text-theme-text"
    >
      {theme.mods && <ThemeDynamicStyles mods={theme.mods} themeSlug={theme.themeSlug} />}
      <SiteHeader theme={theme} />

      <main className={`${containerClass} py-10`}>
        {/* Article Masthead */}
        <div className="mb-8 border-b border-theme-border pb-8">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {article.categories.map((category) => (
              <span
                key={`${article.id}-${category}`}
                className="theme-badge rounded px-2.5 py-1 text-[0.6875rem] font-bold uppercase tracking-wider"
              >
                {category}
              </span>
            ))}
            {showReadingTime && (
              <span className="flex items-center gap-1 text-[0.6875rem] font-mono text-theme-muted bg-theme-border/40 px-2 py-0.5 rounded">
                <Clock className="size-3" /> {readingMinutes} {t("site.min_read", theme, "min read")}
              </span>
            )}
          </div>

          <h1
            className={`text-3xl sm:text-5xl font-bold tracking-tight leading-tight mb-4 ${
              isSerif ? "font-serif" : "font-sans"
            }`}
          >
            {article.title}
          </h1>

          {article.excerpt && (
            <p className="text-base sm:text-lg text-theme-text leading-relaxed max-w-3xl mb-4 font-normal">
              {article.excerpt}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-theme-border/60 text-xs text-theme-muted">
            <div className="flex items-center gap-3">
              {showAuthorAvatar && (
                <div className="size-8 rounded-full bg-theme-primary text-(--theme-on-primary) flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
                  {article.authorName ? article.authorName.slice(0, 2) : "ED"}
                </div>
              )}
              <div>
                <span className="font-semibold text-theme-heading block">
                  {article.authorName ? (theme.dict?.[article.authorName] || article.authorName) : t("site.editorial_staff", theme, "Editorial Staff")}
                </span>
                {showDate && (
                  <time dateTime={article.date.toISOString()} className="text-[0.6875rem] text-theme-muted block font-mono">
                    {formatDate(article.date, theme.locale)}
                  </time>
                )}
              </div>
            </div>

            {/* Social Share Buttons */}
            {showShareButtons && (
              <div className="flex items-center gap-1.5">
                <span className="text-[0.6875rem] font-medium mr-1 text-theme-muted hidden sm:inline">
                  {t("site.share", theme, "Share")}:
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      window.open(
                        `https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(window.location.href)}`,
                        "_blank",
                        "noopener,noreferrer"
                      );
                    }
                  }}
                  className="rounded p-1.5 border border-theme-border bg-theme-surface hover:opacity-80 text-theme-text transition-colors cursor-pointer"
                  title="Share on X (Twitter)"
                >
                  <span className="text-xs font-bold px-0.5">𝕏</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="rounded p-1.5 border border-theme-border bg-theme-surface hover:opacity-80 text-theme-text transition-colors flex items-center gap-1 cursor-pointer"
                  title={t("site.copy_link", theme, "Copy Link")}
                >
                  {copied ? <Check className="size-3.5 text-theme-primary" /> : <Copy className="size-3.5" />}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Featured Image */}
        {showFeaturedImage && article.imageUrl && (
          <div className="mb-8 rounded-2xl overflow-hidden shadow-sm border border-theme-border">
            <img
              src={article.imageUrl}
              alt={article.title}
              className="w-full max-h-[520px] object-cover"
            />
          </div>
        )}

        {/* Layout Grid Switching */}
        {singleLayout === "sidebar-right" && (
          <div className="grid gap-8 lg:grid-cols-12">
            <article className="lg:col-span-8 prose max-w-none rounded-2xl border p-6 sm:p-8 theme-card bg-[var(--theme-surface)] border-[var(--theme-border)] prose-headings:font-bold prose-p:text-[1.05rem] prose-p:leading-8">
              <div dangerouslySetInnerHTML={{ __html: article.content }} />
            </article>
            <div className="lg:col-span-4">{renderSidebar()}</div>
          </div>
        )}

        {singleLayout === "sidebar-left" && (
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-4 order-2 lg:order-1">{renderSidebar()}</div>
            <article className="lg:col-span-8 order-1 lg:order-2 prose max-w-none rounded-2xl border p-6 sm:p-8 theme-card bg-[var(--theme-surface)] border-[var(--theme-border)] prose-headings:font-bold prose-p:text-[1.05rem] prose-p:leading-8">
              <div dangerouslySetInnerHTML={{ __html: article.content }} />
            </article>
          </div>
        )}

        {singleLayout === "full-container" && (
          <div className="w-full">
            <article
              className={`w-full ${
                singleContentWidth === "narrow"
                  ? "max-w-[720px] mx-auto"
                  : singleContentWidth === "standard"
                  ? "max-w-[900px] mx-auto"
                  : "w-full"
              } prose max-w-none rounded-2xl border p-6 sm:p-10 shadow-sm bg-[var(--theme-surface)] border-[var(--theme-border)] prose-headings:font-bold prose-p:text-[1.1rem] prose-p:leading-8`}
            >
              <div dangerouslySetInnerHTML={{ __html: article.content }} />
            </article>
          </div>
        )}

        {singleLayout === "centered" && (
          <div className="w-full flex justify-center">
            <article
              className={`w-full ${
                singleContentWidth === "narrow"
                  ? "max-w-[720px]"
                  : singleContentWidth === "standard"
                  ? "max-w-[900px]"
                  : "w-full"
              } prose max-w-none rounded-2xl border p-6 sm:p-8 shadow-sm bg-[var(--theme-surface)] border-[var(--theme-border)] prose-headings:font-bold prose-p:text-[1.05rem] prose-p:leading-8`}
            >
              <div dangerouslySetInnerHTML={{ __html: article.content }} />
            </article>
          </div>
        )}
      </main>

      <SiteFooter theme={theme} footerWidgets={footerWidgets} />
    </div>
  );
}
