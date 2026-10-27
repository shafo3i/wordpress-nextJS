"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, Clock, ArrowLeft, ArrowRight, BookOpen, Layers } from "lucide-react";
import type { ContentItem } from "@/lib/site-content";
import type { FrontEndThemeContext } from "@/lib/site-theme";
import { ThemeDynamicStyles } from "@/components/site/theme-dynamic-styles";
import { SiteHeader } from "@/components/site/header/site-header";
import { SiteFooter } from "@/components/site/footer/site-footer";
import { SidebarWidgetRenderer } from "@/components/site/sidebar/sidebar-renderer";
import type { WidgetItem } from "@/widgets/types";
import {
  DEFAULT_THEME,
  formatDate,
  isDarkTheme,
  isSerifHeading,
  getPostUrl,
  getCategoryUrl,
  localizePath,
  t,
} from "@/components/site/utils";

export interface CategoryTemplateProps {
  category: {
    id: string;
    name: string;
    slug: string;
    description: string;
    count: number;
  };
  posts: ContentItem[];
  totalPosts: number;
  totalPages: number;
  currentPage: number;
  theme?: FrontEndThemeContext;
  sidebarWidgets?: WidgetItem[];
  categoryWidgets?: WidgetItem[];
  footerWidgets?: {
    col1?: WidgetItem[];
    col2?: WidgetItem[];
    col3?: WidgetItem[];
    col4?: WidgetItem[];
  };
}

export function CategoryTemplate({
  category,
  posts,
  totalPosts,
  totalPages,
  currentPage,
  theme = DEFAULT_THEME,
  sidebarWidgets = [],
  categoryWidgets = [],
  footerWidgets,
}: CategoryTemplateProps) {
  const isDark = isDarkTheme(theme);
  const isSerif = isSerifHeading(theme);
  const isRtl = theme.direction === "rtl";
  const activeLocale = theme.locale || theme.defaultLocale || "en";

  // Dedicated category widgets only - NO fallback to primary sidebar
  const effectiveWidgets = categoryWidgets || [];

  const activeSidebarWidgets = effectiveWidgets.filter(
    (item) => !item.locale || item.locale === "all" || item.locale === activeLocale
  );
  const hasSidebar = activeSidebarWidgets.length > 0;

  const leadPost = posts[0];
  const gridPosts = posts.slice(1);

  // Pagination helper
  const getPageLink = (pageNum: number) => {
    const basePath = getCategoryUrl(category.slug, theme);
    return pageNum === 1 ? basePath : `${basePath}?page=${pageNum}`;
  };

  return (
    <div
      className={`min-h-screen flex flex-col ${isDark ? "dark" : ""} bg-[var(--theme-bg)] text-[var(--theme-text)]`}
      dir={theme.direction || "ltr"}
    >
      {theme.mods && <ThemeDynamicStyles mods={theme.mods} themeSlug={theme.themeSlug} />}

      <SiteHeader theme={theme} />

      <main className="theme-container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full max-w-7xl">
        {/* Breadcrumb Navigation */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-xs text-[var(--theme-muted)] mb-6 overflow-x-auto whitespace-nowrap"
        >
          <Link
            href={localizePath("/", theme.locale, theme.defaultLocale)}
            className="hover:text-[var(--theme-primary)] transition-colors"
          >
            {t("site.home", theme, "Home")}
          </Link>
          <ChevronRight className="size-3.5 rtl:rotate-180 shrink-0 opacity-60" />
          <span className="opacity-80">{t("site.categories", theme, "Categories")}</span>
          <ChevronRight className="size-3.5 rtl:rotate-180 shrink-0 opacity-60" />
          <span className="font-semibold text-[var(--theme-heading)]">{category.name}</span>
        </nav>

        {/* Category Header Hero */}
        <header className="mb-10 pb-8 border-b border-[var(--theme-border)]">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-white shadow-xs"
              style={{ backgroundColor: "var(--theme-primary)" }}
            >
              <Layers className="size-3.5" />
              {t("site.topic_archive", theme, "Topic Archive")}
            </span>

            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[var(--theme-surface)] border border-[var(--theme-border)] text-[var(--theme-muted)]">
              {totalPosts} {totalPosts === 1 ? t("site.story", theme, "story") : t("site.stories", theme, "stories")}
            </span>
          </div>

          <h1
            className={`text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[var(--theme-heading)] mb-4 ${isSerif ? "font-serif" : ""
              }`}
          >
            {category.name}
          </h1>

          {category.description && (
            <p className="text-base sm:text-lg text-[var(--theme-muted)] max-w-3xl leading-relaxed">
              {category.description}
            </p>
          )}
        </header>

        {/* Main Content + Optional Sidebar Layout */}
        <div className={hasSidebar ? "grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start" : "w-full"}>
          {/* Main Editorial Content Stream */}
          <div className={hasSidebar ? "lg:col-span-8 space-y-10" : "w-full space-y-10"}>
            {posts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--theme-border)] p-12 text-center bg-[var(--theme-surface)]">
                <BookOpen className="size-12 mx-auto text-[var(--theme-muted)] mb-3 opacity-50" />
                <h3 className="text-lg font-bold text-[var(--theme-heading)] mb-1">
                  {t("site.no_stories_found", theme, "No stories found in this topic yet")}
                </h3>
                <p className="text-sm text-[var(--theme-muted)]">
                  {t("site.no_stories_desc", theme, "Please check back soon for the latest dispatches and coverage.")}
                </p>
              </div>
            ) : (
              <>
                {/* 1. EDITORIAL LEAD POST */}
                {leadPost && (
                  <article className="group rounded-2xl overflow-hidden border border-[var(--theme-border)] bg-[var(--theme-surface)] shadow-sm hover:shadow-md transition-all duration-300">
                    <Link href={getPostUrl(leadPost.slug, theme)} className="block">
                      <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100">
                        <img
                          src={leadPost.imageUrl}
                          alt={leadPost.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="eager"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
                        <div className="absolute bottom-4 start-4 end-4 text-white">
                          <span
                            className="inline-block px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider mb-2 text-white"
                            style={{ backgroundColor: "var(--theme-primary)" }}
                          >
                            {leadPost.categories[0] || category.name}
                          </span>
                        </div>
                      </div>
                    </Link>

                    <div className="p-6 sm:p-8">
                      <div className="flex items-center gap-3 text-xs text-[var(--theme-muted)] mb-3">
                        <span className="font-semibold text-[var(--theme-heading)]">
                          {leadPost.authorName}
                        </span>
                        <span>•</span>
                        <time dateTime={new Date(leadPost.date).toISOString()}>
                          {formatDate(leadPost.date, activeLocale)}
                        </time>
                      </div>

                      <h2
                        className={`text-2xl sm:text-3xl font-extrabold text-[var(--theme-heading)] mb-3 group-hover:text-[var(--theme-primary)] transition-colors leading-tight ${isSerif ? "font-serif" : ""
                          }`}
                      >
                        <Link href={getPostUrl(leadPost.slug, theme)}>
                          {leadPost.title}
                        </Link>
                      </h2>

                      {leadPost.excerpt && (
                        <p className="text-sm sm:text-base text-[var(--theme-muted)] line-clamp-3 leading-relaxed mb-4">
                          {leadPost.excerpt}
                        </p>
                      )}

                      <Link
                        href={getPostUrl(leadPost.slug, theme)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--theme-primary)] hover:underline"
                      >
                        <span>{t("site.read_full_story", theme, "Read Full Story")}</span>
                        <ChevronRight className="size-3.5 rtl:rotate-180" />
                      </Link>
                    </div>
                  </article>
                )}

                {/* 2. EDITORIAL GRID POSTS */}
                {gridPosts.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                    {gridPosts.map((post) => (
                      <article
                        key={post.id}
                        className="group flex flex-col rounded-xl overflow-hidden border border-[var(--theme-border)] bg-[var(--theme-surface)] hover:border-[var(--theme-primary)]/40 transition-all duration-300 hover:shadow-sm"
                      >
                        <Link href={getPostUrl(post.slug, theme)} className="block aspect-[16/10] overflow-hidden bg-slate-100 relative">
                          <img
                            src={post.imageUrl}
                            alt={post.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                          />
                        </Link>

                        <div className="p-5 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between text-[11px] text-[var(--theme-muted)] mb-2">
                              <span className="font-semibold text-[var(--theme-primary)]">
                                {post.categories[0] || category.name}
                              </span>
                              <time dateTime={new Date(post.date).toISOString()}>
                                {formatDate(post.date, activeLocale)}
                              </time>
                            </div>

                            <h3
                              className={`text-lg font-bold text-[var(--theme-heading)] group-hover:text-[var(--theme-primary)] transition-colors leading-snug mb-2 line-clamp-2 ${isSerif ? "font-serif" : ""
                                }`}
                            >
                              <Link href={getPostUrl(post.slug, theme)}>
                                {post.title}
                              </Link>
                            </h3>

                            {post.excerpt && (
                              <p className="text-xs text-[var(--theme-muted)] line-clamp-2 leading-relaxed">
                                {post.excerpt}
                              </p>
                            )}
                          </div>

                          <div className="pt-4 mt-4 border-t border-[var(--theme-border)] flex items-center justify-between text-[11px] text-[var(--theme-muted)]">
                            <span>{post.authorName}</span>
                            <span className="text-[var(--theme-primary)] font-semibold group-hover:underline">
                              {t("site.read_more", theme, "Read")} &rarr;
                            </span>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}

                {/* 3. PAGINATION CONTROLS */}
                {totalPages > 1 && (
                  <nav
                    aria-label="Pagination"
                    className="pt-8 border-t border-[var(--theme-border)] flex items-center justify-between gap-3"
                  >
                    <div>
                      {currentPage > 1 ? (
                        <Link
                          href={getPageLink(currentPage - 1)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[var(--theme-border)] bg-[var(--theme-surface)] text-xs font-semibold text-[var(--theme-heading)] hover:bg-slate-50 transition-colors"
                        >
                          <ArrowLeft className="size-3.5 rtl:rotate-180" />
                          <span>{t("site.prev", theme, "Previous")}</span>
                        </Link>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[var(--theme-border)] bg-[var(--theme-surface)] text-xs font-semibold text-[var(--theme-muted)] opacity-40 cursor-not-allowed">
                          <ArrowLeft className="size-3.5 rtl:rotate-180" />
                          <span>{t("site.prev", theme, "Previous")}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => {
                        const isCurrent = num === currentPage;
                        return (
                          <Link
                            key={num}
                            href={getPageLink(num)}
                            className={`size-8 rounded-md flex items-center justify-center text-xs font-bold transition-colors ${isCurrent
                                ? "bg-[var(--theme-primary)] text-white shadow-xs"
                                : "border border-[var(--theme-border)] bg-[var(--theme-surface)] text-[var(--theme-heading)] hover:bg-slate-50"
                              }`}
                          >
                            {num}
                          </Link>
                        );
                      })}
                    </div>

                    <div>
                      {currentPage < totalPages ? (
                        <Link
                          href={getPageLink(currentPage + 1)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[var(--theme-border)] bg-[var(--theme-surface)] text-xs font-semibold text-[var(--theme-heading)] hover:bg-slate-50 transition-colors"
                        >
                          <span>{t("site.next", theme, "Next")}</span>
                          <ArrowRight className="size-3.5 rtl:rotate-180" />
                        </Link>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[var(--theme-border)] bg-[var(--theme-surface)] text-xs font-semibold text-[var(--theme-muted)] opacity-40 cursor-not-allowed">
                          <span>{t("site.next", theme, "Next")}</span>
                          <ArrowRight className="size-3.5 rtl:rotate-180" />
                        </span>
                      )}
                    </div>
                  </nav>
                )}
              </>
            )}
          </div>

          {/* Option B: Sidebar Column */}
          {hasSidebar && (
            <aside className="lg:col-span-4 space-y-6">
              {activeSidebarWidgets.map((widget) => (
                <SidebarWidgetRenderer
                  key={widget.id}
                  item={widget}
                  theme={theme}
                  posts={posts}
                />
              ))}
            </aside>
          )}
        </div>
      </main>

      <SiteFooter theme={theme} footerWidgets={footerWidgets} />
    </div>
  );
}
