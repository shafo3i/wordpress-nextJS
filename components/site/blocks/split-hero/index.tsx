"use client";
import { PostThumbnail } from "@/components/site/post-thumbnail";


import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
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
 * SPLIT 50/50 EDITORIAL COVER STORY BLOCK
 */
export function SplitHeroFeatureBlock({
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

  const lead = posts[0];
  const secondary = posts.slice(1, 4);

  return (
    <section className="space-y-4">
      <ThemeSectionHeader
        title={title}
        subtitle={subtitle}
        linkText={linkText}
        linkHref={linkHref}
        theme={theme}
      />

      <div data-studio-card className="grid grid-cols-1 lg:grid-cols-12 rounded-2xl overflow-hidden border border-theme-border bg-theme-surface shadow-md">
        {/* Left/Start 6 Cols: Editorial Cover Image */}
        <Link
          href={getPostUrl(lead.slug, theme)}
          className="lg:col-span-7 relative min-h-[280px] sm:min-h-[380px] overflow-hidden group block"
        >
          <PostThumbnail post={lead} theme={theme}
            src={lead.imageUrl}
            alt={lead.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          {lead.isFeatured && (
            <span className="absolute top-4 start-4 inline-flex items-center gap-1 rounded-full bg-amber-400 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-950 shadow">
              <Star className="size-3 fill-current" />
              <span>{theme.direction === "rtl" ? "مميز" : "Featured"}</span>
            </span>
          )}
        </Link>

        {/* Right/End 5 Cols: Editorial Typography Panel */}
        <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between space-y-5">
          <div className="space-y-3.5">
            {showCategory && lead.categories[0] && (
              <span data-studio-category
                style={{ backgroundColor: theme.primaryColor }}
                className="inline-block rounded px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white"
              >
                {lead.categories[0]}
              </span>
            )}

            <Link href={getPostUrl(lead.slug, theme)} className="block">
              <h3 data-studio-title
                className={`text-2xl sm:text-3xl font-black leading-tight text-theme-heading hover:text-theme-primary transition-colors ${
                  isSerif ? "font-serif" : "font-sans"
                }`}
              >
                {lead.title}
              </h3>
            </Link>

            {showExcerpt && (
              <p data-studio-excerpt className="text-xs sm:text-sm text-theme-text leading-relaxed line-clamp-3">
                {getExcerpt(lead, 200)}
              </p>
            )}
          </div>

          <div data-studio-divider="top" className="space-y-4 pt-3 border-t border-theme-border">
            <div className="flex items-center justify-between text-xs text-theme-muted">
              {showAuthor && (
                <span className="font-bold text-theme-heading">{lead.authorName}</span>
              )}
              {showDate && (
                <span className="font-mono">{formatDate(lead.date, theme.locale, theme.timeZone)}</span>
              )}
            </div>

            <Link
              href={getPostUrl(lead.slug, theme)}
              style={{ backgroundColor: theme.primaryColor }}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold text-white hover:opacity-90 transition-opacity"
            >
              <span>
                {theme.direction === "rtl" ? "اقرأ القصة الكاملة" : "Read Full Story"}
              </span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Sub-strip of 3 companion stories */}
      {secondary.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {secondary.map((item) => (
            <Link data-studio-card
              key={item.id}
              href={getPostUrl(item.slug, theme)}
              className="flex items-center gap-3 rounded-xl border border-theme-border bg-theme-surface p-3 hover:border-theme-primary transition-colors"
            >
              <PostThumbnail post={item} theme={theme}
                src={item.imageUrl}
                alt={item.title}
                className="w-16 h-14 rounded-lg object-cover shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h5 data-studio-title
                  className={`text-xs font-bold leading-snug line-clamp-2 text-theme-heading ${
                    isSerif ? "font-serif" : "font-sans"
                  }`}
                >
                  {item.title}
                </h5>
                {showDate && (
                  <span className="text-[10px] font-mono text-theme-muted block mt-1">
                    {formatDate(item.date, theme.locale, theme.timeZone)}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

