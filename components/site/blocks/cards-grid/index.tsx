"use client";

import Link from "next/link";
import type { ContentItem } from "@/lib/site-content";
import type { FrontEndThemeContext } from "@/lib/site-theme";
import { ThemeSectionHeader } from "@/components/site/section-header";
import { DEFAULT_THEME, formatDate, getExcerpt, isSerifHeading } from "@/components/site/utils";

/**
 * 6. MULTI-COLUMN STORY CARDS GRID (3 or 4 Columns)
 */
export function CardsGridBlock({
  posts,
  title,
  theme = DEFAULT_THEME,
  columns = 3,
  showExcerpt = true,
  showAuthor = true,
  showDate = true,
  showCategory = true,
}: {
  posts: ContentItem[];
  title: string;
  theme?: FrontEndThemeContext;
  columns?: 3 | 4;
  showExcerpt?: boolean;
  showAuthor?: boolean;
  showDate?: boolean;
  showCategory?: boolean;
}) {
  const isSerif = isSerifHeading(theme);

  if (!posts.length) return null;

  return (
    <section className="space-y-4">
      <ThemeSectionHeader
        title={title}
        subtitle={`${columns} Columns`}
        theme={theme}
      />

      <div className={`grid grid-cols-1 sm:grid-cols-2 ${columns === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"} gap-5`}>
        {posts.map((item) => (
          <article
            key={item.id}
            style={{
              backgroundColor: "var(--theme-surface, #ffffff)",
              borderColor: "var(--theme-border, #e2e8f0)",
            }}
            className="group rounded-2xl border transition-all overflow-hidden shadow-sm flex flex-col hover:border-[#2271b1] hover:shadow-md"
          >
            <div className="relative overflow-hidden w-full h-44 bg-slate-100 dark:bg-slate-800">
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>

            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                {showCategory && (
                  <span
                    style={{ color: "var(--theme-primary, #2271b1)" }}
                    className="text-[10px] font-bold uppercase tracking-wider block mb-1"
                  >
                    {item.categories[0]}
                  </span>
                )}
                <Link href={`/posts/${item.slug}`} className="block">
                  <h4
                    style={{ color: "var(--theme-heading, #0f172a)" }}
                    className={`font-bold leading-snug line-clamp-2 hover:underline text-sm ${
                      isSerif ? "font-serif" : "font-sans"
                    }`}
                  >
                    {item.title}
                  </h4>
                </Link>
                {showExcerpt && (
                  <p
                    style={{ color: "var(--theme-muted, #64748b)" }}
                    className="mt-1.5 text-xs line-clamp-2 leading-relaxed"
                  >
                    {getExcerpt(item, 100)}
                  </p>
                )}
              </div>

              <div
                style={{ borderColor: "var(--theme-border, #e2e8f0)" }}
                className="mt-3 flex items-center justify-between text-[10px] pt-2 border-t"
              >
                {showAuthor && (
                  <span style={{ color: "var(--theme-muted, #64748b)" }}>
                    {item.authorName}
                  </span>
                )}
                {showDate && (
                  <span
                    style={{ color: "var(--theme-muted, #94a3b8)" }}
                    className="font-mono"
                  >
                    {formatDate(item.date)}
                  </span>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
