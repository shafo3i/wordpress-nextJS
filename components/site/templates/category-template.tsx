"use client"
import Link from "next/link"
import { ArrowLeft, ArrowRight, BookOpen } from "lucide-react"
import type { ContentItem } from "@/lib/site-content"
import type { FrontEndThemeContext } from "@/lib/site-theme"
import type { WidgetItem } from "@/widgets/types"
import { ThemeDynamicStyles } from "@/components/site/theme-dynamic-styles"
import { SiteHeader } from "@/components/site/header/site-header"
import { SiteFooter } from "@/components/site/footer/site-footer"
import { SidebarWidgetRenderer } from "@/components/site/sidebar/sidebar-renderer"
import {
  DEFAULT_THEME,
  getCategoryUrl,
  localizePath,
  t,
} from "@/components/site/utils"
import {
  getArchiveSettings,
  archivePageNumbers,
} from "@/lib/customizer/archive"
import { CategoryCard } from "./category-card"
export interface CategoryTemplateProps {
  category: {
    id: string
    name: string
    slug: string
    description: string
    count: number
  }
  posts: ContentItem[]
  totalPosts: number
  totalPages: number
  currentPage: number
  theme?: FrontEndThemeContext
  sidebarWidgets?: WidgetItem[]
  categoryWidgets?: WidgetItem[]
  footerWidgets?: {
    col1?: WidgetItem[]
    col2?: WidgetItem[]
    col3?: WidgetItem[]
    col4?: WidgetItem[]
  }
}

export function CategoryTemplate({
  category,
  posts,
  totalPosts,
  totalPages,
  currentPage,
  theme = DEFAULT_THEME,
  categoryWidgets = [],
  footerWidgets,
}: CategoryTemplateProps) {
  const settings = getArchiveSettings(theme.mods)
  const locale = theme.locale || theme.defaultLocale || "en"
  const widgets = categoryWidgets.filter(
    (w) => !w.locale || w.locale === "all" || w.locale === locale
  )
  const hasSidebar = settings.archiveSidebar !== "none" && widgets.length > 0
  const sidebarFirst =
    (settings.archiveSidebar === "left") !== (theme.direction === "rtl")
  const featured = settings.archiveFeatured ? posts[0] : undefined
  const remaining = featured ? posts.slice(1) : posts
  const columns =
    settings.archiveColumns === 1
      ? ""
      : settings.archiveColumns === 2
        ? "md:grid-cols-2"
        : settings.archiveColumns === 3
          ? "md:grid-cols-2 xl:grid-cols-3"
          : "sm:grid-cols-2 xl:grid-cols-4"
  const link = (page: number) =>
    getCategoryUrl(category.slug, theme) + (page > 1 ? `?page=${page}` : "")
  return (
    <div
      className={`flex min-h-screen flex-col bg-[var(--theme-bg)] text-[var(--theme-text)] ${theme.darkMode ? "dark" : ""}`}
      dir={theme.direction || "ltr"}
    >
      {theme.mods && (
        <ThemeDynamicStyles mods={theme.mods} themeSlug={theme.themeSlug} />
      )}
      <SiteHeader theme={theme} />
      <main
        className="mx-auto w-full flex-1 px-4 py-6 sm:px-6"
        style={{ maxWidth: settings.archiveContentWidth }}
      >
        <nav
          aria-label={t("site.archive_breadcrumb", theme, "")}
          className="mb-4 flex flex-wrap items-center gap-2 text-xs text-[var(--theme-muted)]"
        >
          <Link href={localizePath("/", theme.locale, theme.defaultLocale)}>
            {t("site.home", theme, "")}
          </Link>
          <span aria-hidden="true">/</span>
          <span>{category.name}</span>
        </nav>
        <header className="mb-6 border-b border-[var(--theme-border)] pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl leading-tight font-bold text-[var(--theme-heading)] sm:text-3xl">
              {category.name}
            </h1>
            <span className="text-xs text-[var(--theme-muted)]">
              {totalPosts.toLocaleString(locale)}{" "}
              {t(totalPosts === 1 ? "site.story" : "site.stories", theme, "")}
            </span>
          </div>
          {category.description && (
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[var(--theme-muted)]">
              {category.description}
            </p>
          )}
        </header>
        <div
          className={
            hasSidebar
              ? "grid grid-cols-1 items-start gap-6 lg:grid-cols-12"
              : "min-w-0"
          }
        >
          <div className={hasSidebar ? "min-w-0 lg:col-span-8" : "min-w-0"}>
            {posts.length === 0 ? (
              <div className="border border-dashed border-[var(--theme-border)] p-8 text-center">
                <BookOpen className="mx-auto mb-3 size-8" />
                <p>{t("site.no_stories_found", theme, "")}</p>
              </div>
            ) : (
              <>
                {featured && (
                  <div style={{ marginBottom: settings.archiveGap }}>
                    <CategoryCard
                      post={featured}
                      theme={theme}
                      settings={settings}
                      featured
                    />
                  </div>
                )}
                <div
                  className={`grid grid-cols-1 ${settings.archiveLayout === "grid" ? columns : ""}`}
                  style={{ gap: settings.archiveGap }}
                >
                  {remaining.map((post) => (
                    <CategoryCard
                      key={post.id}
                      post={post}
                      theme={theme}
                      settings={settings}
                    />
                  ))}
                </div>
              </>
            )}
            {totalPages > 1 && (
              <nav
                aria-label={t("site.archive_pagination", theme, "")}
                className="mt-6 flex flex-wrap items-center justify-center gap-2 border-t border-[var(--theme-border)] pt-4 text-sm"
              >
                {currentPage > 1 && (
                  <Link
                    href={link(currentPage - 1)}
                    aria-label={t("site.prev", theme, "")}
                    className="p-2"
                  >
                    <ArrowLeft className="size-4 rtl:rotate-180" />
                  </Link>
                )}
                {archivePageNumbers(totalPages, currentPage).map(
                  (page, index) =>
                    page === null ? (
                      <span key={`gap-${index}`} aria-hidden="true">
                        &hellip;
                      </span>
                    ) : (
                      <Link
                        key={page}
                        href={link(page)}
                        aria-current={page === currentPage ? "page" : undefined}
                        aria-label={t("site.archive_page", theme, "").replace(
                          "{page}",
                          String(page)
                        )}
                        className={`flex size-8 items-center justify-center border border-[var(--theme-border)] ${page === currentPage ? "bg-[var(--theme-primary)] text-white" : "text-[var(--theme-heading)]"}`}
                      >
                        {page.toLocaleString(locale)}
                      </Link>
                    )
                )}
                {currentPage < totalPages && (
                  <Link
                    href={link(currentPage + 1)}
                    aria-label={t("site.next", theme, "")}
                    className="p-2"
                  >
                    <ArrowRight className="size-4 rtl:rotate-180" />
                  </Link>
                )}
              </nav>
            )}
          </div>
          {hasSidebar && (
            <aside
              className={`min-w-0 space-y-5 lg:col-span-4 ${sidebarFirst ? "lg:order-first" : ""}`}
            >
              {widgets.map((widget) => (
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
  )
}
