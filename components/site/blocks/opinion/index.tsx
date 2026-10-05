"use client";

import Link from "next/link";
import type { ContentItem } from "@/lib/site-content";
import type { FrontEndThemeContext } from "@/lib/site-theme";
import { ThemeSectionHeader } from "@/components/site/section-header";
import { DEFAULT_THEME, getPostUrl, t } from "@/components/site/utils";

/**
 * 11. EDITORIAL OPINION & COLUMNISTS
 */
export function OpinionBlock({
  posts,
  title,
  theme = DEFAULT_THEME,
  postCount = 3,
  subtitle,
  linkText,
  linkHref,
}: {
  posts: ContentItem[];
  title: string;
  theme?: FrontEndThemeContext;
  postCount?: number;
  subtitle?: string;
  linkText?: string;
  linkHref?: string;
}) {
  if (!posts.length) return null;

  const opinionItems = posts.slice(0, postCount);

  return (
    <section className="space-y-4">
      <ThemeSectionHeader
        title={title}
        subtitle={subtitle}
        linkText={linkText}
        linkHref={linkHref}
        theme={theme}
      />
      <div className="grid gap-6 md:grid-cols-3">
        {opinionItems.map((item) => (
          <div
            key={item.id}
            style={{
              backgroundColor: "var(--theme-surface)",
              borderColor: "var(--theme-border)",
            }}
            className="rounded-2xl border p-5 theme-card transition-all"
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                style={{
                  backgroundColor: "var(--theme-primary)",
                  color: "var(--theme-on-primary)",
                }}
                className="size-10 rounded-full flex items-center justify-center font-bold text-xs shadow-xs"
              >
                {item.authorName ? item.authorName.charAt(0) : "•"}
              </div>
              <div>
                <span
                  style={{ color: "var(--theme-heading)" }}
                  className="font-bold text-xs block"
                >
                  {theme.dict?.[item.authorName] || item.authorName}
                </span>
                {item.categories?.[0] && (
                  <span
                    style={{ color: "var(--theme-muted)" }}
                    className="text-[0.625rem]"
                  >
                    {item.categories[0]}
                  </span>
                )}
              </div>
            </div>
            <Link href={getPostUrl(item.slug, theme)} className="hover:underline">
              <h4
                style={{ color: "var(--theme-heading)" }}
                className="font-serif text-base font-bold leading-snug"
              >
                "{item.title}"
              </h4>
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
