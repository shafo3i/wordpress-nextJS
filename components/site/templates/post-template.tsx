"use client"
import { NewsletterBlock } from "@/components/site/blocks/newsletter"
import type { NewsletterPresentation } from "@/lib/newsletter/presentation"
import { ContentImage } from "@/components/site/content-image"

import { ArticleShare } from "@/components/site/article-share"
import { PostViews } from "@/components/site/post-views"
import { Clock } from "lucide-react"
import type { ContentItem } from "@/lib/site-content"
import type { FrontEndThemeContext } from "@/lib/site-theme"
import { ThemeDynamicStyles } from "@/components/site/theme-dynamic-styles"
import { SiteHeader } from "@/components/site/header/site-header"
import { SiteFooter } from "@/components/site/footer/site-footer"
import { SidebarWidgetRenderer } from "@/components/site/sidebar/sidebar-renderer"
import type { WidgetItem } from "@/widgets/types"
import {
  DEFAULT_THEME,
  formatDate,
  isSerifHeading,
  getPostUrl,
  t,
} from "@/components/site/utils"

/**
 * Single post article template with configurable layout architectures
 */
export function PostTemplate({
  article,
  relatedPosts,
  theme = DEFAULT_THEME,
  sidebarWidgets = [],
  footerWidgets,
  trackViews = true,
  newsletter,
  readingWordCount,
}: {
  article: ContentItem
  relatedPosts: ContentItem[]
  trackViews?: boolean
  newsletter?: NewsletterPresentation
  readingWordCount?: number
  theme?: FrontEndThemeContext
  sidebarWidgets?: WidgetItem[]
  footerWidgets?: {
    col1?: WidgetItem[]
    col2?: WidgetItem[]
    col3?: WidgetItem[]
    col4?: WidgetItem[]
  }
}) {
  const isSerif = isSerifHeading(theme)
  const mods = theme.mods || {}

  const singleLayout = mods.singleLayout || "sidebar-right"
  const singleContentWidth = mods.singleContentWidth || "standard"
  const showFeaturedImage = mods.singleShowFeaturedImage !== false
  const showAuthorAvatar = mods.singleShowAuthorAvatar !== false
  const showDate = mods.singleShowDate !== false
  const showReadingTime = mods.singleShowReadingTime !== false
  const showShareButtons = mods.singleShowShareButtons !== false

  const wordCount =
    readingWordCount ??
    (article.content
      ? article.content
          .replace(/<[^>]*>/g, "")
          .split(/\s+/)
          .filter(Boolean).length
      : 0)
  const readingMinutes = Math.max(1, Math.ceil(wordCount / 200))

  // Determine container width based on layout
  const containerClass =
    singleLayout === "centered"
      ? singleContentWidth === "narrow"
        ? "max-w-[720px] mx-auto px-4"
        : singleContentWidth === "standard"
          ? "max-w-[900px] mx-auto px-4"
          : "theme-container mx-auto px-4 sm:px-6" // Wide: full container
      : "theme-container mx-auto px-4 sm:px-6" // sidebar-right, sidebar-left, full-container

  const activeLocale = theme?.locale || theme?.defaultLocale || "en"
  const visibleWidgets = (sidebarWidgets || []).filter(
    (item) =>
      !item.locale || item.locale === "all" || item.locale === activeLocale
  )
  const hasSidebar = visibleWidgets.length > 0

  const renderSidebar = () => {
    if (!hasSidebar) {
      return null
    }

    return (
      <aside className="space-y-6">
        {visibleWidgets.map((item) => (
          <SidebarWidgetRenderer
            key={item.id}
            item={item}
            theme={theme}
            posts={relatedPosts}
          />
        ))}
      </aside>
    )
  }

  return (
    <div
      data-single-article=""
      dir={theme.direction || "ltr"}
      lang={theme.locale || "en"}
      className="min-h-screen bg-theme-bg text-theme-text transition-colors"
    >
      {theme.mods && (
        <ThemeDynamicStyles mods={theme.mods} themeSlug={theme.themeSlug} />
      )}
      <SiteHeader theme={theme} />

      <main className={`${containerClass} py-10`}>
        {/* Article Masthead */}
        <div
          data-article-divider=""
          className="mb-8 border-b border-theme-border pb-8"
        >
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {article.categories.map((category) => (
              <span
                key={`${article.id}-${category}`}
                className="theme-badge rounded px-2.5 py-1 text-[0.6875rem] font-bold tracking-wider uppercase"
              >
                {category}
              </span>
            ))}
            {showReadingTime && (
              <span className="flex items-center gap-1 rounded bg-theme-border/40 px-2 py-0.5 font-mono text-[0.6875rem] text-theme-muted">
                <Clock className="size-3" /> {readingMinutes}{" "}
                {t("site.min_read", theme, "min read")}
              </span>
            )}
          </div>

          <h1
            className={`mb-4 text-3xl leading-tight font-bold tracking-tight sm:text-5xl ${
              isSerif ? "font-serif" : "font-sans"
            }`}
          >
            {article.title}
          </h1>

          {article.excerpt && (
            <p className="mb-4 max-w-3xl text-base leading-relaxed font-normal text-theme-text sm:text-lg">
              {article.excerpt}
            </p>
          )}

          <div
            data-article-divider=""
            className="flex flex-wrap items-center justify-between gap-4 border-t border-theme-border/60 pt-4 text-xs text-theme-muted"
          >
            <div className="flex items-center gap-3">
              {showAuthorAvatar && (
                <div className="flex size-8 flex-shrink-0 items-center justify-center rounded-full bg-theme-primary text-xs font-bold text-(--theme-on-primary) uppercase">
                  {article.authorName ? article.authorName.slice(0, 2) : "ED"}
                </div>
              )}
              <div>
                <span className="block font-semibold text-theme-heading">
                  {article.authorName
                    ? theme.dict?.[article.authorName] || article.authorName
                    : t("site.editorial_staff", theme, "Editorial Staff")}
                </span>
                {showDate && (
                  <time
                    dateTime={article.date.toISOString()}
                    className="block font-mono text-[0.6875rem] text-theme-muted"
                  >
                    {formatDate(article.date, theme.locale, theme.timeZone)}
                  </time>
                )}
              </div>
            </div>

            {/* Social Share Buttons */}
            <PostViews
              postId={article.id}
              initialCount={article.viewCount}
              track={trackViews}
              visible={mods.singleShowViews !== false}
              label={t("site.views", theme, "")}
              locale={activeLocale}
            />
            {showShareButtons && (
              <ArticleShare
                title={article.title}
                url={`${theme.siteUrl || ""}${getPostUrl(article.slug, theme)}`}
                mods={mods}
                dict={theme.dict}
              />
            )}
          </div>
        </div>

        {/* Featured Image */}
        {showFeaturedImage && article.imageUrl && (
          <div
            data-article-image=""
            className="mb-8 overflow-hidden rounded-2xl border border-theme-border shadow-sm"
          >
            <ContentImage
              src={article.imageUrl}
              srcSet={article.imageSrcSet}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 900px"
              width={article.imageWidth}
              height={article.imageHeight}
              style={{
                aspectRatio:
                  article.imageWidth && article.imageHeight
                    ? `${article.imageWidth} / ${article.imageHeight}`
                    : "16 / 9",
              }}
              fetchPriority="high"
              loading="eager"
              decoding="async"
              alt={article.title}
              className="max-h-[520px] w-full object-cover"
            />
          </div>
        )}

        {/* Layout Grid Switching */}
        {singleLayout === "sidebar-right" &&
          (hasSidebar ? (
            <div className="grid gap-8 lg:grid-cols-12">
              <article className="prose theme-card prose-headings:font-bold prose-p:text-[1.05rem] prose-p:leading-8 max-w-none rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 sm:p-8 lg:col-span-8">
                <div dangerouslySetInnerHTML={{ __html: article.content }} />
              </article>
              <div className="lg:col-span-4">{renderSidebar()}</div>
            </div>
          ) : (
            <div className="w-full">
              <article className="prose theme-card prose-headings:font-bold prose-p:text-[1.05rem] prose-p:leading-8 w-full max-w-none rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 sm:p-8">
                <div dangerouslySetInnerHTML={{ __html: article.content }} />
              </article>
            </div>
          ))}

        {singleLayout === "sidebar-left" &&
          (hasSidebar ? (
            <div className="grid gap-8 lg:grid-cols-12">
              <div className="order-2 lg:order-1 lg:col-span-4">
                {renderSidebar()}
              </div>
              <article className="prose theme-card prose-headings:font-bold prose-p:text-[1.05rem] prose-p:leading-8 order-1 max-w-none rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 sm:p-8 lg:order-2 lg:col-span-8">
                <div dangerouslySetInnerHTML={{ __html: article.content }} />
              </article>
            </div>
          ) : (
            <div className="w-full">
              <article className="prose theme-card prose-headings:font-bold prose-p:text-[1.05rem] prose-p:leading-8 w-full max-w-none rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 sm:p-8">
                <div dangerouslySetInnerHTML={{ __html: article.content }} />
              </article>
            </div>
          ))}

        {singleLayout === "full-container" && (
          <div className="w-full">
            <article
              className={`w-full ${
                singleContentWidth === "narrow"
                  ? "mx-auto max-w-[720px]"
                  : singleContentWidth === "standard"
                    ? "mx-auto max-w-[900px]"
                    : "w-full"
              } prose prose-headings:font-bold prose-p:text-[1.1rem] prose-p:leading-8 max-w-none rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 shadow-sm sm:p-10`}
            >
              <div dangerouslySetInnerHTML={{ __html: article.content }} />
            </article>
          </div>
        )}

        {singleLayout === "centered" && (
          <div className="flex w-full justify-center">
            <article
              className={`w-full ${
                singleContentWidth === "narrow"
                  ? "max-w-[720px]"
                  : singleContentWidth === "standard"
                    ? "max-w-[900px]"
                    : "w-full"
              } prose prose-headings:font-bold prose-p:text-[1.05rem] prose-p:leading-8 max-w-none rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 shadow-sm sm:p-8`}
            >
              <div dangerouslySetInnerHTML={{ __html: article.content }} />
            </article>
          </div>
        )}
        {newsletter && (
          <NewsletterBlock
            source="article_footer"
            title={
              newsletter.brandName || theme.dict?.["site.newsletter"] || ""
            }
            theme={theme}
            config={newsletter}
          />
        )}
      </main>

      <SiteFooter theme={theme} footerWidgets={footerWidgets} />
    </div>
  )
}
