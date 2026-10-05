"use client";

import Link from "next/link";
import type { ContentItem } from "@/lib/site-content";
import type { FrontEndThemeContext } from "@/lib/site-theme";
import { ThemeSectionHeader } from "@/components/site/section-header";
import { DEFAULT_THEME, formatDate, getExcerpt, isSerifHeading, getPostUrl, t } from "@/components/site/utils";

/**
 * 8. MINIMAL TEXT BROADSHEET WIRE (Text Only Wire)
 */
export function MinimalTextWireBlock({
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
}: {
  posts: ContentItem[];
  title: string;
  theme?: FrontEndThemeContext;
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

      <div className="divide-y divide-theme-border">
        {posts.map((item) => (
          <article key={item.id} className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {showCategory && (
                  <span className="text-[0.625rem] font-bold uppercase tracking-wider text-theme-muted font-mono">
                    [{item.categories[0]}]
                  </span>
                )}
                <Link href={getPostUrl(item.slug, theme)} className="hover:underline">
                  <h4 className={`text-sm font-bold text-theme-heading ${isSerif ? "font-serif" : "font-sans"}`}>
                    {item.title}
                  </h4>
                </Link>
              </div>
              {showExcerpt && (
                <p className="text-xs text-theme-muted">
                  {getExcerpt(item, 140)}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3 text-[0.6875rem] text-theme-muted font-mono flex-shrink-0">
              {showAuthor && <span>{theme.dict?.[item.authorName] || item.authorName}</span>}
              {showDate && <span>{formatDate(item.date, theme.locale)}</span>}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
