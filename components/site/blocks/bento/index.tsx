"use client";

import Link from "next/link";
import { Clock, ArrowRight } from "lucide-react";
import type { ContentItem } from "@/lib/site-content";
import type { FrontEndThemeContext } from "@/lib/site-theme";
import { ThemeSectionHeader } from "@/components/site/section-header";
import { DEFAULT_THEME, formatDate, getExcerpt, isSerifHeading, getPostUrl } from "@/components/site/utils";

/**
 * 1. BENTO MEGA-GRID BLOCK (1 Hero Left + 4 Cards Right)
 */
export function MagazineBentoBlock({
  posts,
  title,
  theme = DEFAULT_THEME,
  showExcerpt = true,
  showAuthor = true,
  showDate = true,
  showCategory = true,
}: {
  posts: ContentItem[];
  title: string;
  theme?: FrontEndThemeContext;
  showExcerpt?: boolean;
  showAuthor?: boolean;
  showDate?: boolean;
  showCategory?: boolean;
}) {
  const isSerif = isSerifHeading(theme);

  if (!posts.length) return null;

  const [lead, ...gridItems] = posts;
  const fourCards = gridItems.slice(0, 4);

  return (
    <section className="space-y-4">
      <ThemeSectionHeader
        title={title}
        subtitle="Exclusive"
        linkText="Explore All"
        linkHref="/category/news"
        theme={theme}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {lead && (
          <div className="lg:col-span-7 group relative rounded-2xl overflow-hidden min-h-[460px] sm:min-h-[520px] flex flex-col justify-end p-6 sm:p-10 text-white shadow-xl transition-all">
            <img
              src={lead.imageUrl}
              alt={lead.title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-90 group-hover:opacity-95 transition-opacity" />

            <div className="relative z-10 space-y-3.5">
              <div className="flex items-center gap-2">
                {showCategory && (
                  <span
                    style={{ backgroundColor: theme.primaryColor }}
                    className="rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-white shadow-sm flex items-center gap-1.5"
                  >
                    <span className="size-1.5 rounded-full bg-white animate-pulse" />
                    {lead.categories[0] || "Featured Story"}
                  </span>
                )}
                <span className="text-xs text-slate-300 font-mono flex items-center gap-1">
                  <Clock className="size-3" /> 5 min read
                </span>
              </div>

              <Link href={getPostUrl(lead.slug, theme)} className="block">
                <h3
                  className={`text-2xl sm:text-4xl lg:text-5xl font-black leading-[1.1] tracking-tight text-white hover:underline drop-shadow-md ${
                    isSerif ? "font-serif" : "font-sans"
                  }`}
                >
                  {lead.title}
                </h3>
              </Link>

              {showExcerpt && (
                <p className="text-xs sm:text-sm text-slate-200 line-clamp-3 leading-relaxed max-w-xl">
                  {getExcerpt(lead, 200)}
                </p>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-white/20 text-xs text-slate-300">
                <div className="flex items-center gap-2.5">
                  {showAuthor && (
                    <div className="size-7 rounded-full bg-white text-black font-bold flex items-center justify-center text-[10px]">
                      {lead.authorName.charAt(0)}
                    </div>
                  )}
                  <div>
                    {showAuthor && <span className="font-semibold text-white block text-xs">{lead.authorName}</span>}
                    {showDate && <span className="text-[10px] text-slate-400 font-mono">{formatDate(lead.date)}</span>}
                  </div>
                </div>

                <Link
                  href={getPostUrl(lead.slug, theme)}
                  style={{ color: "#ffffff" }}
                  className="rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md px-3.5 py-1.5 font-bold text-xs transition-colors flex items-center gap-1.5"
                >
                  Read Story <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fourCards.map((item) => (
            <div
              key={item.id}
              className="group relative rounded-xl overflow-hidden min-h-[240px] flex flex-col justify-end p-4 text-white shadow-md transition-all hover:-translate-y-1 hover:shadow-xl"
            >
              <img
                src={item.imageUrl}
                alt={item.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

              <div className="relative z-10 space-y-1.5">
                {showCategory && (
                  <span className="rounded bg-black/50 backdrop-blur-sm px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-200 inline-block">
                    {item.categories[0] || "News"}
                  </span>
                )}

                <Link href={getPostUrl(item.slug, theme)} className="block">
                  <h4
                    className={`text-xs sm:text-sm font-bold leading-snug text-white line-clamp-2 hover:underline ${
                      isSerif ? "font-serif" : "font-sans"
                    }`}
                  >
                    {item.title}
                  </h4>
                </Link>

                <div className="flex items-center justify-between text-[10px] text-slate-300 pt-1">
                  {showAuthor && <span>{item.authorName}</span>}
                  {showDate && <span className="font-mono">{formatDate(item.date)}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
