"use client";

import Link from "next/link";
import type { ContentItem } from "@/lib/site-content";
import type { FrontEndThemeContext } from "@/lib/site-theme";
import { ThemeSectionHeader } from "@/components/site/section-header";
import {
  DEFAULT_THEME,
  formatDate,
  getExcerpt,
  getPostUrl,
  isSerifHeading,
} from "@/components/site/utils";

/**
 * DUAL CATEGORY / TWO-COLUMN EDITORIAL SPLIT BLOCK
 */
export function DualCategoryColumnsBlock({
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
  col1Title,
  col2Title,
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
  col1Title?: string;
  col2Title?: string;
}) {
  const isSerif = isSerifHeading(theme);
  if (!posts.length) return null;

  const half = Math.max(1, Math.ceil(posts.length / 2));
  const leftPosts = posts.slice(0, half);
  const rightPosts = posts.slice(half, half * 2);

  const renderColumn = (items: ContentItem[], headerTitle?: string) => {
    if (!items.length) return null;
    const lead = items[0];
    const rest = items.slice(1, 4);

    return (
      <div className="space-y-4 rounded-xl border border-theme-border bg-theme-surface p-4 sm:p-5">
        {headerTitle && (
          <div className="border-b-2 border-theme-primary pb-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-theme-heading">
              {headerTitle}
            </h4>
          </div>
        )}

        {/* Lead Card */}
        <article className="space-y-3">
          <Link
            href={getPostUrl(lead.slug, theme)}
            className="block relative aspect-16/10 rounded-lg overflow-hidden bg-theme-border/40 group"
          >
            <img
              src={lead.imageUrl}
              alt={lead.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {showCategory && lead.categories[0] && (
              <span
                style={{ backgroundColor: theme.primaryColor }}
                className="absolute top-3 start-3 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
              >
                {lead.categories[0]}
              </span>
            )}
          </Link>

          <div className="space-y-1.5">
            <Link href={getPostUrl(lead.slug, theme)}>
              <h3
                className={`text-lg sm:text-xl font-extrabold leading-snug text-theme-heading hover:text-theme-primary transition-colors ${
                  isSerif ? "font-serif" : "font-sans"
                }`}
              >
                {lead.title}
              </h3>
            </Link>

            {(showAuthor || showDate) && (
              <div className="flex items-center gap-2 text-[11px] text-theme-muted">
                {showAuthor && <span className="font-semibold">{lead.authorName}</span>}
                {showDate && <span>• {formatDate(lead.date, theme.locale)}</span>}
              </div>
            )}

            {showExcerpt && (
              <p className="text-xs text-theme-text line-clamp-2 leading-relaxed">
                {getExcerpt(lead, 130)}
              </p>
            )}
          </div>
        </article>

        {/* Sub-list */}
        {rest.length > 0 && (
          <div className="divide-y divide-theme-border border-t border-theme-border pt-2">
            {rest.map((item) => (
              <div key={item.id} className="py-2.5 flex items-center gap-3">
                <Link
                  href={getPostUrl(item.slug, theme)}
                  className="w-16 h-12 rounded overflow-hidden shrink-0 bg-theme-border/40"
                >
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={getPostUrl(item.slug, theme)}>
                    <h5
                      className={`text-xs sm:text-sm font-bold leading-snug line-clamp-2 text-theme-heading hover:text-theme-primary ${
                        isSerif ? "font-serif" : "font-sans"
                      }`}
                    >
                      {item.title}
                    </h5>
                  </Link>
                  {showDate && (
                    <span className="text-[10px] font-mono text-theme-muted block mt-0.5">
                      {formatDate(item.date, theme.locale)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="space-y-4">
      <ThemeSectionHeader
        title={title}
        subtitle={subtitle}
        linkText={linkText}
        linkHref={linkHref}
        theme={theme}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {renderColumn(leftPosts, col1Title)}
        {renderColumn(rightPosts.length ? rightPosts : leftPosts, col2Title)}
      </div>
    </section>
  );
}

