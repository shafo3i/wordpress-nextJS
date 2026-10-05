"use client";

import Link from "next/link";
import type { ContentItem } from "@/lib/site-content";
import type { FrontEndThemeContext } from "@/lib/site-theme";
import { ThemeSectionHeader } from "@/components/site/section-header";
import { DEFAULT_THEME, formatDate, isSerifHeading, getPostUrl, t } from "@/components/site/utils";

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((item) => (
          <article
            key={item.id}
            className="group relative rounded-2xl overflow-hidden h-80 flex flex-col justify-end p-6 text-theme-overlay shadow-md transition-all hover:-translate-y-1 hover:shadow-xl"
          >
            <img
              src={item.imageUrl}
              alt={item.title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-theme-scrim/95 via-theme-scrim/40 to-transparent" />

            <div className="relative z-10 space-y-2">
              {showCategory && (
                <span className="rounded bg-theme-overlay/20 backdrop-blur-sm px-2.5 py-0.5 text-[0.5625rem] font-bold uppercase tracking-wider text-theme-overlay inline-block">
                  {item.categories[0] || t("site.photo_feature", theme, "Photo Feature")}
                </span>
              )}

              <Link href={getPostUrl(item.slug, theme)} className="block">
                <h3
                  className={`text-lg font-bold leading-snug text-theme-overlay hover:underline ${
                    isSerif ? "font-serif" : "font-sans"
                  }`}
                >
                  {item.title}
                </h3>
              </Link>

              <div className="flex items-center justify-between text-[0.6875rem] text-theme-overlay-muted pt-2 border-t border-theme-overlay/20">
                {showAuthor && <span>{theme.dict?.[item.authorName] || item.authorName}</span>}
                {showDate && <span className="font-mono">{formatDate(item.date, theme.locale)}</span>}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
