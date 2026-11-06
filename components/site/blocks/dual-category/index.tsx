"use client"

import Link from "next/link"
import styles from "./columns.module.css"
import type { ContentItem } from "@/lib/site-content"
import type { FrontEndThemeContext } from "@/lib/site-theme"
import { ThemeSectionHeader } from "@/components/site/section-header"
import {
  DEFAULT_THEME,
  formatDate,
  getExcerpt,
  getPostUrl,
  isSerifHeading,
} from "@/components/site/utils"

/**
 * DUAL CATEGORY / TWO-COLUMN EDITORIAL SPLIT BLOCK
 */
export function DualCategoryColumnsBlock({
  posts,
  title,
  theme = DEFAULT_THEME,
  showExcerpt = true,
  showAuthor = true,
  showDate = true,
  showCategory = true,
  subtitle,
  linkText,
  linkHref,
  col1Title,
  col2Title,
}: {
  posts: ContentItem[]
  title: string
  theme?: FrontEndThemeContext
  showExcerpt?: boolean
  showAuthor?: boolean
  showDate?: boolean
  showCategory?: boolean
  subtitle?: string
  linkText?: string
  linkHref?: string
  col1Title?: string
  col2Title?: string
}) {
  const isSerif = isSerifHeading(theme)
  if (!posts.length) return null

  const half = Math.max(1, Math.ceil(posts.length / 2))
  const leftPosts = posts.slice(0, half)
  const rightPosts = posts.slice(half, half * 2)

  const renderColumn = (items: ContentItem[], headerTitle?: string) => {
    if (!items.length) return null
    const lead = items[0]
    const rest = items.slice(1)

    return (
      <div data-studio-card className={`${styles.card} space-y-4`}>
        {headerTitle && (
          <div className="border-b-2 border-theme-primary pb-2">
            <h4 className="text-xs font-black tracking-wider text-theme-heading uppercase">
              {headerTitle}
            </h4>
          </div>
        )}

        {/* Lead Card */}
        <article className="space-y-3">
          <Link
            data-studio-image
            href={getPostUrl(lead.slug, theme)}
            className={`${styles.leadImage} group`}
          >
            <img
              src={lead.imageUrl}
              alt={lead.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {showCategory && lead.categories[0] && (
              <span
                data-studio-category
                style={{ backgroundColor: theme.primaryColor }}
                className="absolute start-3 top-3 rounded px-2 py-0.5 text-[10px] font-bold tracking-wider text-white uppercase"
              >
                {lead.categories[0]}
              </span>
            )}
          </Link>

          <div className="space-y-1.5">
            <Link href={getPostUrl(lead.slug, theme)}>
              <h3
                data-studio-title
                className={`text-lg leading-snug font-extrabold text-theme-heading transition-colors hover:text-theme-primary sm:text-xl ${
                  isSerif ? "font-serif" : "font-sans"
                }`}
              >
                {lead.title}
              </h3>
            </Link>

            {(showAuthor || showDate) && (
              <div className="flex items-center gap-2 text-[11px] text-theme-muted">
                {showAuthor && (
                  <span className="font-semibold">{lead.authorName}</span>
                )}
                {showDate && (
                  <span>• {formatDate(lead.date, theme.locale)}</span>
                )}
              </div>
            )}

            {showExcerpt && (
              <p
                data-studio-excerpt
                className="line-clamp-2 text-xs leading-relaxed text-theme-text"
              >
                {getExcerpt(lead, 130)}
              </p>
            )}
          </div>
        </article>

        {/* Sub-list */}
        {rest.length > 0 && (
          <div className="divide-y divide-theme-border border-t border-theme-border pt-2">
            {rest.map((item) => (
              <div key={item.id} className="flex items-center gap-3 py-2.5">
                <Link
                  data-studio-image
                  href={getPostUrl(item.slug, theme)}
                  className={styles.thumbnail}
                >
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="h-full w-full object-cover"
                  />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={getPostUrl(item.slug, theme)}>
                    <h5
                      data-studio-title
                      className={`line-clamp-2 text-xs leading-snug font-bold text-theme-heading hover:text-theme-primary sm:text-sm ${
                        isSerif ? "font-serif" : "font-sans"
                      }`}
                    >
                      {item.title}
                    </h5>
                  </Link>
                  {showDate && (
                    <span className="mt-0.5 block font-mono text-[10px] text-theme-muted">
                      {formatDate(item.date, theme.locale)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <section className={`${styles.section} space-y-4`}>
      <ThemeSectionHeader
        title={title}
        subtitle={subtitle}
        linkText={linkText}
        linkHref={linkHref}
        theme={theme}
      />
      <div
        className={styles.columns}
        data-dual-columns={rightPosts.length ? 2 : 1}
      >
        {renderColumn(leftPosts, col1Title)}
        {renderColumn(rightPosts, col2Title)}
      </div>
    </section>
  )
}
