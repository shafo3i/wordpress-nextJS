"use client"
import { PostThumbnail } from "@/components/site/post-thumbnail"

import { useState } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
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
 * 3. HERO CAROUSEL WITH INTERACTIVE FILMSTRIP
 */
export function HeroSliderBlock({
  posts,
  title,
  theme = DEFAULT_THEME,
  showExcerpt = true,
  showCategory = true,
  subtitle,
  linkText,
  linkHref,
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
}) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const isSerif = isSerifHeading(theme)

  if (!posts.length) return null

  const slides = posts.slice(0, 4)
  const current = slides[currentIndex] || slides[0]

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1))
  }

  return (
    <section className="space-y-3">
      <ThemeSectionHeader
        title={title}
        subtitle={subtitle}
        linkText={linkText}
        linkHref={linkHref}
        theme={theme}
      />

      <div
        data-studio-card
        className="group relative flex min-h-[380px] flex-col justify-end overflow-hidden rounded-2xl p-6 text-theme-overlay shadow-xl sm:min-h-[460px] sm:p-10"
      >
        <PostThumbnail
          post={current}
          theme={theme}
          src={current.imageUrl}
          alt={current.title}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-theme-scrim via-theme-scrim/50 to-transparent" />

        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="flex items-center gap-2">
            {showCategory && (
              <span
                data-studio-category
                style={{ backgroundColor: theme.primaryColor }}
                className="rounded-full px-3 py-0.5 text-[0.625rem] font-bold tracking-wider text-theme-on-primary uppercase"
              >
                {current.categories[0] ||
                  t("site.spotlight", theme, "Spotlight")}
              </span>
            )}
            <span className="font-mono text-xs text-theme-overlay-muted">
              {formatDate(current.date, theme.locale, theme.timeZone)}
            </span>
          </div>

          <Link href={getPostUrl(current.slug, theme)} className="block">
            <h3
              data-studio-title
              className={`text-2xl leading-tight font-black tracking-tight text-theme-overlay hover:underline sm:text-4xl ${
                isSerif ? "font-serif" : "font-sans"
              }`}
            >
              {current.title}
            </h3>
          </Link>

          {showExcerpt && (
            <p
              data-studio-excerpt
              className="line-clamp-2 text-xs leading-relaxed text-theme-overlay-muted sm:text-sm"
            >
              {getExcerpt(current, 170)}
            </p>
          )}
        </div>

        <div className="absolute top-6 right-6 z-20 flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrev}
            className="flex size-9 items-center justify-center rounded-full border border-theme-overlay/20 bg-theme-scrim/40 text-theme-overlay backdrop-blur-sm transition-colors hover:bg-theme-scrim/70"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="flex size-9 items-center justify-center rounded-full border border-theme-overlay/20 bg-theme-scrim/40 text-theme-overlay backdrop-blur-sm transition-colors hover:bg-theme-scrim/70"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-1 sm:grid-cols-4">
        {slides.map((item, idx) => {
          const isActive = currentIndex === idx
          return (
            <button data-studio-card
              key={item.id}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              className={`flex items-center gap-3 rounded-xl border p-2.5 text-left transition-all ${
                isActive
                  ? "border-theme-primary bg-theme-surface ring-2 ring-theme-primary"
                  : "border-theme-border bg-theme-surface opacity-70 hover:opacity-100"
              }`}
            >
              <div
                data-studio-image
                className="h-11 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-theme-border/60"
              >
                <PostThumbnail
                  post={item}
                  theme={theme}
                  src={item.imageUrl}
                  alt={item.title}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h5
                  data-studio-title
                  className="truncate text-[0.6875rem] leading-tight font-bold text-theme-heading"
                >
                  {item.title}
                </h5>
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}
