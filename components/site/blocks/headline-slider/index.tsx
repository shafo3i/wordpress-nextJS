"use client"

import Link from "next/link"
import { ChevronLeft, ChevronRight, Clock, Pause, Play } from "lucide-react"
import type { ContentItem } from "@/lib/site-content"
import type { FrontEndThemeContext } from "@/lib/site-theme"
import { formatDate, getPostUrl, t } from "@/components/site/utils"
import { useNewsRotation } from "../use-news-rotation"
import styles from "./slider.module.css"

export function HeadlineSliderBlock({
  posts,
  title,
  theme,
  showCategory = true,
  showDate = true,
  showAuthor = false,
  showExcerpt = false,
  autoplay = true,
  interval = 5500,
}: {
  posts: ContentItem[]
  title: string
  theme: FrontEndThemeContext
  showCategory?: boolean
  showDate?: boolean
  showAuthor?: boolean
  showExcerpt?: boolean
  autoplay?: boolean
  interval?: number
}) {
  const rotation = useNewsRotation(posts.length, autoplay, interval)
  if (!posts.length) return null
  const current = posts[rotation.index]
  const rtl = theme.direction === "rtl"
  return (
    <section
      className={styles.slider}
      dir={theme.direction}
      aria-label={title || t("site.headline_slider", theme)}
      aria-roledescription={t("site.carousel", theme)}
      {...rotation.interactionProps}
    >
      {posts.map(
        (post, index) =>
          post.imageUrl && (
            <img
              key={post.id}
              className={styles.image}
              data-active={index === rotation.index}
              src={post.imageUrl}
              loading={index === rotation.index ? "eager" : "lazy"}
              alt=""
            />
          )
      )}
      <div className={styles.shade} />
      <div key={current.id} className={styles.story}>
        <div>
          {showCategory && current.categories[0] && (
            <p className={styles.category}>{current.categories[0]}</p>
          )}
          <Link
            href={getPostUrl(current.slug, theme)}
            className={styles.headline}
          >
            <h2>{current.title}</h2>
          </Link>
          {showExcerpt && current.excerpt && (
            <p className={styles.excerpt}>{current.excerpt}</p>
          )}
        </div>
        <div className={styles.meta}>
          {showDate && (
            <time dateTime={new Date(current.date).toISOString()}>
              <Clock size={20} aria-hidden="true" />
              {formatDate(current.date, theme.locale)}
            </time>
          )}
          {showAuthor && current.authorName && (
            <span>{current.authorName}</span>
          )}
        </div>
      </div>
      <div
        className={styles.queue}
        role="group"
        aria-label={t("site.choose_story", theme)}
      >
        {posts.map((post, index) => (
          <button
            key={post.id}
            type="button"
            onClick={() => rotation.select(index)}
            aria-pressed={index === rotation.index}
            className={styles.queueItem}
          >
            {showCategory && post.categories[0] && (
              <span>{post.categories[0]}</span>
            )}
            <strong>{post.title}</strong>
          </button>
        ))}
      </div>
      {posts.length > 1 && (
        <div className={styles.controls}>
          <button
            type="button"
            onClick={rotation.previous}
            aria-label={t("site.previous_story", theme)}
          >
            {rtl ? <ChevronRight /> : <ChevronLeft />}
          </button>
          {rotation.canAutoplay && (
            <button
              type="button"
              onClick={rotation.togglePause}
              aria-label={t(
                rotation.paused ? "site.play_stories" : "site.pause_stories",
                theme
              )}
            >
              {rotation.paused ? <Play /> : <Pause />}
            </button>
          )}
          <button
            type="button"
            onClick={rotation.next}
            aria-label={t("site.next_story", theme)}
          >
            {rtl ? <ChevronLeft /> : <ChevronRight />}
          </button>
        </div>
      )}
    </section>
  )
}
