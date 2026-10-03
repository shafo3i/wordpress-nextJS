"use client";

import Link from "next/link";
import type { ContentItem } from "@/lib/site-content";
import type { FrontEndThemeContext } from "@/lib/site-theme";
import { ThemeSectionHeader } from "@/components/site/section-header";
import { DEFAULT_THEME, formatDate, getExcerpt, isSerifHeading, isDarkTheme, getPostUrl, getCategoryUrl, t } from "@/components/site/utils";

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
  subtitle,
  linkText,
  linkHref,
  showColumnHeaders = false,
  col1Title,
  col2Title,
  col3Title,
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
  showColumnHeaders?: boolean;
  col1Title?: string;
  col2Title?: string;
  col3Title?: string;
}) {
  const isDark = isDarkTheme(theme);
  const isSerif = isSerifHeading(theme);

  if (!posts.length) return null;

  const col1Item = posts[0];
  const col1Briefs = posts.slice(1, 3);
  const centerFeature = posts[3] || posts[0];
  const wirePosts = posts.slice(4, 8);

  const displayCol1 = col1Title ? (theme.dict?.[col1Title] || col1Title) : (showColumnHeaders ? (theme.dict?.["site.column_1_regional"] || "Column I • Regional") : null);
  const displayCol2 = col2Title ? (theme.dict?.[col2Title] || col2Title) : (showColumnHeaders ? (theme.dict?.["site.column_2_feature"] || "Column II • Center Lead Feature") : null);
  const displayCol3 = col3Title ? (theme.dict?.[col3Title] || col3Title) : (showColumnHeaders ? (theme.dict?.["site.column_3_wire"] || "Column III • News Wire") : null);

  return (
    <section className="space-y-4">
      <ThemeSectionHeader
        title={title}
        subtitle={subtitle}
        linkText={linkText}
        linkHref={linkHref || (linkText ? getCategoryUrl("all", theme) : undefined)}
        theme={theme}
      />

      <div
        style={{ borderColor: "var(--theme-border, #e2e8f0)" }}
        className="grid grid-cols-1 lg:grid-cols-12 gap-6 divide-y lg:divide-y-0 lg:divide-x divide-theme-border items-start"
      >
        {/* Column 1: Left Briefs & Vertical Story (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          {displayCol1 && (
            <div
              style={{ borderColor: "var(--theme-border, #e2e8f0)" }}
              className="border-b pb-1"
            >
              <span
                style={{ color: "var(--theme-muted, #94a3b8)" }}
                className="text-[10px] font-bold uppercase tracking-widest font-mono"
              >
                {displayCol1}
              </span>
            </div>
          )}

          {col1Item && (
            <div className="space-y-2">
              <div className="h-36 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
                <img
                  src={col1Item.imageUrl}
                  alt={col1Item.title}
                  className="w-full h-full object-cover"
                />
              </div>
              {showCategory && col1Item.categories?.[0] && (
                <span
                  style={{ color: "var(--theme-primary, #e11d48)" }}
                  className="text-[10px] font-bold uppercase tracking-wider block"
                >
                  {col1Item.categories[0]}
                </span>
              )}
              <Link href={getPostUrl(col1Item.slug, theme)} className="block">
                <h4
                  style={{ color: "var(--theme-heading, #0f172a)" }}
                  className={`text-sm font-bold leading-snug hover:underline ${isSerif ? "font-serif" : "font-sans"}`}
                >
                  {col1Item.title}
                </h4>
              </Link>
              {showExcerpt && (
                <p
                  style={{ color: "var(--theme-muted, #64748b)" }}
                  className="text-xs line-clamp-2 leading-relaxed"
                >
                  {getExcerpt(col1Item, 90)}
                </p>
              )}
            </div>
          )}

          {col1Briefs.length > 0 && (
            <div
              style={{ borderColor: "var(--theme-border, #e2e8f0)" }}
              className="pt-3 border-t space-y-3"
            >
              {col1Briefs.map((item) => (
                <div key={item.id} className="text-xs space-y-1">
                  {showDate && (
                    <span
                      style={{ color: "var(--theme-muted, #94a3b8)" }}
                      className="text-[10px] font-mono block"
                    >
                      {formatDate(item.date, theme.locale)}
                    </span>
                  )}
                  <Link
                    href={getPostUrl(item.slug, theme)}
                    style={{ color: "var(--theme-heading, #0f172a)" }}
                    className="block font-semibold hover:underline"
                  >
                    {item.title}
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Column 2: Center Major Feature (6 cols) */}
        <div className="lg:col-span-6 lg:px-6 pt-4 lg:pt-0 space-y-4">
          {displayCol2 && (
            <div
              style={{ borderColor: "var(--theme-border, #e2e8f0)" }}
              className="border-b pb-1"
            >
              <span
                style={{ color: "var(--theme-muted, #94a3b8)" }}
                className="text-[10px] font-bold uppercase tracking-widest font-mono"
              >
                {displayCol2}
              </span>
            </div>
          )}

          <div className="h-72 sm:h-80 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shadow-md">
            <img
              src={centerFeature.imageUrl}
              alt={centerFeature.title}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {showCategory && centerFeature.categories?.[0] && (
                <span
                  style={{ color: "var(--theme-primary, #2271b1)" }}
                  className="text-xs font-black uppercase tracking-wider"
                >
                  {centerFeature.categories[0]}
                </span>
              )}
              {showAuthor && (
                <>
                  <span style={{ color: "var(--theme-muted, #94a3b8)" }}>•</span>
                  <span
                    style={{ color: "var(--theme-muted, #94a3b8)" }}
                    className="text-xs font-mono"
                  >
                    {t("site.by", theme, "By")} {theme.dict?.[centerFeature.authorName] || centerFeature.authorName}
                  </span>
                </>
              )}
            </div>

            <Link href={getPostUrl(centerFeature.slug, theme)} className="block">
              <h3
                style={{ color: "var(--theme-heading, #0f172a)" }}
                className={`text-2xl sm:text-3xl font-black leading-tight tracking-tight hover:underline ${isSerif ? "font-serif" : "font-sans"}`}
              >
                {centerFeature.title}
              </h3>
            </Link>

            {showExcerpt && (
              <p
                style={{ color: "var(--theme-text, #334155)" }}
                className="text-sm leading-relaxed"
              >
                {getExcerpt(centerFeature, 220)}
              </p>
            )}

            <div
              style={{ borderColor: "var(--theme-border, #e2e8f0)" }}
              className="pt-2 flex items-center justify-between text-xs border-t"
            >
              {showDate && (
                <span
                  style={{ color: "var(--theme-muted, #94a3b8)" }}
                  className="font-mono"
                >
                  {formatDate(centerFeature.date, theme.locale)}
                </span>
              )}
              {linkText && (
                <Link
                  href={getPostUrl(centerFeature.slug, theme)}
                  style={{ color: "var(--theme-primary, #2271b1)" }}
                  className="font-bold hover:underline"
                >
                  {linkText} {theme.direction === "rtl" ? "←" : "→"}
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Column 3: The Wire Desk (3 cols) */}
        <div className="lg:col-span-3 lg:pl-6 pt-4 lg:pt-0 space-y-4">
          {displayCol3 && (
            <div
              style={{ borderColor: "var(--theme-border, #e2e8f0)" }}
              className="border-b pb-1 flex items-center justify-between"
            >
              <span
                style={{ color: "var(--theme-muted, #94a3b8)" }}
                className="text-[10px] font-bold uppercase tracking-widest font-mono"
              >
                {displayCol3}
              </span>
              <span
                style={{ backgroundColor: "var(--theme-primary, #e11d48)" }}
                className="size-2 rounded-full animate-ping"
              />
            </div>
          )}

          <div className="space-y-3.5">
            {wirePosts.map((item) => (
              <div
                key={item.id}
                style={{ borderColor: "var(--theme-border, #e2e8f0)" }}
                className="border-b pb-3 last:border-b-0"
              >
                {showDate && (
                  <div className="text-[10px] font-mono text-slate-400 mb-1">
                    {formatDate(item.date, theme.locale)}
                  </div>
                )}
                <Link href={getPostUrl(item.slug, theme)} className="block">
                  <h4
                    style={{ color: "var(--theme-heading, #0f172a)" }}
                    className={`text-xs font-bold leading-snug hover:underline ${isSerif ? "font-serif" : "font-sans"}`}
                  >
                    {item.title}
                  </h4>
                </Link>
                {showAuthor && (
                  <span
                    style={{ color: "var(--theme-muted, #94a3b8)" }}
                    className="text-[10px] mt-1 block"
                  >
                    {t("site.reported_by", theme, "Reported by")} {theme.dict?.[item.authorName] || item.authorName}
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
