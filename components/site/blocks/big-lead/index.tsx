"use client";

import Link from "next/link";
import type { ContentItem } from "@/lib/site-content";
import type { FrontEndThemeContext } from "@/lib/site-theme";
import { ThemeSectionHeader } from "@/components/site/section-header";
import { DEFAULT_THEME, formatDate, getExcerpt, isSerifHeading, isDarkTheme, getPostUrl, t } from "@/components/site/utils";

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
  subtitle,
  linkText,
  linkHref,
}: {
  posts: ContentItem[];
  title: string;
  theme?: FrontEndThemeContext;
  reverse?: boolean;
  showExcerpt?: boolean;
  showAuthor?: boolean;
  showDate?: boolean;
  showCategory?: boolean;
  subtitle?: string;
  linkText?: string;
  linkHref?: string;
}) {
  const isDark = isDarkTheme(theme);
  const isSerif = isSerifHeading(theme);

  if (!posts.length) return null;

  const [lead, ...side] = posts;

  return (
    <section className="space-y-4">
      <ThemeSectionHeader
        title={title}
        subtitle={subtitle}
        linkText={linkText}
        linkHref={linkHref}
        theme={theme}
      />

      <div className={`grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-6 items-start ${reverse ? "lg:grid-flow-dense" : ""}`}>
        {lead && (
          <article
            style={{
              backgroundColor: "var(--theme-surface)",
              borderColor: "var(--theme-border)",
              color: "var(--theme-text)",
            }}
            className={`rounded-2xl border overflow-hidden theme-card transition-all ${reverse ? "lg:col-start-2" : ""}`}
          >
            <div className="h-64 sm:h-80 w-full overflow-hidden bg-theme-border/40">
              <img
                src={lead.imageUrl}
                alt={lead.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-6">
              <div className="mb-2 flex items-center gap-2">
                {showCategory && lead.categories?.[0] && (
                  <span
                    style={{ color: "var(--theme-primary)" }}
                    className="font-bold text-[0.6875rem] uppercase tracking-wider"
                  >
                    {lead.categories[0]}
                  </span>
                )}
                {showDate && (
                  <>
                    <span style={{ color: "var(--theme-muted)" }}>•</span>
                    <time
                      style={{ color: "var(--theme-muted)" }}
                      className="text-xs font-mono"
                    >
                      {formatDate(lead.date, theme.locale)}
                    </time>
                  </>
                )}
              </div>

              <Link href={getPostUrl(lead.slug, theme)} className="block">
                <h3
                  style={{ color: "var(--theme-heading)" }}
                  className={`text-2xl sm:text-3xl font-black tracking-tight leading-snug hover:underline ${
                    isSerif ? "font-serif" : "font-sans"
                  }`}
                >
                  {lead.title}
                </h3>
              </Link>

              {showExcerpt && (
                <p
                  style={{ color: "var(--theme-text)" }}
                  className="mt-3 text-sm leading-relaxed"
                >
                  {getExcerpt(lead, 200)}
                </p>
              )}

              <div
                style={{ borderColor: "var(--theme-border)" }}
                className="mt-5 flex items-center justify-between text-xs border-t pt-3"
              >
                {showAuthor && (
                  <span
                    style={{ color: "var(--theme-muted)" }}
                    className="font-semibold"
                  >
                    {theme.dict?.[lead.authorName] || lead.authorName}
                  </span>
                )}
                {linkText && (
                  <Link
                    href={getPostUrl(lead.slug, theme)}
                    style={{ color: "var(--theme-primary)" }}
                    className="font-bold hover:underline"
                  >
                    {linkText} {theme.direction === "rtl" ? "←" : "→"}
                  </Link>
                )}
              </div>
            </div>
          </article>
        )}

        <div className={`space-y-3 ${reverse ? "lg:col-start-1" : ""}`}>
          {side.slice(0, 4).map((item) => (
            <div
              key={item.id}
              style={{
                backgroundColor: "var(--theme-surface)",
                borderColor: "var(--theme-border)",
              }}
              className="rounded-xl border p-3.5 flex gap-4 transition-all theme-card hover:border-theme-primary"
            >
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  {showCategory && (
                    <span
                      style={{ color: "var(--theme-primary)" }}
                      className="text-[0.625rem] font-bold uppercase tracking-wider"
                    >
                      {item.categories[0]}
                    </span>
                  )}
                  <Link href={getPostUrl(item.slug, theme)} className="block mt-0.5">
                    <h4
                      style={{ color: "var(--theme-heading)" }}
                      className={`text-sm font-bold leading-snug line-clamp-2 hover:underline ${
                        isSerif ? "font-serif" : "font-sans"
                      }`}
                    >
                      {item.title}
                    </h4>
                  </Link>
                </div>
                <div
                  style={{ color: "var(--theme-muted)" }}
                  className="flex items-center justify-between text-[0.6875rem] font-mono mt-2"
                >
                  {showAuthor && <span>{theme.dict?.[item.authorName] || item.authorName}</span>}
                  {showDate && <span>{formatDate(item.date, theme.locale)}</span>}
                </div>
              </div>

              <div className="w-28 sm:w-32 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-theme-border/40">
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
