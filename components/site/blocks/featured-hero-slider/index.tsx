"use client";
import { ContentImage } from "@/components/site/content-image";


import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Sparkles, Star } from "lucide-react";
import type { ContentItem } from "@/lib/site-content";
import type { FrontEndThemeContext } from "@/lib/site-theme";
import { ThemeSectionHeader } from "@/components/site/section-header";
import {
  DEFAULT_THEME,
  formatDate,
  getExcerpt,
  getPostUrl,
  isSerifHeading,
  t,
} from "@/components/site/utils";

/**
 * FEATURED POSTS HERO SLIDER WITH SIDE SPOTLIGHT QUEUE & AUTO-ADVANCE
 */
export function FeaturedHeroSliderBlock({
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const isSerif = isSerifHeading(theme);

  // Prefer posts explicitly marked as featured; fallback to top posts if none are marked yet
  const featuredList = posts.filter((p) => p.isFeatured);
  const slides = (featuredList.length > 0 ? featuredList : posts).slice(0, 5);

  useEffect(() => {
    if (isPaused || slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 5500);
    return () => clearInterval(timer);
  }, [isPaused, slides.length]);

  if (!slides.length) return null;

  const current = slides[currentIndex] || slides[0];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  return (
    <section
      className="space-y-4"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <ThemeSectionHeader
        title={title}
        subtitle={subtitle}
        linkText={linkText}
        linkHref={linkHref}
        theme={theme}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Main Hero Slide Stage (8 cols) */}
        <div data-studio-card className="lg:col-span-8 relative rounded-2xl overflow-hidden min-h-[400px] sm:min-h-[480px] flex flex-col justify-between p-6 sm:p-10 text-theme-overlay shadow-xl group">
          <ContentImage
            src={current.imageUrl}
            alt={current.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/20" />

          {/* Top Bar: Featured Pill & Navigation Controls */}
          <div className="relative z-10 flex items-center justify-between gap-3">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-slate-950 shadow-md">
              <Star className="size-3.5 fill-current" />
              <span>
                {theme.direction === "rtl" ? "مقال مميز" : "Featured Story"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrev}
                className="size-9 rounded-full bg-black/45 hover:bg-black/75 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white transition-colors"
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="size-9 rounded-full bg-black/45 hover:bg-black/75 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white transition-colors"
              >
                <ChevronRight className="size-5" />
              </button>
            </div>
          </div>

          {/* Bottom Content Overlay */}
          <div className="relative z-10 space-y-3.5 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2.5 text-xs text-white/80">
              {showCategory && (
                <span data-studio-category
                  style={{ backgroundColor: theme.primaryColor }}
                  className="rounded px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
                >
                  {current.categories[0] || t("site.spotlight", theme, "Spotlight")}
                </span>
              )}
              {showAuthor && (
                <span className="font-semibold text-white/90">
                  {current.authorName}
                </span>
              )}
              {showDate && (
                <span className="font-mono text-white/75">
                  • {formatDate(current.date, theme.locale)}
                </span>
              )}
            </div>

            <Link href={getPostUrl(current.slug, theme)} className="block">
              <h3 data-studio-title
                className={`text-2xl sm:text-4xl font-black leading-tight tracking-tight text-white hover:underline ${
                  isSerif ? "font-serif" : "font-sans"
                }`}
              >
                {current.title}
              </h3>
            </Link>

            {showExcerpt && (
              <p data-studio-excerpt className="text-xs sm:text-sm text-white/80 line-clamp-2 leading-relaxed">
                {getExcerpt(current, 185)}
              </p>
            )}

            {/* Slide Progress Indicators */}
            <div className="flex items-center gap-2 pt-2">
              {slides.map((s, idx) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === currentIndex
                      ? "w-8 bg-amber-400"
                      : "w-2.5 bg-white/40 hover:bg-white/70"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right Featured Queue Stack (4 cols) */}
        <div className="lg:col-span-4 flex flex-col justify-between gap-2.5 rounded-2xl border border-theme-border bg-theme-surface p-3.5 shadow-sm">
          <div className="flex items-center justify-between border-b border-theme-border pb-2 px-1">
            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-theme-heading">
              <Sparkles className="size-3.5 text-amber-500" />
              <span>
                {theme.direction === "rtl"
                  ? "قائمة المقالات المميزة"
                  : "Featured Lineup"}
              </span>
            </span>
            <span className="text-[11px] font-mono text-theme-muted">
              {currentIndex + 1} / {slides.length}
            </span>
          </div>

          <div className="flex-1 flex flex-col justify-between gap-2">
            {slides.map((item, idx) => {
              const isActive = idx === currentIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`group flex items-center gap-3 rounded-xl border p-2 text-start transition-all ${
                    isActive
                      ? "border-amber-400 bg-amber-500/10 shadow-xs"
                      : "border-transparent hover:border-theme-border hover:bg-theme-bg/60 opacity-80 hover:opacity-100"
                  }`}
                >
                  <div data-studio-image className="relative w-16 h-14 rounded-lg overflow-hidden shrink-0 bg-theme-border/50">
                    <ContentImage
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-1 start-1 rounded bg-black/75 px-1 text-[9px] font-mono font-bold text-amber-300">
                      0{idx + 1}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    {showCategory && (
                      <span data-studio-category className="text-[10px] font-bold uppercase tracking-wider text-theme-primary block truncate">
                        {item.categories[0]}
                      </span>
                    )}
                    <h4 data-studio-title
                      className={`text-xs font-bold leading-snug line-clamp-2 text-theme-heading ${
                        isSerif ? "font-serif" : "font-sans"
                      }`}
                    >
                      {item.title}
                    </h4>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

