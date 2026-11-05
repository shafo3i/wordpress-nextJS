"use client";

import Link from "next/link";
import type { ContentItem } from "@/lib/site-content";
import type { FrontEndThemeContext } from "@/lib/site-theme";
import { ThemeSectionHeader } from "@/components/site/section-header";
import {
  DEFAULT_THEME,
  formatDate,
  getPostUrl,
  isSerifHeading,
} from "@/components/site/utils";

/**
 * COMPACT NUMBERED TOP-5 WIRE STRIP BLOCK
 */
export function CompactNumberedGridBlock({
  posts,
  title,
  theme = DEFAULT_THEME,
  showDate = true,
  showCategory = true,
  subtitle,
  linkText,
  linkHref,
}: {
  posts: ContentItem[];
  title: string;
  theme?: FrontEndThemeContext;
  showDate?: boolean;
  showCategory?: boolean;
  subtitle?: string;
  linkText?: string;
  linkHref?: string;
}) {
  const isSerif = isSerifHeading(theme);
  if (!posts.length) return null;

  const items = posts.slice(0, 5);

  return (
    <section className="space-y-4">
      <ThemeSectionHeader
        title={title}
        subtitle={subtitle}
        linkText={linkText}
        linkHref={linkHref}
        theme={theme}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {items.map((post, idx) => (
          <article
            key={post.id}
            className="group relative flex flex-col justify-between rounded-xl border border-theme-border bg-theme-surface p-3.5 hover:border-theme-primary transition-all shadow-2xs"
          >
            <div className="flex items-start gap-3">
              <span
                style={{ color: theme.primaryColor }}
                className="text-2xl font-black font-mono leading-none opacity-85 select-none"
              >
                0{idx + 1}
              </span>
              <div className="min-w-0 flex-1 space-y-1.5">
                {showCategory && post.categories[0] && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-theme-primary block truncate">
                    {post.categories[0]}
                  </span>
                )}
                <Link href={getPostUrl(post.slug, theme)}>
                  <h4
                    className={`text-xs sm:text-sm font-bold leading-snug line-clamp-3 text-theme-heading group-hover:text-theme-primary transition-colors ${
                      isSerif ? "font-serif" : "font-sans"
                    }`}
                  >
                    {post.title}
                  </h4>
                </Link>
              </div>
            </div>

            {showDate && (
              <div className="mt-3 pt-2 border-t border-theme-border/60 flex items-center justify-between text-[10px] font-mono text-theme-muted">
                <span>{post.authorName}</span>
                <span>{formatDate(post.date, theme.locale)}</span>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

