"use client"
import { ContentImage } from "@/components/site/content-image";


import Link from "next/link"
import styles from "./broadsheet.module.css"
import type { ContentItem } from "@/lib/site-content"
import type { FrontEndThemeContext } from "@/lib/site-theme"
import { ThemeSectionHeader } from "@/components/site/section-header"
import {
  DEFAULT_THEME,
  formatDate,
  getExcerpt,
  isSerifHeading,
  isDarkTheme,
  getPostUrl,
  getCategoryUrl,
  t,
} from "@/components/site/utils"

/**
 * 2. BROADSHEET 3-COLUMN WIRE BLOCK
 */
export function Broadsheet3ColBlock({
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
  showColumnHeaders = false,
  col1Title,
  col2Title,
  col3Title,
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
  showColumnHeaders?: boolean
  col1Title?: string
  col2Title?: string
  col3Title?: string
}) {
  const isDark = isDarkTheme(theme)
  const isSerif = isSerifHeading(theme)

  if (!posts.length) return null

  const centerIndex = Math.min(3, posts.length - 1)
  const col1Item = centerIndex > 0 ? posts[0] : undefined
  const col1Briefs = posts.slice(1, centerIndex)
  const centerFeature = posts[centerIndex]
  const wirePosts = posts.slice(centerIndex + 1)

  const displayCol1 = col1Title
    ? theme.dict?.[col1Title] || col1Title
    : showColumnHeaders
      ? theme.dict?.["site.column_1_regional"] || "Column I • Regional"
      : null
  const displayCol2 = col2Title
    ? theme.dict?.[col2Title] || col2Title
    : showColumnHeaders
      ? theme.dict?.["site.column_2_feature"] ||
        "Column II • Center Lead Feature"
      : null
  const displayCol3 = col3Title
    ? theme.dict?.[col3Title] || col3Title
    : showColumnHeaders
      ? theme.dict?.["site.column_3_wire"] || "Column III • News Wire"
      : null

  return (
    <section className={`${styles.section} space-y-4`}>
      <ThemeSectionHeader
        title={title}
        subtitle={subtitle}
        linkText={linkText}
        linkHref={
          linkHref || (linkText ? getCategoryUrl("all", theme) : undefined)
        }
        theme={theme}
      />

      <div
        style={{ borderColor: "var(--theme-border)" }}
        className={styles.columns}
        data-broadsheet-columns={col1Item ? (wirePosts.length ? 3 : 2) : 1}
      >
        {/* Column 1: Left Briefs & Vertical Story (3 cols) */}
        {col1Item && (
          <div className={`${styles.column} space-y-4`}>
            {displayCol1 && (
              <div
                style={{ borderColor: "var(--theme-border)" }}
                className="border-b pb-1"
              >
                <span
                  style={{ color: "var(--theme-muted)" }}
                  className="font-mono text-[0.625rem] font-bold tracking-widest uppercase"
                >
                  {displayCol1}
                </span>
              </div>
            )}

            {col1Item && (
              <div className="space-y-2">
                <div data-studio-image className={styles.image}>
                  <ContentImage
                    src={col1Item.imageUrl}
                    alt={col1Item.title}
                    className="h-full w-full object-cover"
                  />
                </div>
                {showCategory && col1Item.categories?.[0] && (
                  <span
                    data-studio-category
                    style={{ color: "var(--theme-primary)" }}
                    className="block text-[0.625rem] font-bold tracking-wider uppercase"
                  >
                    {col1Item.categories[0]}
                  </span>
                )}
                <Link href={getPostUrl(col1Item.slug, theme)} className="block">
                  <h4
                    data-studio-title
                    style={{ color: "var(--theme-heading)" }}
                    className={`text-sm leading-snug font-bold hover:underline ${isSerif ? "font-serif" : "font-sans"}`}
                  >
                    {col1Item.title}
                  </h4>
                </Link>
                {showExcerpt && (
                  <p
                    data-studio-excerpt
                    style={{ color: "var(--theme-muted)" }}
                    className="line-clamp-2 text-xs leading-relaxed"
                  >
                    {getExcerpt(col1Item, 90)}
                  </p>
                )}
              </div>
            )}

            {col1Briefs.length > 0 && (
              <div
                style={{ borderColor: "var(--theme-border)" }}
                className="space-y-3 border-t pt-3"
              >
                {col1Briefs.map((item) => (
                  <div key={item.id} className="space-y-1 text-xs">
                    {showDate && (
                      <span
                        style={{ color: "var(--theme-muted)" }}
                        className="block font-mono text-[0.625rem]"
                      >
                        {formatDate(item.date, theme.locale)}
                      </span>
                    )}
                    <Link
                      data-studio-title
                      href={getPostUrl(item.slug, theme)}
                      style={{ color: "var(--theme-heading)" }}
                      className="block font-semibold hover:underline"
                    >
                      {item.title}
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Column 2: Center Major Feature (6 cols) */}
        <div className={`${styles.column} ${styles.center} space-y-4`}>
          {displayCol2 && (
            <div
              style={{ borderColor: "var(--theme-border)" }}
              className="border-b pb-1"
            >
              <span
                style={{ color: "var(--theme-muted)" }}
                className="font-mono text-[0.625rem] font-bold tracking-widest uppercase"
              >
                {displayCol2}
              </span>
            </div>
          )}

          <div data-studio-image className={styles.featureImage}>
            <ContentImage
              src={centerFeature.imageUrl}
              alt={centerFeature.title}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {showCategory && centerFeature.categories?.[0] && (
                <span
                  data-studio-category
                  style={{ color: "var(--theme-primary)" }}
                  className="text-xs font-black tracking-wider uppercase"
                >
                  {centerFeature.categories[0]}
                </span>
              )}
              {showAuthor && (
                <>
                  <span style={{ color: "var(--theme-muted)" }}>•</span>
                  <span
                    style={{ color: "var(--theme-muted)" }}
                    className="font-mono text-xs"
                  >
                    {t("site.by", theme, "By")}{" "}
                    {theme.dict?.[centerFeature.authorName] ||
                      centerFeature.authorName}
                  </span>
                </>
              )}
            </div>

            <Link
              href={getPostUrl(centerFeature.slug, theme)}
              className="block"
            >
              <h3
                data-studio-title
                style={{ color: "var(--theme-heading)" }}
                className={`text-2xl leading-tight font-black tracking-tight hover:underline sm:text-3xl ${isSerif ? "font-serif" : "font-sans"}`}
              >
                {centerFeature.title}
              </h3>
            </Link>

            {showExcerpt && (
              <p
                data-studio-excerpt
                style={{ color: "var(--theme-text)" }}
                className="text-sm leading-relaxed"
              >
                {getExcerpt(centerFeature, 220)}
              </p>
            )}

            <div
              style={{ borderColor: "var(--theme-border)" }}
              className="flex items-center justify-between border-t pt-2 text-xs"
            >
              {showDate && (
                <span
                  style={{ color: "var(--theme-muted)" }}
                  className="font-mono"
                >
                  {formatDate(centerFeature.date, theme.locale)}
                </span>
              )}
              {linkText && (
                <Link
                  href={getPostUrl(centerFeature.slug, theme)}
                  style={{ color: "var(--theme-primary)" }}
                  className="font-bold hover:underline"
                >
                  {linkText} {theme.direction === "rtl" ? "←" : "→"}
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Column 3: The Wire Desk (3 cols) */}
        {wirePosts.length > 0 && (
          <div className={`${styles.column} space-y-4`}>
            {displayCol3 && (
              <div
                style={{ borderColor: "var(--theme-border)" }}
                className="flex items-center justify-between border-b pb-1"
              >
                <span
                  style={{ color: "var(--theme-muted)" }}
                  className="font-mono text-[0.625rem] font-bold tracking-widest uppercase"
                >
                  {displayCol3}
                </span>
                <span
                  style={{ backgroundColor: "var(--theme-primary)" }}
                  className="size-2 animate-ping rounded-full"
                />
              </div>
            )}

            <div className={styles.wire} data-studio-items>
              {wirePosts.map((item) => (
                <article
                  key={item.id}
                  style={{ borderColor: "var(--theme-border)" }}
                  className="border-b pb-3 last:border-b-0"
                >
                  {showDate && (
                    <time
                      data-studio-meta
                      dateTime={new Date(item.date).toISOString()}
                    >
                      {formatDate(item.date, theme.locale)}
                    </time>
                  )}
                  <Link href={getPostUrl(item.slug, theme)} className="block">
                    <h4
                      data-studio-title
                      style={{ color: "var(--theme-heading)" }}
                      className={`text-xs leading-snug font-bold hover:underline ${isSerif ? "font-serif" : "font-sans"}`}
                    >
                      {item.title}
                    </h4>
                  </Link>
                  {showAuthor && (
                    <span
                      style={{ color: "var(--theme-muted)" }}
                      className="mt-1 block text-[0.625rem]"
                    >
                      {t("site.reported_by", theme, "Reported by")}{" "}
                      {theme.dict?.[item.authorName] || item.authorName}
                    </span>
                  )}
                </article>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
