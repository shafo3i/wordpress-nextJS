"use client";

import Link from "next/link";
import type { ContentItem } from "@/lib/site-content";
import type { FrontEndThemeContext } from "@/lib/site-theme";
import { ThemeSectionHeader } from "@/components/site/section-header";
import { DEFAULT_THEME, formatDate, getExcerpt, isSerifHeading, getPostUrl } from "@/components/site/utils";

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
  subtitle,
  linkText,
  linkHref,
}: {
  posts: ContentItem[];
  title: string;
  theme?: FrontEndThemeContext;
  columns?: 3 | 4;
  showExcerpt?: boolean;
  showAuthor?: boolean;
  showDate?: boolean;
  showCategory?: boolean;
  subtitle?: string;
  linkText?: string;
  linkHref?: string;
}) {
  const isSerif = isSerifHeading(theme);

  if (!posts.length) return null;

  return (
    <section className="space-y-4">
      <ThemeSectionHeader
        title={title}
        subtitle={subtitle}
        linkText={linkText}
        linkHref={linkHref}
        theme={theme}
      />

      <div className={`grid grid-cols-1 sm:grid-cols-2 ${columns === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"} gap-5`}>
        {posts.map((item) => (
          <article
            key={item.id}
            style={{
              backgroundColor: "var(--theme-surface)",
              borderColor: "var(--theme-border)",
            }}
            className="group rounded-2xl border transition-all overflow-hidden theme-card flex flex-col hover:border-theme-primary"
          >
            <div className="relative overflow-hidden w-full h-44 bg-theme-border/40">
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
                    style={{ color: "var(--theme-primary)" }}
                    className="text-[0.625rem] font-bold uppercase tracking-wider block mb-1"
                  >
                    {item.categories[0]}
                  </span>
                )}
                <Link href={getPostUrl(item.slug, theme)} className="block">
                  <h4
                    style={{ color: "var(--theme-heading)" }}
                    className={`font-bold leading-snug line-clamp-2 hover:underline text-sm ${
                      isSerif ? "font-serif" : "font-sans"
                    }`}
                  >
                    {item.title}
                  </h4>
                </Link>
                {showExcerpt && (
                  <p
                    style={{ color: "var(--theme-muted)" }}
                    className="mt-1.5 text-xs line-clamp-2 leading-relaxed"
                  >
                    {getExcerpt(item, 100)}
                  </p>
                )}
              </div>

              <div
                style={{ borderColor: "var(--theme-border)" }}
                className="mt-3 flex items-center justify-between text-[0.625rem] pt-2 border-t"
              >
                {showAuthor && (
                  <span style={{ color: "var(--theme-muted)" }}>
                    {theme.dict?.[item.authorName] || item.authorName}
                  </span>
                )}
                {showDate && (
                  <span
                    style={{ color: "var(--theme-muted)" }}
                    className="font-mono"
                  >
                    {formatDate(item.date, theme.locale)}
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
