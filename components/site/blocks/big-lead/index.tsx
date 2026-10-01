"use client";

import Link from "next/link";
import type { ContentItem } from "@/lib/site-content";
import type { FrontEndThemeContext } from "@/lib/site-theme";
import { ThemeSectionHeader } from "@/components/site/section-header";
import { DEFAULT_THEME, formatDate, getExcerpt, isSerifHeading, isDarkTheme } from "@/components/site/utils";

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
            style={{
              backgroundColor: "var(--theme-surface, #ffffff)",
              borderColor: "var(--theme-border, #e2e8f0)",
              color: "var(--theme-text, #1d2327)",
            }}
            className={`rounded-2xl border overflow-hidden shadow-sm transition-all ${reverse ? "lg:col-start-2" : ""}`}
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
                    style={{ color: "var(--theme-primary, #2271b1)" }}
                    className="font-bold text-[11px] uppercase tracking-wider"
                  >
                    {lead.categories[0] || "Lead Story"}
                  </span>
                )}
                {showDate && (
                  <>
                    <span style={{ color: "var(--theme-muted, #94a3b8)" }}>•</span>
                    <time
                      style={{ color: "var(--theme-muted, #94a3b8)" }}
                      className="text-xs font-mono"
                    >
                      {formatDate(lead.date)}
                    </time>
                  </>
                )}
              </div>

              <Link href={`/posts/${lead.slug}`} className="block">
                <h3
                  style={{ color: "var(--theme-heading, #0f172a)" }}
                  className={`text-2xl sm:text-3xl font-black tracking-tight leading-snug hover:underline ${
                    isSerif ? "font-serif" : "font-sans"
                  }`}
                >
                  {lead.title}
                </h3>
              </Link>

              {showExcerpt && (
                <p
                  style={{ color: "var(--theme-text, #334155)" }}
                  className="mt-3 text-sm leading-relaxed"
                >
                  {getExcerpt(lead, 200)}
                </p>
              )}

              <div
                style={{ borderColor: "var(--theme-border, #e2e8f0)" }}
                className="mt-5 flex items-center justify-between text-xs border-t pt-3"
              >
                {showAuthor && (
                  <span
                    style={{ color: "var(--theme-muted, #64748b)" }}
                    className="font-semibold"
                  >
                    {lead.authorName}
                  </span>
                )}
                <Link
                  href={`/posts/${lead.slug}`}
                  style={{ color: "var(--theme-primary, #2271b1)" }}
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
              style={{
                backgroundColor: "var(--theme-surface, #ffffff)",
                borderColor: "var(--theme-border, #e2e8f0)",
              }}
              className="rounded-xl border p-3.5 flex gap-4 transition-all shadow-sm hover:border-[#2271b1]"
            >
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  {showCategory && (
                    <span
                      style={{ color: "var(--theme-primary, #2271b1)" }}
                      className="text-[10px] font-bold uppercase tracking-wider"
                    >
                      {item.categories[0] || "News"}
                    </span>
                  )}
                  <Link href={`/posts/${item.slug}`} className="block mt-0.5">
                    <h4
                      style={{ color: "var(--theme-heading, #0f172a)" }}
                      className={`text-sm font-bold leading-snug line-clamp-2 hover:underline ${
                        isSerif ? "font-serif" : "font-sans"
                      }`}
                    >
                      {item.title}
                    </h4>
                  </Link>
                </div>
                <div
                  style={{ color: "var(--theme-muted, #94a3b8)" }}
                  className="flex items-center justify-between text-[11px] font-mono mt-2"
                >
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
