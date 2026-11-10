"use client"
import { PostThumbnail } from "@/components/site/post-thumbnail"

import React from "react"
import Link from "next/link"
import manifest from "./widget.json"
import type {
  WidgetModule,
  WidgetAdminFormProps,
  WidgetRenderProps,
  WidgetDisplayStyle,
} from "../types"
import type { ContentItem } from "@/lib/site-content"
import {
  formatDate,
  getExcerpt,
  isSerifHeading,
  getPostUrl,
} from "@/components/site/utils"

const STYLE_OPTIONS = ["list", "card", "compact", "numbered"] as const

export function RecentPostsAdminForm({
  item,
  onChange,
  dict,
}: WidgetAdminFormProps) {
  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-[0.75rem] font-medium text-[#50575e]">
          {dict?.["admin.widgets.widget_title"] || "Widget Title"}
        </label>
        <input
          type="text"
          value={item.title}
          onChange={(e) => onChange({ title: e.target.value })}
          className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[0.8125rem] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
        />
      </div>

      <div className="space-y-2 border-t border-[#f0f0f1] pt-2">
        <label className="block text-[0.75rem] font-medium text-[#50575e]">
          {dict?.["admin.widgets.display_style"] || "Display Style:"}
        </label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {STYLE_OPTIONS.map((opt) => {
            const isSel = (item.displayStyle || "list") === opt
            return (
              <button
                key={opt}
                type="button"
                onClick={() =>
                  onChange({ displayStyle: opt as WidgetDisplayStyle })
                }
                className={`cursor-pointer rounded border p-2 text-start transition-all ${
                  isSel
                    ? "border-[#2271b1] bg-[#f0f6fc] ring-1 ring-[#2271b1]"
                    : "border-[#dcdcde] bg-white hover:border-[#8c8f94]"
                }`}
              >
                <span
                  className={`block text-[0.6875rem] font-semibold ${isSel ? "text-[#2271b1]" : "text-[#1d2327]"}`}
                >
                  {dict?.[`admin.widgets.recent_style.${opt}`]}
                </span>
                <span className="block text-[0.625rem] text-[#646970]">
                  {dict?.[`admin.widgets.recent_style.${opt}.desc`]}
                </span>
              </button>
            )
          })}
        </div>

        <div className="flex flex-wrap gap-4 pt-1">
          <label className="flex cursor-pointer items-center gap-1.5 text-[0.6875rem] text-[#50575e]">
            <input
              type="checkbox"
              checked={item.showThumbnail !== false}
              onChange={(e) => onChange({ showThumbnail: e.target.checked })}
              className="rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
            />
            {dict?.["admin.widgets.show_thumbnails"] || "Show Thumbnail"}
          </label>
          <label className="flex cursor-pointer items-center gap-1.5 text-[0.6875rem] text-[#50575e]">
            <input
              type="checkbox"
              checked={item.showDate !== false}
              onChange={(e) => onChange({ showDate: e.target.checked })}
              className="rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
            />
            {dict?.["admin.widgets.show_date"] || "Show Date"}
          </label>
          <label className="flex cursor-pointer items-center gap-1.5 text-[0.6875rem] text-[#50575e]">
            <input
              type="checkbox"
              checked={Boolean(item.showExcerpt)}
              onChange={(e) => onChange({ showExcerpt: e.target.checked })}
              className="rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
            />
            {dict?.["admin.widgets.show_excerpt"] || "Show Excerpt"}
          </label>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-[0.6875rem] font-medium text-[#50575e]">
            {dict?.["admin.widgets.category_filter"] ||
              (dict?.direction === "rtl"
                ? "تصفية حسب التصنيف"
                : "Filter by Category")}
          </label>
          <input
            type="text"
            value={item.config?.categoryFilter || ""}
            placeholder={
              dict?.direction === "rtl"
                ? "مثال: سياسة، اقتصاد"
                : "e.g. politics, business"
            }
            onChange={(e) =>
              onChange({
                config: { ...item.config, categoryFilter: e.target.value },
              })
            }
            className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-xs text-[#2c3338]"
          />
        </div>
        <div>
          <label className="mb-1 block text-[0.6875rem] font-medium text-[#50575e]">
            {dict?.["admin.widgets.number_of_posts"] || "Number of posts:"}
          </label>
          <input
            type="number"
            min="1"
            max="15"
            value={item.count || 5}
            onChange={(e) => onChange({ count: Number(e.target.value) || 5 })}
            className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[0.8125rem] text-[#2c3338]"
          />
        </div>
      </div>
    </div>
  )
}

export function RecentPostsRender({
  item,
  theme,
  posts = [],
}: WidgetRenderProps) {
  const activeLocale =
    item.locale && item.locale !== "all"
      ? item.locale
      : theme?.locale || theme?.defaultLocale
  const localePosts: ContentItem[] = activeLocale
    ? posts.filter((p) => !p.locale || p.locale === activeLocale)
    : posts
  const pool: ContentItem[] =
    localePosts.length > 0 ? localePosts : (theme?.breakingPosts ?? [])

  const catFilter = item.config?.categoryFilter?.trim().toLowerCase()
  const filteredPosts = catFilter
    ? pool.filter((p) =>
        p.categories?.some((c) => c.toLowerCase().includes(catFilter))
      )
    : pool
  const displayPosts = filteredPosts.slice(0, item.count || 5)
  if (!displayPosts.length) return null

  const isSerif = theme ? isSerifHeading(theme) : false
  const style = item.displayStyle || "list"

  return (
    <div className="theme-widget rounded-xl border border-[var(--theme-widget-border,var(--theme-border))] bg-[var(--theme-widget-bg,var(--theme-surface))] p-4 text-start text-[var(--theme-widget-text,var(--theme-text))] shadow-sm">
      <div className="mb-3 flex items-center justify-between border-b border-[var(--theme-border)] pb-2.5">
        <h4 className="theme-widget-title text-xs font-bold tracking-wider text-[var(--theme-widget-title-color,var(--theme-heading))] uppercase">
          {item.title}
        </h4>
      </div>

      {/* Numbered Style */}
      {style === "numbered" ? (
        <ul className="divide-y divide-[var(--theme-border)]">
          {displayPosts.map((post) => (
            <li key={post.id} className="group flex items-start gap-3 py-2.5">
              <div className="min-w-0 flex-1">
                <Link
                  href={getPostUrl(post.slug, theme)}
                  className={`line-clamp-2 block text-xs leading-snug font-bold text-[var(--theme-heading)] transition-colors hover:text-[var(--theme-primary)] hover:underline ${
                    isSerif ? "font-serif" : "font-sans"
                  }`}
                >
                  {post.title}
                </Link>
                {item.showDate !== false && (
                  <span className="mt-0.5 block font-mono text-[0.625rem] text-[var(--theme-muted)]">
                    {formatDate(post.date, theme?.locale)}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : style === "compact" ? (
        <div className="space-y-2 divide-y divide-[var(--theme-border)]">
          {displayPosts.map((post) => (
            <div key={post.id} className="pt-2 first:pt-0">
              <Link
                href={getPostUrl(post.slug, theme)}
                className="block text-xs leading-snug font-medium text-[var(--theme-heading)] transition-colors hover:text-[var(--theme-primary)] hover:underline"
              >
                • {post.title}
              </Link>
              {item.showDate !== false && (
                <span className="mt-0.5 ml-2 block font-mono text-[0.625rem] text-[var(--theme-muted)]">
                  {formatDate(post.date, theme?.locale)}
                </span>
              )}
            </div>
          ))}
        </div>
      ) : style === "card" ? (
        <div className="space-y-3">
          {displayPosts.map((post) => (
            <div
              key={post.id}
              className="rounded-lg border border-theme-border bg-theme-surface p-2.5 transition-colors hover:border-[var(--theme-primary)]"
            >
              {item.showThumbnail !== false && post.imageUrl && (
                <div className="mb-2 aspect-[16/9] w-full overflow-hidden rounded bg-[var(--theme-surface)]">
                  <PostThumbnail
                    post={post}
                    theme={theme}
                    src={post.imageUrl}
                    alt={post.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <Link
                href={getPostUrl(post.slug, theme)}
                className={`line-clamp-2 block text-xs leading-snug font-semibold text-[var(--theme-heading)] transition-colors hover:text-[var(--theme-primary)] hover:underline ${
                  isSerif ? "font-serif" : "font-sans"
                }`}
              >
                {post.title}
              </Link>
              {item.showExcerpt && (
                <p className="mt-1 line-clamp-2 text-[0.6875rem] leading-relaxed text-[var(--theme-muted)]">
                  {getExcerpt(post, 80)}
                </p>
              )}
              {item.showDate !== false && (
                <span className="mt-1 block font-mono text-[0.625rem] text-[var(--theme-muted)]">
                  {formatDate(post.date, theme?.locale)}
                </span>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* Classic List Style (Default) */
        <div className="space-y-3">
          {displayPosts.map((post) => (
            <div key={post.id} className="group flex items-start gap-2.5">
              {item.showThumbnail !== false && post.imageUrl && (
                <PostThumbnail
                  post={post}
                  theme={theme}
                  src={post.imageUrl}
                  alt={post.title}
                  className="size-12 flex-shrink-0 rounded bg-[var(--theme-bg)] object-cover"
                />
              )}
              <div className="min-w-0 flex-1">
                <Link
                  href={getPostUrl(post.slug, theme)}
                  className={`line-clamp-2 block text-xs leading-snug font-bold text-[var(--theme-heading)] transition-colors hover:text-[var(--theme-primary)] hover:underline ${
                    isSerif ? "font-serif" : "font-sans"
                  }`}
                >
                  {post.title}
                </Link>
                {item.showExcerpt && (
                  <p className="mt-0.5 line-clamp-1 text-[0.6875rem] text-[var(--theme-muted)]">
                    {getExcerpt(post, 60)}
                  </p>
                )}
                {item.showDate !== false && (
                  <span className="mt-0.5 block font-mono text-[0.625rem] text-[var(--theme-muted)]">
                    {formatDate(post.date, theme?.locale)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export const recentPostsWidgetModule: WidgetModule = {
  manifest: manifest as WidgetModule["manifest"],
  AdminForm: RecentPostsAdminForm,
  render: RecentPostsRender,
}

export default recentPostsWidgetModule
