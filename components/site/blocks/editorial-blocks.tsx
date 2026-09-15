"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Clock,
  ArrowRight,
  Radio,
} from "lucide-react";
import type { ContentItem } from "@/lib/site-content";
import type { FrontEndThemeContext } from "@/lib/site-theme";
import { ThemeSectionHeader } from "@/components/site/section-header";
import { DEFAULT_THEME, formatDate, getExcerpt, isSerifHeading, isDarkTheme } from "@/components/site/utils";

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

              <Link href={`/posts/${lead.slug}`} className="block">
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
                  href={`/posts/${lead.slug}`}
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

                <Link href={`/posts/${item.slug}`} className="block">
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

/**
 * 2. BROADSHEET 3-COLUMN WIRE BLOCK
 */
export function Broadsheet3ColBlock({
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
  const isDark = isDarkTheme(theme);
  const isSerif = isSerifHeading(theme);

  if (!posts.length) return null;

  const col1Item = posts[0];
  const col1Briefs = posts.slice(1, 3);
  const centerFeature = posts[3] || posts[0];
  const wirePosts = posts.slice(4, 8);

  return (
    <section className="space-y-4">
      <ThemeSectionHeader
        title={title}
        subtitle="Broadsheet Edition"
        linkText="Full Wire"
        linkHref="/category/all"
        theme={theme}
      />

      <div
        className={`grid grid-cols-1 lg:grid-cols-12 gap-6 divide-y lg:divide-y-0 lg:divide-x ${
          isDark ? "divide-slate-800" : "divide-slate-300"
        } items-start`}
      >
        {/* Column 1: Left Briefs & Vertical Story (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-mono">
              Column I • Regional
            </span>
          </div>

          {col1Item && (
            <div className="space-y-2">
              <div className="h-36 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
                <img
                  src={col1Item.imageUrl}
                  alt={col1Item.title}
                  className="w-full h-full object-cover"
                />
              </div>
              {showCategory && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600">
                  {col1Item.categories[0]}
                </span>
              )}
              <Link href={`/posts/${col1Item.slug}`} className="block">
                <h4 className={`text-sm font-bold leading-snug hover:underline ${isSerif ? "font-serif" : "font-sans"}`}>
                  {col1Item.title}
                </h4>
              </Link>
              {showExcerpt && (
                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                  {getExcerpt(col1Item, 90)}
                </p>
              )}
            </div>
          )}

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
            {col1Briefs.map((item) => (
              <div key={item.id} className="text-xs space-y-1">
                <span className="text-[10px] text-slate-400 font-mono">• 14m ago</span>
                <Link href={`/posts/${item.slug}`} className="block font-semibold hover:underline">
                  {item.title}
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: Center Major Feature (6 cols) */}
        <div className="lg:col-span-6 lg:px-6 pt-4 lg:pt-0 space-y-4">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-mono">
              Column II • Center Lead Feature
            </span>
          </div>

          <div className="h-72 sm:h-80 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shadow-md">
            <img
              src={centerFeature.imageUrl}
              alt={centerFeature.title}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {showCategory && (
                <span
                  style={{ color: theme.primaryColor }}
                  className="text-xs font-black uppercase tracking-wider"
                >
                  {centerFeature.categories[0] || "Front Page Story"}
                </span>
              )}
              {showAuthor && (
                <>
                  <span className="text-slate-400">•</span>
                  <span className="text-xs text-slate-400 font-mono">
                    By {centerFeature.authorName}
                  </span>
                </>
              )}
            </div>

            <Link href={`/posts/${centerFeature.slug}`} className="block">
              <h3
                className={`text-2xl sm:text-3xl font-black leading-tight tracking-tight hover:underline ${
                  isSerif ? "font-serif" : "font-sans"
                }`}
              >
                {centerFeature.title}
              </h3>
            </Link>

            {showExcerpt && (
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {getExcerpt(centerFeature, 220)}
              </p>
            )}

            <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-100 dark:border-slate-800">
              {showDate && <span className="font-mono">{formatDate(centerFeature.date)}</span>}
              <Link
                href={`/posts/${centerFeature.slug}`}
                style={{ color: theme.primaryColor }}
                className="font-bold hover:underline"
              >
                Continue Reading →
              </Link>
            </div>
          </div>
        </div>

        {/* Column 3: The Live Wire Desk (3 cols) */}
        <div className="lg:col-span-3 lg:pl-6 pt-4 lg:pt-0 space-y-4">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-1 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-mono">
              Column III • News Wire
            </span>
            <span className="size-2 rounded-full bg-rose-600 animate-ping" />
          </div>

          <div className="space-y-3.5">
            {wirePosts.map((item, idx) => (
              <div
                key={item.id}
                className="border-b border-slate-200/70 dark:border-slate-800 pb-3 last:border-b-0"
              >
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono mb-1">
                  <span className="text-rose-600 font-bold">LIVE</span>
                  <span>• {0 + (idx + 1) * 15}m ago</span>
                </div>
                <Link href={`/posts/${item.slug}`} className="block">
                  <h4
                    className={`text-xs font-bold leading-snug hover:underline ${
                      isSerif ? "font-serif" : "font-sans"
                    }`}
                  >
                    {item.title}
                  </h4>
                </Link>
                {showAuthor && (
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Reported by {item.authorName}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * 3. HERO CAROUSEL WITH INTERACTIVE FILMSTRIP
 */
export function HeroSliderBlock({
  posts,
  title,
  theme = DEFAULT_THEME,
  showExcerpt = true,
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
        subtitle="Carousel"
        theme={theme}
      />

      <div className="relative rounded-2xl overflow-hidden min-h-[380px] sm:min-h-[460px] flex flex-col justify-end p-6 sm:p-10 text-white shadow-xl group">
        <img
          src={current.imageUrl}
          alt={current.title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

        <div className="relative z-10 space-y-3 max-w-3xl">
          <div className="flex items-center gap-2">
            {showCategory && (
              <span
                style={{ backgroundColor: theme.primaryColor }}
                className="rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
              >
                {current.categories[0] || "Spotlight"}
              </span>
            )}
            <span className="text-xs text-slate-300 font-mono">
              {formatDate(current.date)}
            </span>
          </div>

          <Link href={`/posts/${current.slug}`} className="block">
            <h3
              className={`text-2xl sm:text-4xl font-black leading-tight tracking-tight text-white hover:underline ${
                isSerif ? "font-serif" : "font-sans"
              }`}
            >
              {current.title}
            </h3>
          </Link>

          {showExcerpt && (
            <p className="text-xs sm:text-sm text-slate-200 line-clamp-2 leading-relaxed">
              {getExcerpt(current, 170)}
            </p>
          )}
        </div>

        <div className="absolute top-6 right-6 z-20 flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrev}
            className="size-9 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white transition-colors"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="size-9 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white transition-colors"
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
                  ? "border-[#2271b1] ring-2 ring-[#2271b1] bg-blue-50/50 dark:bg-slate-800"
                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 opacity-70 hover:opacity-100"
              }`}
            >
              <div className="w-14 h-11 rounded-lg overflow-hidden flex-shrink-0 bg-slate-200 dark:bg-slate-800">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[9px] font-mono text-slate-400 block">0{idx + 1}</span>
                <h5 className="text-[11px] font-bold leading-tight truncate text-slate-900 dark:text-white">
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

/**
 * 4. BIG LEAD + SIDE LIST (Supports Lead Left OR Lead Right)
 */
export function BigLeadSideListBlock({
  posts,
  title,
  theme = DEFAULT_THEME,
  reverse = false,
  showExcerpt = true,
  showAuthor = true,
  showDate = true,
  showCategory = true,
}: {
  posts: ContentItem[];
  title: string;
  theme?: FrontEndThemeContext;
  reverse?: boolean;
  showExcerpt?: boolean;
  showAuthor?: boolean;
  showDate?: boolean;
  showCategory?: boolean;
}) {
  const isDark = isDarkTheme(theme);
  const isSerif = isSerifHeading(theme);

  if (!posts.length) return null;

  const [lead, ...side] = posts;

  return (
    <section className="space-y-4">
      <ThemeSectionHeader
        title={title}
        subtitle="Special Focus"
        theme={theme}
      />

      <div className={`grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-6 items-start ${reverse ? "lg:grid-flow-dense" : ""}`}>
        {lead && (
          <article
            className={`rounded-2xl border overflow-hidden shadow-sm transition-all ${reverse ? "lg:col-start-2" : ""} ${
              isDark ? "border-slate-800 bg-slate-900/60 text-white" : "border-slate-200 bg-white text-slate-900"
            }`}
          >
            <div className="h-64 sm:h-80 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
              <img
                src={lead.imageUrl}
                alt={lead.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-6">
              <div className="mb-2 flex items-center gap-2">
                {showCategory && (
                  <span
                    style={{ color: theme.primaryColor }}
                    className="font-bold text-[11px] uppercase tracking-wider"
                  >
                    {lead.categories[0] || "Lead Story"}
                  </span>
                )}
                {showDate && (
                  <>
                    <span className="text-xs text-slate-400">•</span>
                    <time className="text-xs text-slate-400 font-mono">{formatDate(lead.date)}</time>
                  </>
                )}
              </div>

              <Link href={`/posts/${lead.slug}`} className="block">
                <h3
                  className={`text-2xl sm:text-3xl font-black tracking-tight leading-snug hover:underline ${
                    isSerif ? "font-serif" : "font-sans"
                  }`}
                >
                  {lead.title}
                </h3>
              </Link>

              {showExcerpt && (
                <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {getExcerpt(lead, 200)}
                </p>
              )}

              <div className="mt-5 flex items-center justify-between text-xs text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3">
                {showAuthor && <span className="font-semibold text-slate-700 dark:text-slate-300">{lead.authorName}</span>}
                <Link
                  href={`/posts/${lead.slug}`}
                  style={{ color: theme.primaryColor }}
                  className="font-bold hover:underline"
                >
                  Full Coverage →
                </Link>
              </div>
            </div>
          </article>
        )}

        <div className={`space-y-3 ${reverse ? "lg:col-start-1" : ""}`}>
          {side.slice(0, 4).map((item) => (
            <div
              key={item.id}
              className={`rounded-xl border p-3.5 flex gap-4 transition-all shadow-sm ${
                isDark ? "border-slate-800 bg-slate-900/60 hover:border-slate-700" : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  {showCategory && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {item.categories[0] || "News"}
                    </span>
                  )}
                  <Link href={`/posts/${item.slug}`} className="block mt-0.5">
                    <h4
                      className={`text-sm font-bold leading-snug line-clamp-2 hover:underline ${
                        isSerif ? "font-serif" : "font-sans"
                      }`}
                    >
                      {item.title}
                    </h4>
                  </Link>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mt-2">
                  {showAuthor && <span>{item.authorName}</span>}
                  {showDate && <span>{formatDate(item.date)}</span>}
                </div>
              </div>

              <div className="w-28 sm:w-32 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-slate-800">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

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
  const isDark = isDarkTheme(theme);
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
            className={`rounded-2xl border p-4 sm:p-5 flex flex-col sm:flex-row gap-5 transition-all shadow-sm ${
              thumbRight ? "sm:flex-row-reverse" : ""
            } ${
              isDark ? "border-slate-800 bg-slate-900/60 hover:border-slate-700" : "border-slate-200 bg-white hover:border-slate-300"
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
                      style={{ color: theme.primaryColor }}
                      className="text-[10px] font-bold uppercase tracking-wider"
                    >
                      {item.categories[0] || "News"}
                    </span>
                  )}
                  {showDate && (
                    <>
                      <span className="text-xs text-slate-400">•</span>
                      <time className="text-[11px] text-slate-400 font-mono">
                        {formatDate(item.date)}
                      </time>
                    </>
                  )}
                </div>

                <Link href={`/posts/${item.slug}`} className="block">
                  <h3
                    className={`text-base sm:text-lg font-bold leading-snug hover:underline ${
                      isSerif ? "font-serif" : "font-sans"
                    }`}
                  >
                    {item.title}
                  </h3>
                </Link>

                {showExcerpt && (
                  <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                    {getExcerpt(item, 160)}
                  </p>
                )}
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                {showAuthor && (
                  <span className="font-medium text-slate-600 dark:text-slate-400">
                    By {item.authorName}
                  </span>
                )}
                <Link
                  href={`/posts/${item.slug}`}
                  style={{ color: theme.primaryColor }}
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
}: {
  posts: ContentItem[];
  title: string;
  theme?: FrontEndThemeContext;
  columns?: 3 | 4;
  showExcerpt?: boolean;
  showAuthor?: boolean;
  showDate?: boolean;
  showCategory?: boolean;
}) {
  const isDark = isDarkTheme(theme);
  const isSerif = isSerifHeading(theme);

  if (!posts.length) return null;

  return (
    <section className="space-y-4">
      <ThemeSectionHeader
        title={title}
        subtitle={`${columns} Columns`}
        theme={theme}
      />

      <div className={`grid grid-cols-1 sm:grid-cols-2 ${columns === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"} gap-5`}>
        {posts.map((item) => (
          <article
            key={item.id}
            className={`group rounded-2xl border transition-all overflow-hidden shadow-sm flex flex-col ${
              isDark ? "border-slate-800 bg-slate-900/60 text-white hover:border-slate-700" : "border-slate-200 bg-white text-slate-900 hover:shadow-md"
            }`}
          >
            <div className="relative overflow-hidden w-full h-44 bg-slate-100 dark:bg-slate-800">
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>

            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                {showCategory && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 block mb-1">
                    {item.categories[0]}
                  </span>
                )}
                <Link href={`/posts/${item.slug}`} className="block">
                  <h4
                    className={`font-bold leading-snug line-clamp-2 hover:underline text-sm ${
                      isSerif ? "font-serif" : "font-sans"
                    }`}
                  >
                    {item.title}
                  </h4>
                </Link>
                {showExcerpt && (
                  <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                    {getExcerpt(item, 100)}
                  </p>
                )}
              </div>

              <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                {showAuthor && <span>{item.authorName}</span>}
                {showDate && <span className="font-mono">{formatDate(item.date)}</span>}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

/**
 * 7. VISUAL MAGAZINE PHOTO TILES (Overlay Cards)
 */
export function VisualGridBlock({
  posts,
  title,
  theme = DEFAULT_THEME,
  showCategory = true,
  showAuthor = true,
  showDate = true,
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

  return (
    <section className="space-y-4">
      <ThemeSectionHeader
        title={title}
        subtitle="Visuals"
        theme={theme}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((item) => (
          <article
            key={item.id}
            className="group relative rounded-2xl overflow-hidden h-80 flex flex-col justify-end p-6 text-white shadow-md transition-all hover:-translate-y-1 hover:shadow-xl"
          >
            <img
              src={item.imageUrl}
              alt={item.title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />

            <div className="relative z-10 space-y-2">
              {showCategory && (
                <span className="rounded bg-white/20 backdrop-blur-sm px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white inline-block">
                  {item.categories[0] || "Photo Feature"}
                </span>
              )}

              <Link href={`/posts/${item.slug}`} className="block">
                <h3
                  className={`text-lg font-bold leading-snug text-white hover:underline ${
                    isSerif ? "font-serif" : "font-sans"
                  }`}
                >
                  {item.title}
                </h3>
              </Link>

              <div className="flex items-center justify-between text-[11px] text-slate-300 pt-2 border-t border-white/20">
                {showAuthor && <span>{item.authorName}</span>}
                {showDate && <span className="font-mono">{formatDate(item.date)}</span>}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

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
}: {
  posts: ContentItem[];
  title: string;
  theme?: FrontEndThemeContext;
  showExcerpt?: boolean;
  showAuthor?: boolean;
  showDate?: boolean;
  showCategory?: boolean;
}) {
  const isDark = isDarkTheme(theme);
  const isSerif = isSerifHeading(theme);

  if (!posts.length) return null;

  return (
    <section className="space-y-4">
      <ThemeSectionHeader
        title={title}
        subtitle="Text Wire"
        theme={theme}
      />

      <div className={`divide-y ${isDark ? "divide-slate-800" : "divide-slate-200"}`}>
        {posts.map((item) => (
          <article key={item.id} className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {showCategory && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                    [{item.categories[0]}]
                  </span>
                )}
                <Link href={`/posts/${item.slug}`} className="hover:underline">
                  <h4 className={`text-sm font-bold text-slate-900 dark:text-white ${isSerif ? "font-serif" : "font-sans"}`}>
                    {item.title}
                  </h4>
                </Link>
              </div>
              {showExcerpt && (
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {getExcerpt(item, 140)}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono flex-shrink-0">
              {showAuthor && <span>{item.authorName}</span>}
              {showDate && <span>{formatDate(item.date)}</span>}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

/**
 * 9. INTERACTIVE TABBED TOPIC SWITCHER
 */
export function TabbedBlock({
  posts,
  title,
  theme = DEFAULT_THEME,
}: {
  posts: ContentItem[];
  title: string;
  theme?: FrontEndThemeContext;
}) {
  const [activeTab, setActiveTab] = useState<string>("all");
  const isDark = isDarkTheme(theme);
  const isSerif = isSerifHeading(theme);

  if (!posts.length) return null;

  const categories = Array.from(
    new Set(posts.flatMap((p) => p.categories))
  ).slice(0, 5);

  const filteredPosts =
    activeTab === "all"
      ? posts.slice(0, 4)
      : posts
          .filter((p) =>
            p.categories.some((c) => c.toLowerCase() === activeTab.toLowerCase())
          )
          .slice(0, 4);

  const displayPosts = filteredPosts.length ? filteredPosts : posts.slice(0, 4);

  return (
    <section className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-2 gap-3">
        <h2 className={`text-xl font-bold uppercase tracking-wider ${isSerif ? "font-serif" : "font-sans"}`}>
          {title}
        </h2>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`rounded-full px-3.5 py-1 text-xs font-semibold transition-colors ${
              activeTab === "all"
                ? "bg-[#2271b1] text-white"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            All Stories
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveTab(cat)}
              className={`rounded-full px-3.5 py-1 text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                activeTab === cat
                  ? "bg-[#2271b1] text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              <span>{cat}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {displayPosts.map((item) => (
          <article
            key={item.id}
            className={`rounded-2xl border p-4 flex gap-4 transition-all shadow-sm ${
              isDark ? "border-slate-800 bg-slate-900/60 hover:border-slate-700" : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <div className="w-28 sm:w-32 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-slate-800">
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {item.categories[0]}
                </span>
                <Link href={`/posts/${item.slug}`} className="block mt-0.5">
                  <h4
                    className={`text-sm font-bold leading-snug line-clamp-2 hover:underline ${
                      isSerif ? "font-serif" : "font-sans"
                    }`}
                  >
                    {item.title}
                  </h4>
                </Link>
              </div>
              <span className="text-[10px] text-slate-400 font-mono mt-1">
                {formatDate(item.date)}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

/**
 * 10. MULTIMEDIA HUB (Podcast & Studio Audio Stream)
 */
export function MultimediaBlock({
  title,
  theme = DEFAULT_THEME,
}: {
  title: string;
  theme?: FrontEndThemeContext;
}) {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <section className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-black p-6 sm:p-8 text-white shadow-xl">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-rose-600 px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-widest flex items-center gap-1">
              <Radio className="size-3 animate-pulse" /> Studio Stream
            </span>
            <span className="text-xs text-slate-400 font-mono">Episode #142</span>
          </div>

          <h3 className="text-2xl font-bold font-serif">{title}</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Daily 15-minute briefing dissecting macro monetary policy shifts, global shipping trends, and algorithmic market infrastructure.
          </p>
        </div>

        <div className="w-full lg:w-auto bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center gap-4 min-w-[320px]">
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            style={{ backgroundColor: theme.primaryColor }}
            className="size-12 rounded-full flex items-center justify-center text-white hover:opacity-90 transition-opacity flex-shrink-0 shadow-lg"
          >
            {isPlaying ? <Pause className="size-5" /> : <Play className="size-5 ml-0.5" />}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1 text-xs">
              <span className="font-bold truncate">Morning Intelligence Audio</span>
              <span className="font-mono text-slate-400 text-[10px]">
                {isPlaying ? "08:24 / 15:00" : "15:00"}
              </span>
            </div>

            <div className="flex items-end gap-1 h-6 py-1">
              {[40, 70, 30, 90, 60, 100, 45, 80, 55, 95, 30, 75, 50, 85].map((h, i) => (
                <div
                  key={i}
                  style={{
                    height: isPlaying ? `${h}%` : "30%",
                    backgroundColor: isPlaying ? theme.primaryColor : "#64748b",
                  }}
                  className="w-1 rounded-full transition-all duration-300"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
