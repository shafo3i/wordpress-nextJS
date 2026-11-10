"use client"

import Link from "next/link"
import styles from "./wire.module.css"
import type { ContentItem } from "@/lib/site-content"
import type { FrontEndThemeContext } from "@/lib/site-theme"
import { ThemeSectionHeader } from "@/components/site/section-header"
import {
  DEFAULT_THEME,
  formatDate,
  getExcerpt,
  getPostUrl,
} from "@/components/site/utils"

/**
 * 8. MINIMAL TEXT BROADSHEET WIRE (Text Only Wire)
 */
export function MinimalTextWireBlock({
  posts,
  title,
  theme = DEFAULT_THEME,
  showExcerpt = true,
  excerptLength = 140,
  showAuthor = true,
  showDate = true,
  showCategory = true,
  subtitle,
  linkText,
  linkHref,
}: {
  posts: ContentItem[]
  title: string
  theme?: FrontEndThemeContext
  showExcerpt?: boolean
  excerptLength?: number
  showAuthor?: boolean
  showDate?: boolean
  showCategory?: boolean
  subtitle?: string
  linkText?: string
  linkHref?: string
}) {
  if (!posts.length) return null

  return (
    <section className={`${styles.feed} space-y-4`}>
      <ThemeSectionHeader
        title={title}
        subtitle={subtitle}
        linkText={linkText}
        linkHref={linkHref}
        theme={theme}
      />

      <div className={styles.items} data-studio-items>
        {posts.map((item) => (
          <article data-studio-divider="bottom" key={item.id} className={styles.item}>
            <div className="space-y-1">
              <div>
                {showCategory && (
                  <span data-studio-category className={styles.category} data-studio-meta>
                    {item.categories[0]}
                  </span>
                )}
                <Link
                  href={getPostUrl(item.slug, theme)}
                  className="hover:underline"
                >
                  <h4 data-studio-title className={styles.title}>{item.title}</h4>
                </Link>
              </div>
              {showExcerpt && excerptLength > 0 && (
                <p data-studio-excerpt className={styles.excerpt}>
                  {getExcerpt(item, excerptLength)}
                </p>
              )}
            </div>

            <div className={styles.meta} data-studio-meta>
              {showAuthor && (
                <span>{theme.dict?.[item.authorName] || item.authorName}</span>
              )}
              {showDate && <span>{formatDate(item.date, theme.locale, theme.timeZone)}</span>}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
