"use client"

import Link from "next/link"
import { useEffect, useRef, useState, type CSSProperties } from "react"
import styles from "./ticker.module.css"
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react"
import type { ContentItem } from "@/lib/site-content"
import type { FrontEndThemeContext } from "@/lib/site-theme"
import {
  DEFAULT_THEME,
  formatDate,
  getPostUrl,
  t,
} from "@/components/site/utils"
import { useNewsRotation } from "../use-news-rotation"

export function BreakingTickerBlock({
  posts,
  title,
  theme = DEFAULT_THEME,
  showDate = true,
  showCategory = false,
  autoplay = true,
  interval = 4500,
}: {
  posts: ContentItem[]
  title: string
  theme?: FrontEndThemeContext
  showDate?: boolean
  showCategory?: boolean
  autoplay?: boolean
  interval?: number
}) {
  const rotation = useNewsRotation(posts.length, autoplay, interval, false)
  const viewportRef = useRef<HTMLDivElement>(null)
  const sequenceRef = useRef<HTMLDivElement>(null)
  const [geometry, setGeometry] = useState({ repeats: 1, width: 0 })
  const contentKey = posts.map((post) => `${post.id}:${post.title}`).join("|")
  useEffect(() => {
    const viewport = viewportRef.current
    const sequence = sequenceRef.current
    if (!viewport || !sequence) return
    const measure = () => {
      const width = sequence.getBoundingClientRect().width
      if (width > 0)
        setGeometry({
          repeats: Math.ceil(viewport.clientWidth / width) + 1,
          width,
        })
    }
    const observer = new ResizeObserver(measure)
    observer.observe(viewport)
    observer.observe(sequence)
    measure()
    return () => observer.disconnect()
  }, [contentKey, showDate, showCategory, theme.locale, rotation.index])
  if (!posts.length) return null
  const orderedPosts = [
    ...posts.slice(rotation.index),
    ...posts.slice(0, rotation.index),
  ]
  const rtl = theme.direction === "rtl"
  const buttonClass = styles.control
  return (
    <section
      dir={theme.direction}
      aria-label={title || t("site.breaking", theme)}
      className={styles.ticker}
    >
      <span className={styles.label}>{title || t("site.breaking", theme)}</span>
      <div ref={viewportRef} className={styles.viewport}>
        <div
          key={orderedPosts.map((post) => post.id).join(",")}
          className={styles.track}
          data-direction={rtl ? "rtl" : "ltr"}
          data-static={!rotation.canAutoplay}
          data-paused={rotation.paused}
          style={
            {
              "--ticker-duration":
                Math.max(
                  1,
                  (geometry.width * geometry.repeats) / (270000 / interval)
                ) + "s",
            } as CSSProperties
          }
        >
          {[false, true].map((duplicate) => (
            <div
              key={String(duplicate)}
              className={styles.group}
              dir={theme.direction}
              aria-hidden={duplicate || undefined}
            >
              {Array.from({ length: geometry.repeats }, (_, repeat) => (
                <div
                  key={repeat}
                  ref={!duplicate && repeat === 0 ? sequenceRef : undefined}
                  className={styles.sequence}
                  dir={theme.direction}
                  aria-hidden={duplicate || repeat > 0 || undefined}
                >
                  {orderedPosts.map((post) => (
                    <div key={post.id} className={styles.item}>
                      {showDate && (
                        <time data-studio-meta
                          className={`${styles.meta} hidden sm:inline`}
                          dateTime={new Date(post.date).toISOString()}
                        >
                          {formatDate(post.date, theme.locale)}
                        </time>
                      )}
                      {showCategory && post.categories[0] && (
                        <span data-studio-category
                          className={`${styles.meta} hidden uppercase md:inline`}
                        >
                          {post.categories[0]}
                        </span>
                      )}
                      <Link
                        href={getPostUrl(post.slug, theme)}
                        tabIndex={duplicate || repeat > 0 ? -1 : undefined}
                        className={styles.link}
                      >
                        {post.title}
                      </Link>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      {posts.length > 1 && (
        <div className="flex gap-1">
          <button
            className={buttonClass}
            type="button"
            onClick={rotation.previous}
            aria-label={t("site.previous_story", theme)}
          >
            {rtl ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
          {rotation.canAutoplay && (
            <button
              className={buttonClass}
              type="button"
              onClick={rotation.togglePause}
              aria-label={t(
                rotation.paused ? "site.play_stories" : "site.pause_stories",
                theme
              )}
            >
              {rotation.paused ? <Play size={12} /> : <Pause size={12} />}
            </button>
          )}
          <button
            className={buttonClass}
            type="button"
            onClick={rotation.next}
            aria-label={t("site.next_story", theme)}
          >
            {rtl ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
          </button>
        </div>
      )}
    </section>
  )
}
