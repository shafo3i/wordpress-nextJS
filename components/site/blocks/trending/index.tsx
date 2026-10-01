"use client";

import Link from "next/link";
import { Flame } from "lucide-react";
import type { ContentItem } from "@/lib/site-content";
import type { FrontEndThemeContext } from "@/lib/site-theme";
import { DEFAULT_THEME, isSerifHeading, isDarkTheme } from "@/components/site/utils";

/**
 * 10. TRENDING LEADERBOARD (Ranked 01-05 Stories)
 */
export function TrendingBlock({
  posts,
  title,
  theme = DEFAULT_THEME,
  postCount = 5,
}: {
  posts: ContentItem[];
  title: string;
  theme?: FrontEndThemeContext;
  postCount?: number;
}) {
  const isDark = isDarkTheme(theme);
  const isSerif = isSerifHeading(theme);

  if (!posts.length) return null;

  const trendingItems = posts.slice(0, postCount);

  return (
    <section
      style={{
        backgroundColor: "var(--theme-surface, #ffffff)",
        borderColor: "var(--theme-border, #e2e8f0)",
      }}
      className="rounded-2xl border p-5 shadow-sm transition-all"
    >
      <div className="flex items-center gap-2 mb-4">
        <Flame
          style={{ color: "var(--theme-primary, #e11d48)" }}
          className="size-4"
        />
        <h3
          style={{ color: "var(--theme-heading, #0f172a)" }}
          className={`text-base font-bold uppercase tracking-wider ${isSerif ? "font-serif" : "font-sans"}`}
        >
          {title}
        </h3>
      </div>
      <div
        style={{ borderColor: "var(--theme-border, #e2e8f0)" }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-theme-border"
      >
        {trendingItems.map((item, idx) => (
          <div key={item.id} className="pt-3 sm:pt-0 sm:px-3 first:pl-0 last:pr-0">
            <span
              style={{ color: "var(--theme-primary, #2271b1)" }}
              className="font-mono text-xl font-black block leading-none mb-1.5"
            >
              0{idx + 1}
            </span>
            <Link href={`/posts/${item.slug}`} className="block hover:underline">
              <h4
                style={{ color: "var(--theme-heading, #0f172a)" }}
                className="text-xs font-bold leading-snug line-clamp-3"
              >
                {item.title}
              </h4>
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
