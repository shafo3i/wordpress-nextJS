"use client"
import Link from "next/link"
import { PostThumbnail } from "@/components/site/post-thumbnail"
import { ThemeSectionHeader } from "@/components/site/section-header"
import { formatDate, getExcerpt, getPostUrl } from "@/components/site/utils"
import type { ContentItem } from "@/lib/site-content"
import type { FrontEndThemeContext } from "@/lib/site-theme"
import type { HomepageBlock } from "@/lib/themes/homepage-types"
import styles from "./collection.module.css"
export function EditorialCollectionBlock({
  posts,
  block,
  theme,
}: {
  posts: ContentItem[]
  block: HomepageBlock
  theme: FrontEndThemeContext
}) {
  if (!posts.length) return null
  const headlines =
    block.displayStyle === "headlines_grid" ||
    (!block.displayStyle && block.type === "headlines_grid")
  const imageCount = headlines ? 5 : 7
  const capacity = headlines ? 9 : 7
  const groups = Array.from(
    { length: Math.ceil(posts.length / capacity) },
    (_, index) => posts.slice(index * capacity, (index + 1) * capacity)
  )
  return (
    <section
      className={styles.section}
      dir={theme.direction}
      data-editorial-collection={headlines ? "headlines" : "lead-grid"}
    >
      <ThemeSectionHeader
        title={block.title}
        subtitle={block.subtitle}
        linkText={block.linkText}
        linkHref={block.linkHref}
        theme={theme}
      />
      <div className={styles.groups} data-studio-items>
        {groups.map((group) => (
          <div
            key={group[0].id}
            className={`${styles.layout} ${headlines ? styles.headlines : ""}`}
          >
            {group.map((post, index) => (
              <article
                key={post.id}
                className={`${styles.card} ${index === 0 ? styles.lead : index < imageCount ? styles.secondary : styles.text}`}
                data-studio-card
              >
                {index < imageCount &&
                  post.imageUrl &&
                  block.imageRatio !== "none" && (
                    <Link
                      href={getPostUrl(post.slug, theme)}
                      className={styles.imageLink}
                      tabIndex={-1}
                      aria-hidden="true"
                    >
                      <PostThumbnail
                        post={post}
                        theme={theme}
                        src={post.imageUrl}
                        alt=""
                        className={styles.image}
                        data-studio-image
                      />
                    </Link>
                  )}
                <div className={styles.copy}>
                  <h3 data-studio-title>
                    <Link href={getPostUrl(post.slug, theme)}>
                      {post.title}
                    </Link>
                  </h3>
                  {index === 0 && block.showExcerpt !== false && (
                    <p className={styles.excerpt} data-studio-excerpt>
                      {getExcerpt(post, 180)}
                    </p>
                  )}
                  <div className={styles.meta} data-studio-meta>
                    {block.showCategory !== false && (
                      <span data-studio-category>{post.categories[0]}</span>
                    )}
                    {block.showDate !== false && (
                      <time dateTime={new Date(post.date).toISOString()}>
                        {formatDate(post.date, theme.locale, theme.timeZone)}
                      </time>
                    )}
                    {block.showAuthor && <span>{post.authorName}</span>}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}
