"use client";

import { useState } from "react";
import Link from "next/link";
import type { ContentItem } from "@/lib/site-content";
import type { FrontEndThemeContext } from "@/lib/site-theme";
import { DEFAULT_THEME, formatDate, isSerifHeading, getPostUrl, t } from "@/components/site/utils";

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
      <div
        style={{ borderColor: "var(--theme-border)" }}
        className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-2 gap-3"
      >
        <h2
          style={{ color: "var(--theme-heading)" }}
          className={`text-xl font-bold uppercase tracking-wider ${isSerif ? "font-serif" : "font-sans"}`}
        >
          {title}
        </h2>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            style={
              activeTab === "all"
                ? {
                    backgroundColor: "var(--theme-primary)",
                    color: "var(--theme-on-primary)",
                  }
                : undefined
            }
            className={`rounded-full px-3.5 py-1 text-xs font-semibold transition-colors ${
              activeTab === "all"
                ? "shadow-xs"
                : "bg-theme-border/40 text-theme-text hover:bg-theme-border"
            }`}
          >
            {t("site.all_stories", theme, "All Stories")}
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveTab(cat)}
              style={
                activeTab === cat
                  ? {
                      backgroundColor: "var(--theme-primary)",
                      color: "var(--theme-on-primary)",
                    }
                  : undefined
              }
              className={`rounded-full px-3.5 py-1 text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                activeTab === cat
                  ? "shadow-xs"
                  : "bg-theme-border/40 text-theme-text hover:bg-theme-border"
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
            style={{
              backgroundColor: "var(--theme-surface)",
              borderColor: "var(--theme-border)",
            }}
            className="rounded-2xl border p-4 flex gap-4 transition-all theme-card hover:border-theme-primary"
          >
            <div className="w-28 sm:w-32 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-theme-border/40">
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-between">
              <div>
                <span
                  style={{ color: "var(--theme-primary)" }}
                  className="text-[0.625rem] font-bold uppercase tracking-wider block"
                >
                  {item.categories[0]}
                </span>
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
              <span
                style={{ color: "var(--theme-muted)" }}
                className="text-[0.625rem] font-mono mt-1"
              >
                {formatDate(item.date, theme.locale)}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
