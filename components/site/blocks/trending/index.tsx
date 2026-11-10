"use client"

import Link from "next/link"
import { Flame } from "lucide-react"
import type { ContentItem } from "@/lib/site-content"
import type { FrontEndThemeContext } from "@/lib/site-theme"
import {
  DEFAULT_THEME,
  isSerifHeading,
  getPostUrl,
} from "@/components/site/utils"

/**
 * 10. TRENDING LEADERBOARD (Ranked 01-05 Stories)
 */
export function TrendingBlock({
  posts,
  title,
  theme = DEFAULT_THEME,
  postCount = 5,
}: {
  posts: ContentItem[]
  title: string
  theme?: FrontEndThemeContext
  postCount?: number
}) {
  const isSerif = isSerifHeading(theme)

  if (!posts.length) return null

  const trendingItems = posts.slice(0, postCount)

  return (
    <section data-studio-card
      style={{
        backgroundColor: "var(--theme-surface)",
        borderColor: "var(--theme-border)",
      }}
      className="theme-card rounded-2xl border p-5 transition-all"
    >
      <div className="mb-4 flex items-center gap-2">
        <Flame style={{ color: "var(--theme-primary)" }} className="size-4" />
        <h3
          style={{ color: "var(--theme-heading)" }}
          className={`text-base font-bold tracking-wider uppercase ${isSerif ? "font-serif" : "font-sans"}`}
        >
          {title}
        </h3>
      </div>
      <div data-studio-divider="children"
        style={{ borderColor: "var(--theme-border)" }}
        className="grid grid-cols-1 gap-4 divide-y divide-theme-border sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-5"
      >
        {trendingItems.map((item) => (
          <div
            key={item.id}
            className="pt-3 first:pl-0 last:pr-0 sm:px-3 sm:pt-0"
          >
            <Link
              href={getPostUrl(item.slug, theme)}
              className="block hover:underline"
            >
              <h4
                data-studio-title
                style={{ color: "var(--theme-heading)" }}
                className="line-clamp-3 text-xs leading-snug font-bold"
              >
                {item.title}
              </h4>
            </Link>
          </div>
        ))}
      </div>
    </section>
  )
}
