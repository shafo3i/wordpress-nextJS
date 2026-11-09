"use client";
import { ContentImage } from "@/components/site/content-image";


import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
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
 * MULTI-CARD INTERACTIVE POST CAROUSEL BLOCK
 */
export function MultiCardCarouselBlock({
  posts,
  title,
  theme = DEFAULT_THEME,
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
  showAuthor?: boolean;
  showDate?: boolean;
  showCategory?: boolean;
  subtitle?: string;
  linkText?: string;
  linkHref?: string;
}) {
  const [startIdx, setStartIdx] = useState(0);
  const isSerif = isSerifHeading(theme);

  if (!posts.length) return null;

  const visibleCount = Math.min(4, posts.length);
  const visiblePosts: ContentItem[] = [];
  for (let i = 0; i < visibleCount; i++) {
    visiblePosts.push(posts[(startIdx + i) % posts.length]);
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <ThemeSectionHeader
            title={title}
            subtitle={subtitle}
            linkText={linkText}
            linkHref={linkHref}
            theme={theme}
          />
        </div>
        {posts.length > 1 && (
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() =>
                setStartIdx((prev) => (prev === 0 ? posts.length - 1 : prev - 1))
              }
              className="size-8 rounded-full border border-theme-border bg-theme-surface hover:border-theme-primary flex items-center justify-center text-theme-heading transition-colors"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={() =>
                setStartIdx((prev) => (prev === posts.length - 1 ? 0 : prev + 1))
              }
              className="size-8 rounded-full border border-theme-border bg-theme-surface hover:border-theme-primary flex items-center justify-center text-theme-heading transition-colors"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {visiblePosts.map((post, i) => (
          <article
            key={`${post.id}-${i}`}
            className="group relative rounded-2xl overflow-hidden min-h-[290px] flex flex-col justify-end p-5 text-white shadow-md"
          >
            <ContentImage
              src={post.imageUrl}
              alt={post.title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent" />

            {post.isFeatured && (
              <span className="absolute top-3 end-3 z-10 inline-flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 text-[9px] font-black uppercase text-slate-950">
                <Star className="size-2.5 fill-current" />
                <span>{theme.direction === "rtl" ? "مميز" : "Featured"}</span>
              </span>
            )}

            <div className="relative z-10 space-y-2">
              {showCategory && post.categories[0] && (
                <span data-studio-category
                  style={{ backgroundColor: theme.primaryColor }}
                  className="inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
                >
                  {post.categories[0]}
                </span>
              )}

              <Link href={getPostUrl(post.slug, theme)} className="block">
                <h4 data-studio-title
                  className={`text-base font-extrabold leading-snug line-clamp-2 text-white group-hover:underline ${
                    isSerif ? "font-serif" : "font-sans"
                  }`}
                >
                  {post.title}
                </h4>
              </Link>

              {(showAuthor || showDate) && (
                <div className="flex items-center gap-2 text-[11px] text-white/75">
                  {showAuthor && <span>{post.authorName}</span>}
                  {showDate && <span>• {formatDate(post.date, theme.locale, theme.timeZone)}</span>}
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

