"use client"
import Link from "next/link"
import type { ContentItem } from "@/lib/site-content"
import type { FrontEndThemeContext } from "@/lib/site-theme"
import { PostThumbnail } from "@/components/site/post-thumbnail"
import { ThemeSectionHeader } from "@/components/site/section-header"
import {
  DEFAULT_THEME,
  formatDate,
  getExcerpt,
  getPostUrl,
} from "@/components/site/utils"
import { useNewsRotation } from "../use-news-rotation"
import styles from "./slider.module.css"
export function FeaturedHeroSliderBlock({
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
  autoplay = true,
  interval = 5500,
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
  autoplay?: boolean
  interval?: number
}) {
  const rotation = useNewsRotation(posts.length, autoplay, interval)
  if (!posts.length) return null
  return (
    <section
      className={styles.section}
      dir={theme.direction}
      {...rotation.interactionProps}
      data-featured-queue
    >
      <ThemeSectionHeader
        title={title}
        subtitle={subtitle}
        linkText={linkText}
        linkHref={linkHref}
        theme={theme}
      />
      <div className={styles.layout}>
        <div className={styles.stage} data-studio-card>
          {posts.map((post, index) => (
            <article
              key={post.id}
              className={styles.slide}
              data-active={index === rotation.index}
              aria-hidden={index !== rotation.index}
              inert={index !== rotation.index}
            >
              <PostThumbnail
                post={post}
                theme={theme}
                src={post.imageUrl}
                alt={post.title}
                className={styles.image}
              />
              <div className={styles.scrim} />
              <div className={styles.copy}>
                <div className={styles.meta} data-studio-meta>
                  {showCategory && (
                    <span data-studio-category>{post.categories[0]}</span>
                  )}
                  {showAuthor && <span>{post.authorName}</span>}
                  {showDate && (
                    <time dateTime={new Date(post.date).toISOString()}>
                      {formatDate(post.date, theme.locale, theme.timeZone)}
                    </time>
                  )}
                </div>
                <Link href={getPostUrl(post.slug, theme)}>
                  <h3 data-studio-title>{post.title}</h3>
                </Link>
                {showExcerpt && (
                  <p data-studio-excerpt>{getExcerpt(post, 185)}</p>
                )}
              </div>
            </article>
          ))}
          {posts.length > 1 && (
            <div className={styles.controls}>
              <button
                type="button"
                aria-label={theme.dict?.["site.previous_story"]}
                onClick={rotation.previous}
              >
                &#8249;
              </button>
              {rotation.canAutoplay && (
                <button
                  type="button"
                  aria-label={
                    theme.dict?.[
                      rotation.paused
                        ? "site.play_stories"
                        : "site.pause_stories"
                    ]
                  }
                  onClick={rotation.togglePause}
                >
                  {rotation.paused ? "\u25b6" : "\u2161"}
                </button>
              )}
              <button
                type="button"
                aria-label={theme.dict?.["site.next_story"]}
                onClick={rotation.next}
              >
                &#8250;
              </button>
            </div>
          )}
        </div>
        <div className={styles.queue} data-studio-card>
          <div className={styles.queueHeading}>
            {theme.dict?.["site.featured_queue"]}
          </div>
          {posts.map((post, index) => (
            <button
              type="button"
              key={post.id}
              className={styles.queueItem}
              aria-pressed={index === rotation.index}
              onClick={() => rotation.select(index)}
            >
              <PostThumbnail
                post={post}
                theme={theme}
                src={post.imageUrl}
                alt=""
                className={styles.thumbnail}
                data-studio-image
              />
              <span>
                {showCategory && (
                  <small data-studio-category>{post.categories[0]}</small>
                )}
                <span data-studio-title>{post.title}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
