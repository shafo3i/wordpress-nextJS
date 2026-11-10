"use client"
import { PostThumbnail } from "@/components/site/post-thumbnail";


import Link from "next/link"
import type { ContentItem } from "@/lib/site-content"
import type { FrontEndThemeContext } from "@/lib/site-theme"
import type { ArchiveSettings } from "@/lib/customizer/archive"
import { formatDate, getPostUrl, isSerifHeading } from "@/components/site/utils"

export function CategoryCard({
  post,
  theme,
  settings,
  featured = false,
}: {
  post: ContentItem
  theme: FrontEndThemeContext
  settings: ArchiveSettings
  featured?: boolean
}) {
  const list = settings.archiveLayout === "list" && !featured
  const href = getPostUrl(post.slug, theme)
  const excerpt = post.excerpt.slice(0, settings.archiveExcerptLength)
  return (
    <article
      className={`group min-w-0 overflow-hidden bg-[var(--theme-surface)] ${list ? "flex items-start" : "flex flex-col"}`}
      style={{
        borderRadius: settings.archiveRadius,
        border: `${settings.archiveBorder ? 1 : 0}px solid var(--theme-border)`,
        padding: settings.archivePadding,
        gap: settings.archiveGap,
      }}
    >
      {settings.archiveShowImages && post.imageUrl && (
        <Link
          href={href}
          aria-label={post.title}
          className="block shrink-0 overflow-hidden bg-[var(--theme-bg)]"
          style={{
            width: list ? `min(${settings.archiveImageWidth}px, 25vw)` : "100%",
            maxWidth: list ? "35%" : undefined,
            height: featured
              ? Math.min(360, settings.archiveGridImageHeight * 1.5)
              : list
                ? `min(${settings.archiveImageHeight}px, 25vw)`
                : settings.archiveGridImageHeight,
            borderRadius: settings.archiveImageRadius,
          }}
        >
          <PostThumbnail post={post} theme={theme}
            src={post.imageUrl}
            srcSet={post.imageSrcSet}
            sizes={list ? `${settings.archiveImageWidth}px` : `(max-width: 640px) 100vw, (max-width: 1024px) 50vw, ${Math.ceil(100/settings.archiveColumns)}vw`}
            width={post.imageWidth}
            height={post.imageHeight}
            decoding="async"
            alt=""
            className="h-full w-full object-cover"
            loading={featured ? "eager" : "lazy"}
            onError={(event) => {
              event.currentTarget.style.opacity = "0"
            }}
            onLoad={(event) => {
              event.currentTarget.style.opacity = "1"
            }}
          />
        </Link>
      )}
      <div className="min-w-0 flex-1 space-y-2">
        {(settings.archiveShowCategory || settings.archiveShowDate) && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--theme-muted)]">
            {settings.archiveShowCategory && (
              <span className="font-semibold text-[var(--theme-primary)]">
                {post.categories[0]}
              </span>
            )}
            {settings.archiveShowDate && (
              <time dateTime={new Date(post.date).toISOString()}>
                {formatDate(post.date, theme.locale || theme.defaultLocale)}
              </time>
            )}
          </div>
        )}
        <h2
          className={`line-clamp-3 leading-snug text-[var(--theme-heading)] group-hover:text-[var(--theme-primary)] ${isSerifHeading(theme) ? "font-serif" : ""}`}
          style={{
            fontSize: `clamp(${Math.max(14, settings.archiveTitleSize - 2) + (featured ? 4 : 0)}px, 2vw + 10px, ${settings.archiveTitleSize + (featured ? 4 : 0)}px)`,
            fontWeight: settings.archiveTitleWeight,
          }}
        >
          <Link href={href}>{post.title}</Link>
        </h2>
        {settings.archiveExcerptLength > 0 && excerpt && (
          <p className="line-clamp-3 text-sm leading-relaxed text-[var(--theme-muted)] sm:line-clamp-none">
            {excerpt}
            {post.excerpt.length > excerpt.length ? "…" : ""}
          </p>
        )}
        {settings.archiveShowAuthor && post.authorName && (
          <p className="text-xs text-[var(--theme-muted)]">{post.authorName}</p>
        )}
      </div>
    </article>
  )
}
