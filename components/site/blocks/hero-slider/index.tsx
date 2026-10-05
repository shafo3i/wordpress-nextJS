"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ContentItem } from "@/lib/site-content";
import type { FrontEndThemeContext } from "@/lib/site-theme";
import { ThemeSectionHeader } from "@/components/site/section-header";
import { DEFAULT_THEME, formatDate, getExcerpt, isSerifHeading, getPostUrl, t } from "@/components/site/utils";

/**
 * 3. HERO CAROUSEL WITH INTERACTIVE FILMSTRIP
 */
export function HeroSliderBlock({
  posts,
  title,
  theme = DEFAULT_THEME,
  showExcerpt = true,
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
  const isSerif = isSerifHeading(theme);

  if (!posts.length) return null;

  const slides = posts.slice(0, 4);
  const current = slides[currentIndex] || slides[0];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  return (
    <section className="space-y-3">
      <ThemeSectionHeader
        title={title}
        subtitle={subtitle}
        linkText={linkText}
        linkHref={linkHref}
        theme={theme}
      />

      <div className="relative rounded-2xl overflow-hidden min-h-[380px] sm:min-h-[460px] flex flex-col justify-end p-6 sm:p-10 text-theme-overlay shadow-xl group">
        <img
          src={current.imageUrl}
          alt={current.title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-theme-scrim via-theme-scrim/50 to-transparent" />

        <div className="relative z-10 space-y-3 max-w-3xl">
          <div className="flex items-center gap-2">
            {showCategory && (
              <span
                style={{ backgroundColor: theme.primaryColor }}
                className="rounded-full px-3 py-0.5 text-[0.625rem] font-bold uppercase tracking-wider text-theme-on-primary"
              >
                {current.categories[0] || t("site.spotlight", theme, "Spotlight")}
              </span>
            )}
            <span className="text-xs text-theme-overlay-muted font-mono">
              {formatDate(current.date, theme.locale)}
            </span>
          </div>

          <Link href={getPostUrl(current.slug, theme)} className="block">
            <h3
              className={`text-2xl sm:text-4xl font-black leading-tight tracking-tight text-theme-overlay hover:underline ${
                isSerif ? "font-serif" : "font-sans"
              }`}
            >
              {current.title}
            </h3>
          </Link>

          {showExcerpt && (
            <p className="text-xs sm:text-sm text-theme-overlay-muted line-clamp-2 leading-relaxed">
              {getExcerpt(current, 170)}
            </p>
          )}
        </div>

        <div className="absolute top-6 right-6 z-20 flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrev}
            className="size-9 rounded-full bg-theme-scrim/40 hover:bg-theme-scrim/70 backdrop-blur-sm border border-theme-overlay/20 flex items-center justify-center text-theme-overlay transition-colors"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="size-9 rounded-full bg-theme-scrim/40 hover:bg-theme-scrim/70 backdrop-blur-sm border border-theme-overlay/20 flex items-center justify-center text-theme-overlay transition-colors"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
        {slides.map((item, idx) => {
          const isActive = currentIndex === idx;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              className={`rounded-xl border p-2.5 flex items-center gap-3 text-left transition-all ${
                isActive
                  ? "border-theme-primary ring-2 ring-theme-primary bg-theme-surface"
                  : "border-theme-border bg-theme-surface  opacity-70 hover:opacity-100"
              }`}
            >
              <div className="w-14 h-11 rounded-lg overflow-hidden flex-shrink-0 bg-theme-border/60">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[0.5625rem] font-mono text-theme-muted block">0{idx + 1}</span>
                <h5 className="text-[0.6875rem] font-bold leading-tight truncate text-theme-heading">
                  {item.title}
                </h5>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
