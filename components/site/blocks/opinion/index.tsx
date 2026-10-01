"use client";

import Link from "next/link";
import type { ContentItem } from "@/lib/site-content";
import type { FrontEndThemeContext } from "@/lib/site-theme";
import { ThemeSectionHeader } from "@/components/site/section-header";
import { DEFAULT_THEME } from "@/components/site/utils";

/**
 * 11. EDITORIAL OPINION & COLUMNISTS
 */
export function OpinionBlock({
  posts,
  title,
  theme = DEFAULT_THEME,
  postCount = 3,
}: {
  posts: ContentItem[];
  title: string;
  theme?: FrontEndThemeContext;
  postCount?: number;
}) {
  if (!posts.length) return null;

  const opinionItems = posts.slice(0, postCount);

  return (
    <section className="space-y-4">
      <ThemeSectionHeader
        title={title}
        subtitle="Commentary"
        theme={theme}
      />
      <div className="grid gap-6 md:grid-cols-3">
        {opinionItems.map((item) => (
          <div
            key={item.id}
            style={{
              backgroundColor: "var(--theme-surface, #faf8f5)",
              borderColor: "var(--theme-border, #e2e8f0)",
            }}
            className="rounded-2xl border p-5 shadow-sm transition-all"
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                style={{
                  backgroundColor: "var(--theme-primary, #2271b1)",
                  color: "#ffffff",
                }}
                className="size-10 rounded-full flex items-center justify-center font-bold text-xs shadow-xs"
              >
                {item.authorName.charAt(0)}
              </div>
              <div>
                <span
                  style={{ color: "var(--theme-heading, #0f172a)" }}
                  className="font-bold text-xs block"
                >
                  {item.authorName}
                </span>
                <span
                  style={{ color: "var(--theme-muted, #64748b)" }}
                  className="text-[10px]"
                >
                  Newsroom Columnist
                </span>
              </div>
            </div>
            <Link href={`/posts/${item.slug}`} className="hover:underline">
              <h4
                style={{ color: "var(--theme-heading, #0f172a)" }}
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
