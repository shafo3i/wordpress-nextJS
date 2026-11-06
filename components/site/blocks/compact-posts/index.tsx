"use client"
import Link from "next/link"
import type { ContentItem } from "@/lib/site-content"
import type { FrontEndThemeContext } from "@/lib/site-theme"
import type { HomepageBlock } from "@/lib/themes/homepage-types"
import type { StudioDesign } from "@/db/schema/cms-studio-design"
import { ThemeSectionHeader } from "@/components/site/section-header"
import { formatDate, getExcerpt, getPostUrl } from "@/components/site/utils"
import styles from "./posts.module.css"

export function CompactPostsBlock({
  posts,
  block,
  theme,
  design,
}: {
  posts: ContentItem[]
  block: HomepageBlock
  theme: FrontEndThemeContext
  design?: StudioDesign
}) {
  return (
    <section className={styles.feed}>
      <ThemeSectionHeader
        title={block.title}
        subtitle={block.subtitle}
        theme={theme}
      />
      <div className={styles.items}>
        {posts.map((post, index) => (
          <article
            className={`${styles.item} ${design?.thumbnailPosition === "end" ? styles.reverse : ""}`}
            key={post.id}
          >
            {post.imageUrl && block.imageRatio !== "none" && (
              <Link
                data-studio-image
                className={styles.thumbnail}
                style={{
                  aspectRatio:
                    block.imageRatio === "portrait"
                      ? "3 / 4"
                      : block.imageRatio === "landscape"
                        ? "4 / 3"
                        : "1",
                }}
                href={getPostUrl(post.slug, theme)}
                tabIndex={-1}
                aria-hidden="true"
              >
                <img src={post.imageUrl} alt="" loading="lazy" />
              </Link>
            )}
            <div className={styles.copy}>
              {block.type === "popular_posts" && (
                <span className={styles.rank}>
                  {String(index + 1).padStart(2, "0")}
                </span>
              )}
              {block.showCategory !== false && post.categories[0] && (
                <span data-studio-category className={styles.category} data-studio-meta>
                  {post.categories[0]}
                </span>
              )}
              <h3 className={styles.title} data-studio-title>
                <Link href={getPostUrl(post.slug, theme)}>{post.title}</Link>
              </h3>
              {block.showExcerpt && (design?.excerptLength ?? 100) > 0 && (
                <p data-studio-excerpt className={styles.excerpt}>
                  {getExcerpt(post, design?.excerptLength ?? 100)}
                </p>
              )}
              <div className={styles.meta} data-studio-meta>
                {block.showDate !== false && (
                  <time data-studio-meta dateTime={new Date(post.date).toISOString()}>
                    {formatDate(post.date, theme.locale)}
                  </time>
                )}
                {block.showAuthor && post.authorName && (
                  <span>
                    {theme.dict?.[post.authorName] || post.authorName}
                  </span>
                )}
                {block.type === "popular_posts" &&
                  post.commentCount !== undefined && (
                    <span>
                      {post.commentCount} {theme.dict?.["site.comments"] || ""}
                    </span>
                  )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
