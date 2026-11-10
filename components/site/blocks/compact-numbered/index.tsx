"use client"

import Link from "next/link"
import type { ContentItem } from "@/lib/site-content"
import type { FrontEndThemeContext } from "@/lib/site-theme"
import { ThemeSectionHeader } from "@/components/site/section-header"
import {
  DEFAULT_THEME,
  formatDate,
  getPostUrl,
  isSerifHeading,
} from "@/components/site/utils"

/**
 * COMPACT NUMBERED TOP-5 WIRE STRIP BLOCK
 */
export function CompactNumberedGridBlock({
  posts,
  title,
  theme = DEFAULT_THEME,
  showDate = true,
  showCategory = true,
  subtitle,
  linkText,
  linkHref,
}: {
  posts: ContentItem[]
  title: string
  theme?: FrontEndThemeContext
  showDate?: boolean
  showCategory?: boolean
  subtitle?: string
  linkText?: string
  linkHref?: string
}) {
  const isSerif = isSerifHeading(theme)
  if (!posts.length) return null

  const items = posts.slice(0, 5)

  return (
    <section className="space-y-4">
      <ThemeSectionHeader
        title={title}
        subtitle={subtitle}
        linkText={linkText}
        linkHref={linkHref}
        theme={theme}
      />

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
        {items.map((post) => (
          <article
            key={post.id}
            className="group relative flex flex-col justify-between rounded-xl border border-theme-border bg-theme-surface p-3.5 shadow-2xs transition-all hover:border-theme-primary"
          >
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1 space-y-1.5">
                {showCategory && post.categories[0] && (
                  <span
                    data-studio-category
                    className="block truncate text-[10px] font-bold tracking-wider text-theme-primary uppercase"
                  >
                    {post.categories[0]}
                  </span>
                )}
                <Link href={getPostUrl(post.slug, theme)}>
                  <h4
                    data-studio-title
                    className={`line-clamp-3 text-xs leading-snug font-bold text-theme-heading transition-colors group-hover:text-theme-primary sm:text-sm ${
                      isSerif ? "font-serif" : "font-sans"
                    }`}
                  >
                    {post.title}
                  </h4>
                </Link>
              </div>
            </div>

            {showDate && (
              <div data-studio-divider="top" className="mt-3 flex items-center justify-between border-t border-theme-border/60 pt-2 font-mono text-[10px] text-theme-muted">
                <span>{post.authorName}</span>
                <span>
                  {formatDate(post.date, theme.locale, theme.timeZone)}
                </span>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}
