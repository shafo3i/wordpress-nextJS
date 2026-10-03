"use client";

import React from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import manifest from "./widget.json";
import type { WidgetModule, WidgetAdminFormProps, WidgetRenderProps } from "../types";
import { formatDate, getPostUrl, t } from "@/components/site/utils";

export function RelatedPostsAdminForm({ item, onChange, dict, direction }: WidgetAdminFormProps) {
  const isRtl = direction === "rtl";
  const count = item.config?.count || 3;
  const categoryFilter = item.config?.categoryFilter || "";
  const showThumbnail = item.config?.showThumbnail !== false;
  const showDate = item.config?.showDate !== false;

  return (
    <div className="space-y-3 text-start">
      <div>
        <label className="block text-[12px] font-medium text-[#50575e] mb-1">
          {dict?.["admin.widgets.widget_title"] || (isRtl ? "عنوان الأداة" : "Widget Title")}
        </label>
        <input
          type="text"
          value={item.title || ""}
          placeholder={dict?.["admin.widgets.descriptor.plugin_related_posts.name"] || manifest.name}
          onChange={(e) => onChange({ title: e.target.value })}
          className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[11px] font-medium text-[#50575e] mb-1">
            {isRtl ? "تصفية حسب قسم معين" : "Category Filter"}
          </label>
          <input
            type="text"
            value={categoryFilter}
            placeholder={isRtl ? "مثال: تقنية، اقتصاد" : "e.g. tech, business"}
            onChange={(e) => onChange({ config: { ...item.config, categoryFilter: e.target.value } })}
            className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-xs text-[#2c3338]"
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-[#50575e] mb-1">
            {isRtl ? "عدد المقالات" : "Number of Stories"}
          </label>
          <input
            type="number"
            min="1"
            max="8"
            value={count}
            onChange={(e) => onChange({ config: { ...item.config, count: Number(e.target.value) || 3 } })}
            className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-xs text-[#2c3338]"
          />
        </div>
      </div>

      <div className="flex gap-4 pt-1">
        <label className="flex items-center gap-1.5 text-xs text-[#2c3338] cursor-pointer">
          <input
            type="checkbox"
            checked={showThumbnail}
            onChange={(e) => onChange({ config: { ...item.config, showThumbnail: e.target.checked } })}
            className="rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
          />
          <span>{isRtl ? "عرض الصورة البارزة" : "Show Thumbnail"}</span>
        </label>
        <label className="flex items-center gap-1.5 text-xs text-[#2c3338] cursor-pointer">
          <input
            type="checkbox"
            checked={showDate}
            onChange={(e) => onChange({ config: { ...item.config, showDate: e.target.checked } })}
            className="rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
          />
          <span>{isRtl ? "عرض التاريخ" : "Show Date"}</span>
        </label>
      </div>
    </div>
  );
}

export function RelatedPostsRender({ item, theme, posts = [] }: WidgetRenderProps) {
  const isRtl = theme?.direction === "rtl";
  const count = item.config?.count || 3;
  const categoryFilter = item.config?.categoryFilter?.trim().toLowerCase();
  const showThumbnail = item.config?.showThumbnail !== false;
  const showDate = item.config?.showDate !== false;

  const filtered = categoryFilter
    ? posts.filter((p) => p.categories?.some((c) => c.toLowerCase().includes(categoryFilter)))
    : posts;
  const displayPosts = (filtered.length > 0 ? filtered : posts).slice(0, count);

  return (
    <div className="theme-widget rounded-xl border border-[var(--theme-widget-border,var(--theme-border,#e2e8f0))] bg-[var(--theme-widget-bg,var(--theme-surface,#ffffff))] text-[var(--theme-widget-text,var(--theme-text,#1d2327))] p-4 shadow-sm text-start">
      <div className="flex items-center gap-1.5 text-[var(--theme-primary,#2271b1)] mb-1">
        <Sparkles className="size-3.5" />
        <span className="text-[10px] font-bold uppercase tracking-wider">
          {t("site.contextual_feed", theme, "Contextual Feed")}
        </span>
      </div>
      <h4 className="theme-widget-title text-xs font-bold text-[var(--theme-widget-title-color,var(--theme-heading,#0f172a))] mb-2.5">
        {item.title || t("site.related_stories", theme, "Related Stories")}
      </h4>
      <div className="space-y-2">
        {displayPosts.map((p) => (
          <Link
            key={p.id}
            href={getPostUrl(p.slug, theme)}
            className="flex items-center gap-2.5 p-2 rounded-lg bg-[var(--theme-bg,#f8f7f4)] border border-[var(--theme-border,#e2e8f0)] hover:border-[var(--theme-primary,#2271b1)] transition-colors group"
          >
            {showThumbnail && p.imageUrl && (
              <img
                src={p.imageUrl}
                alt={p.title}
                className="size-12 rounded object-cover flex-shrink-0"
                loading="lazy"
              />
            )}
            <div className="flex-1 min-w-0">
              <span className="text-[9px] uppercase font-bold text-[var(--theme-primary,#2271b1)] block truncate">
                {p.categories?.[0] || t("site.featured_story", theme, "Featured")}
              </span>
              <span className="text-xs font-bold text-[var(--theme-heading,#0f172a)] line-clamp-2 mt-0.5 group-hover:text-[var(--theme-primary,#2271b1)] transition-colors">
                {p.title}
              </span>
              {showDate && (
                <span className="text-[9px] text-[var(--theme-muted,#64748b)] font-mono block mt-0.5">
                  {formatDate(p.date, theme?.locale)}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export const relatedPostsWidgetModule: WidgetModule = {
  manifest: manifest as any,
  AdminForm: RelatedPostsAdminForm,
  render: RelatedPostsRender,
};

export default relatedPostsWidgetModule;
