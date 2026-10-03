"use client";

import React from "react";
import Link from "next/link";
import manifest from "./widget.json";
import type { WidgetModule, WidgetAdminFormProps, WidgetRenderProps, WidgetDisplayStyle } from "../types";
import { formatDate, getExcerpt, isSerifHeading, getPostUrl, t } from "@/components/site/utils";

const STYLE_OPTIONS = [
  { id: "list", label: "Classic List", desc: "Detailed vertical list" },
  { id: "card", label: "Cards", desc: "Individual boxed cards" },
  { id: "compact", label: "Compact", desc: "Minimal headline stream" },
  { id: "numbered", label: "Numbered", desc: "Ranked ordered list" },
];

export function RecentPostsAdminForm({ item, onChange, dict }: WidgetAdminFormProps) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-[12px] font-medium text-[#50575e] mb-1">
          {dict?.["admin.widgets.widget_title"] || "Widget Title"}
        </label>
        <input
          type="text"
          value={item.title}
          onChange={(e) => onChange({ title: e.target.value })}
          className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
        />
      </div>

      <div className="border-t border-[#f0f0f1] pt-2 space-y-2">
        <label className="block text-[12px] font-medium text-[#50575e]">
          {dict?.["admin.widgets.display_style"] || "Display Style:"}
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {STYLE_OPTIONS.map((opt) => {
            const isSel = (item.displayStyle || "list") === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChange({ displayStyle: opt.id as WidgetDisplayStyle })}
                className={`p-2 rounded border text-start transition-all cursor-pointer ${
                  isSel
                    ? "border-[#2271b1] bg-[#f0f6fc] ring-1 ring-[#2271b1]"
                    : "border-[#dcdcde] bg-white hover:border-[#8c8f94]"
                }`}
              >
                <span className={`block text-[11px] font-semibold ${isSel ? "text-[#2271b1]" : "text-[#1d2327]"}`}>
                  {opt.label}
                </span>
                <span className="text-[10px] text-[#646970] block">{opt.desc}</span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-4 pt-1">
          <label className="flex items-center gap-1.5 text-[11px] text-[#50575e] cursor-pointer">
            <input
              type="checkbox"
              checked={item.showThumbnail !== false}
              onChange={(e) => onChange({ showThumbnail: e.target.checked })}
              className="rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
            />
            {dict?.["admin.widgets.show_thumbnails"] || "Show Thumbnail"}
          </label>
          <label className="flex items-center gap-1.5 text-[11px] text-[#50575e] cursor-pointer">
            <input
              type="checkbox"
              checked={item.showDate !== false}
              onChange={(e) => onChange({ showDate: e.target.checked })}
              className="rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
            />
            {dict?.["admin.widgets.show_date"] || "Show Date"}
          </label>
          <label className="flex items-center gap-1.5 text-[11px] text-[#50575e] cursor-pointer">
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
          <label className="block text-[11px] font-medium text-[#50575e] mb-1">
            {dict?.["admin.widgets.category_filter"] || (dict?.direction === "rtl" ? "تصفية حسب التصنيف" : "Filter by Category")}
          </label>
          <input
            type="text"
            value={item.config?.categoryFilter || ""}
            placeholder={dict?.direction === "rtl" ? "مثال: سياسة، اقتصاد" : "e.g. politics, business"}
            onChange={(e) => onChange({ config: { ...item.config, categoryFilter: e.target.value } })}
            className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-xs text-[#2c3338]"
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-[#50575e] mb-1">
            {dict?.["admin.widgets.number_of_posts"] || "Number of posts:"}
          </label>
          <input
            type="number"
            min="1"
            max="15"
            value={item.count || 5}
            onChange={(e) => onChange({ count: Number(e.target.value) || 5 })}
            className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px] text-[#2c3338]"
          />
        </div>
      </div>
    </div>
  );
}

export function RecentPostsRender({ item, theme, posts = [] }: WidgetRenderProps) {
  const catFilter = item.config?.categoryFilter?.trim().toLowerCase();
  const filteredPosts = catFilter
    ? posts.filter((p) => p.categories?.some((c) => c.toLowerCase().includes(catFilter)))
    : posts;
  const displayPosts = (filteredPosts.length > 0 ? filteredPosts : posts).slice(0, item.count || 5);
  const isSerif = theme ? isSerifHeading(theme) : false;
  const style = item.displayStyle || "list";

  return (
    <div className="theme-widget rounded-xl border border-[var(--theme-widget-border,var(--theme-border,#e2e8f0))] bg-[var(--theme-widget-bg,var(--theme-surface,#ffffff))] text-[var(--theme-widget-text,var(--theme-text,#1d2327))] p-4 shadow-sm text-start">
      <div className="flex items-center justify-between border-b border-[var(--theme-border,#e2e8f0)] pb-2.5 mb-3">
        <h4 className="theme-widget-title text-xs font-bold uppercase tracking-wider text-[var(--theme-widget-title-color,var(--theme-heading,#0f172a))]">
          {item.title}
        </h4>
        <span className="text-[10px] text-[var(--theme-muted,#64748b)] font-mono">
          {displayPosts.length} {t("site.stories", theme, "stories")}
        </span>
      </div>

      {/* Numbered Style */}
      {style === "numbered" ? (
        <ol className="divide-y divide-[var(--theme-border,#e2e8f0)]">
          {displayPosts.map((post, idx) => (
            <li key={post.id} className="py-2.5 flex items-start gap-3 group">
              <span
                style={{ color: theme?.primaryColor || "var(--theme-primary, #2271b1)" }}
                className="font-mono text-xs font-black w-4 flex-shrink-0"
              >
                {String(idx + 1).padStart(2, "0")}
              </span>
              <div className="flex-1 min-w-0">
                <Link
                  href={getPostUrl(post.slug, theme)}
                  className={`text-xs font-bold leading-snug hover:underline block text-[var(--theme-heading,#0f172a)] hover:text-[var(--theme-primary,#2271b1)] line-clamp-2 transition-colors ${
                    isSerif ? "font-serif" : "font-sans"
                  }`}
                >
                  {post.title}
                </Link>
                {item.showDate !== false && (
                  <span className="text-[10px] text-[var(--theme-muted,#64748b)] font-mono block mt-0.5">
                    {formatDate(post.date, theme?.locale)}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ol>
      ) : style === "compact" ? (
        <div className="space-y-2 divide-y divide-[var(--theme-border,#e2e8f0)]">
          {displayPosts.map((post) => (
            <div key={post.id} className="pt-2 first:pt-0">
              <Link
                href={getPostUrl(post.slug, theme)}
                className="text-xs font-medium leading-snug hover:underline block text-[var(--theme-heading,#0f172a)] hover:text-[var(--theme-primary,#2271b1)] transition-colors"
              >
                • {post.title}
              </Link>
              {item.showDate !== false && (
                <span className="text-[10px] text-[var(--theme-muted,#64748b)] font-mono block mt-0.5 ml-2">
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
              className="rounded-lg border border-[var(--theme-border,#e2e8f0)] bg-[var(--theme-bg,#f8f7f4)] p-2.5 hover:border-[var(--theme-primary,#2271b1)] transition-colors"
            >
              {item.showThumbnail !== false && post.imageUrl && (
                <div className="aspect-[16/9] w-full rounded overflow-hidden mb-2 bg-[var(--theme-surface,#ffffff)]">
                  <img
                    src={post.imageUrl}
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <Link
                href={getPostUrl(post.slug, theme)}
                className={`text-xs font-semibold leading-snug hover:underline block text-[var(--theme-heading,#0f172a)] hover:text-[var(--theme-primary,#2271b1)] line-clamp-2 transition-colors ${
                  isSerif ? "font-serif" : "font-sans"
                }`}
              >
                {post.title}
              </Link>
              {item.showExcerpt && (
                <p className="text-[11px] text-[var(--theme-muted,#64748b)] mt-1 line-clamp-2 leading-relaxed">
                  {getExcerpt(post, 80)}
                </p>
              )}
              {item.showDate !== false && (
                <span className="text-[10px] text-[var(--theme-muted,#64748b)] font-mono block mt-1">
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
            <div key={post.id} className="flex gap-2.5 items-start group">
              {item.showThumbnail !== false && post.imageUrl && (
                <img
                  src={post.imageUrl}
                  alt={post.title}
                  className="size-12 rounded object-cover flex-shrink-0 bg-[var(--theme-bg,#f8f7f4)]"
                />
              )}
              <div className="flex-1 min-w-0">
                <Link
                  href={getPostUrl(post.slug, theme)}
                  className={`text-xs font-bold leading-snug hover:underline block text-[var(--theme-heading,#0f172a)] hover:text-[var(--theme-primary,#2271b1)] line-clamp-2 transition-colors ${
                    isSerif ? "font-serif" : "font-sans"
                  }`}
                >
                  {post.title}
                </Link>
                {item.showExcerpt && (
                  <p className="text-[11px] text-[var(--theme-muted,#64748b)] line-clamp-1 mt-0.5">
                    {getExcerpt(post, 60)}
                  </p>
                )}
                {item.showDate !== false && (
                  <span className="text-[10px] text-[var(--theme-muted,#64748b)] font-mono block mt-0.5">
                    {formatDate(post.date, theme?.locale)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export const recentPostsWidgetModule: WidgetModule = {
  manifest: manifest as any,
  AdminForm: RecentPostsAdminForm,
  render: RecentPostsRender,
};

export default recentPostsWidgetModule;
