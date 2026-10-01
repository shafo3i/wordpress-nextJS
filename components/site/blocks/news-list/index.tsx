"use client";

import Link from "next/link";
import type { ContentItem } from "@/lib/site-content";
import type { FrontEndThemeContext } from "@/lib/site-theme";
import { ThemeSectionHeader } from "@/components/site/section-header";
import { DEFAULT_THEME, formatDate, getExcerpt, isSerifHeading } from "@/components/site/utils";

/**
 * 5. NEWS LIST VIEW BLOCK (Supports Thumbnail Left OR Thumbnail Right)
 */
export function NewsListViewBlock({
  posts,
  title,
  theme = DEFAULT_THEME,
  thumbRight = false,
  showExcerpt = true,
  showAuthor = true,
  showDate = true,
  showCategory = true,
}: {
  posts: ContentItem[];
  title: string;
  theme?: FrontEndThemeContext;
  thumbRight?: boolean;
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
        subtitle="Chronological"
        theme={theme}
      />

      <div className="space-y-4">
        {posts.map((item) => (
          <article
            key={item.id}
            style={{
              backgroundColor: "var(--theme-surface, #ffffff)",
              borderColor: "var(--theme-border, #e2e8f0)",
            }}
            className={`rounded-2xl border p-4 sm:p-5 flex flex-col sm:flex-row gap-5 transition-all shadow-sm hover:border-[#2271b1] ${
              thumbRight ? "sm:flex-row-reverse" : ""
            }`}
          >
            <div className="w-full sm:w-48 h-36 sm:h-32 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-slate-800">
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1 min-w-0 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {showCategory && (
                    <span
                      style={{ color: "var(--theme-primary, #2271b1)" }}
                      className="text-[10px] font-bold uppercase tracking-wider"
                    >
                      {item.categories[0] || "News"}
                    </span>
                  )}
                  {showDate && (
                    <>
                      <span style={{ color: "var(--theme-muted, #94a3b8)" }}>•</span>
                      <time
                        style={{ color: "var(--theme-muted, #94a3b8)" }}
                        className="text-[11px] font-mono"
                      >
                        {formatDate(item.date)}
                      </time>
                    </>
                  )}
                </div>

                <Link href={`/posts/${item.slug}`} className="block">
                  <h3
                    style={{ color: "var(--theme-heading, #0f172a)" }}
                    className={`text-base sm:text-lg font-bold leading-snug hover:underline ${
                      isSerif ? "font-serif" : "font-sans"
                    }`}
                  >
                    {item.title}
                  </h3>
                </Link>

                {showExcerpt && (
                  <p
                    style={{ color: "var(--theme-text, #334155)" }}
                    className="mt-1.5 text-xs line-clamp-2 leading-relaxed"
                  >
                    {getExcerpt(item, 160)}
                  </p>
                )}
              </div>

              <div
                style={{ borderColor: "var(--theme-border, #e2e8f0)" }}
                className="mt-3 flex items-center justify-between text-xs pt-2 border-t"
              >
                {showAuthor && (
                  <span
                    style={{ color: "var(--theme-muted, #64748b)" }}
                    className="font-medium"
                  >
                    By {item.authorName}
                  </span>
                )}
                <Link
                  href={`/posts/${item.slug}`}
                  style={{ color: "var(--theme-primary, #2271b1)" }}
                  className="font-semibold text-xs hover:underline"
                >
                  Read Story →
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
