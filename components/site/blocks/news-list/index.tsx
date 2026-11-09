"use client"
import { ContentImage } from "@/components/site/content-image";


import Link from "next/link"
import styles from "./list.module.css"
import type { ContentItem } from "@/lib/site-content"
import type { FrontEndThemeContext } from "@/lib/site-theme"
import { ThemeSectionHeader } from "@/components/site/section-header"
import {
  DEFAULT_THEME,
  formatDate,
  getExcerpt,
  isSerifHeading,
  getPostUrl,
  t,
} from "@/components/site/utils"

/**
 * 5. NEWS LIST VIEW BLOCK (Supports Thumbnail Left OR Thumbnail Right)
 */
export function NewsListViewBlock({
  posts,
  title,
  theme = DEFAULT_THEME,
  thumbRight = false,
  showExcerpt = true,
  excerptLength = 160,
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
  thumbRight?: boolean
  showExcerpt?: boolean
  excerptLength?: number
  showAuthor?: boolean
  showDate?: boolean
  showCategory?: boolean
  subtitle?: string
  linkText?: string
  linkHref?: string
}) {
  const isSerif = isSerifHeading(theme)

  if (!posts.length) return null

  return (
    <section className={`${styles.section} space-y-4`}>
      <ThemeSectionHeader
        title={title}
        subtitle={subtitle}
        linkText={linkText}
        linkHref={linkHref}
        theme={theme}
      />

      <div className={styles.items} data-studio-items>
        {posts.map((item) => (
          <article
            key={item.id}
            style={{
              backgroundColor: "var(--theme-surface)",
              borderColor: "var(--theme-border)",
            }}
            className={`${styles.article} ${thumbRight ? styles.reverse : ""}`}
          >
            <div className={styles.image} data-studio-image>
              <ContentImage
                src={item.imageUrl}
                alt={item.title}
                className="h-full w-full object-cover"
              />
            </div>

            <div className="flex min-w-0 flex-1 flex-col justify-between">
              <div>
                <div
                  data-studio-meta
                  className="mb-1 flex flex-wrap items-center gap-2"
                >
                  {showCategory && (
                    <span data-studio-category
                      style={{ color: "var(--theme-primary)" }}
                      className="text-[0.625rem] font-bold tracking-wider uppercase"
                    >
                      {item.categories[0]}
                    </span>
                  )}
                  {showDate && (
                    <>
                      <span style={{ color: "var(--theme-muted)" }}>•</span>
                      <time data-studio-meta
                        style={{ color: "var(--theme-muted)" }}
                        className="font-mono text-[0.6875rem]"
                      >
                        {formatDate(item.date, theme.locale)}
                      </time>
                    </>
                  )}
                </div>

                <Link href={getPostUrl(item.slug, theme)} className="block">
                  <h3 data-studio-title
                    style={{ color: "var(--theme-heading)" }}
                    className={`text-base leading-snug font-bold hover:underline sm:text-lg ${
                      isSerif ? "font-serif" : "font-sans"
                    }`}
                  >
                    {item.title}
                  </h3>
                </Link>

                {showExcerpt && excerptLength > 0 && (
                  <p data-studio-excerpt
                    style={{ color: "var(--theme-text)" }}
                    className="mt-1.5 line-clamp-2 text-xs leading-relaxed"
                  >
                    {getExcerpt(item, excerptLength)}
                  </p>
                )}
              </div>

              <div
                style={{ borderColor: "var(--theme-border)" }}
                data-studio-meta
                className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-2 text-xs"
              >
                {showAuthor && (
                  <span
                    style={{ color: "var(--theme-muted)" }}
                    className="font-medium"
                  >
                    {t("site.by", theme, "By")}{" "}
                    {theme.dict?.[item.authorName] || item.authorName}
                  </span>
                )}
                <Link
                  href={getPostUrl(item.slug, theme)}
                  style={{ color: "var(--theme-primary)" }}
                  className="text-xs font-semibold hover:underline"
                >
                  {t("site.read_story", theme, "Read Story")}{" "}
                  {theme.direction === "rtl" ? "←" : "→"}
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
