"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import manifest from "./widget.json";
import type { WidgetModule, WidgetAdminFormProps, WidgetRenderProps } from "../types";

export function CategoriesAdminForm({ item, onChange, dict, direction }: WidgetAdminFormProps) {
  const isRtl = direction === "rtl";
  const displayStyle = item.config?.displayStyle || "list";
  const showCount = item.config?.showCount !== false;
  const limit = item.config?.limit || 10;

  return (
    <div className="space-y-3 text-start">
      <div>
        <label className="block text-[12px] font-medium text-[#50575e] mb-1">
          {dict?.["admin.widgets.widget_title"] || (isRtl ? "عنوان الأداة" : "Widget Title")}
        </label>
        <input
          type="text"
          value={item.title}
          onChange={(e) => onChange({ title: e.target.value })}
          className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[11px] font-medium text-[#50575e] mb-1">
            {isRtl ? "نمط العرض" : "Display Format"}
          </label>
          <select
            value={displayStyle}
            onChange={(e) => onChange({ config: { ...item.config, displayStyle: e.target.value } })}
            className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-xs text-[#2c3338]"
          >
            <option value="list">{isRtl ? "قائمة عمودية" : "Vertical List"}</option>
            <option value="pills">{isRtl ? "سحابة شارات (Pills)" : "Pills / Badge Cloud"}</option>
            <option value="dropdown">{isRtl ? "قائمة منسدلة سريعة" : "Quick Dropdown"}</option>
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-medium text-[#50575e] mb-1">
            {isRtl ? "الحد الأقصى للأقسام" : "Max Categories"}
          </label>
          <input
            type="number"
            min="1"
            max="30"
            value={limit}
            onChange={(e) => onChange({ config: { ...item.config, limit: Number(e.target.value) || 10 } })}
            className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-xs text-[#2c3338]"
          />
        </div>
      </div>

      <div>
        <label className="flex items-center gap-2 text-xs text-[#2c3338] cursor-pointer">
          <input
            type="checkbox"
            checked={showCount}
            onChange={(e) => onChange({ config: { ...item.config, showCount: e.target.checked } })}
            className="rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
          />
          <span>{isRtl ? "إظهار عدد المقالات بجانب كل قسم" : "Show story count per category"}</span>
        </label>
      </div>
    </div>
  );
}

export function CategoriesRender({ item, theme, posts = [] }: WidgetRenderProps) {
  const isRtl = theme?.direction === "rtl";
  const router = useRouter();
  const displayStyle = item.config?.displayStyle || "list";
  const showCount = item.config?.showCount !== false;
  const limit = item.config?.limit || 10;

  // Aggregate category counts from posts
  const counts: Record<string, number> = {};
  for (const post of posts) {
    if (post.categories) {
      for (const cat of post.categories) {
        counts[cat] = (counts[cat] || 0) + 1;
      }
    }
  }

  const categoryEntries = Object.entries(counts).slice(0, limit);

  return (
    <div className="theme-widget rounded-xl border border-[var(--theme-widget-border,var(--theme-border,#e2e8f0))] bg-[var(--theme-widget-bg,var(--theme-surface,#ffffff))] text-[var(--theme-widget-text,var(--theme-text,#1d2327))] p-4 shadow-sm text-start">
      <div className="flex items-center justify-between border-b border-[var(--theme-border,#e2e8f0)] pb-2 mb-3">
        <h4 className="theme-widget-title text-xs font-bold uppercase tracking-wider text-[var(--theme-widget-title-color,var(--theme-heading,#0f172a))]">
          {item.title || (isRtl ? "التصنيفات" : "Categories")}
        </h4>
        <span className="text-[10px] text-[var(--theme-muted,#64748b)] font-mono">
          {categoryEntries.length} {isRtl ? "أقسام" : "sections"}
        </span>
      </div>

      {displayStyle === "dropdown" ? (
        <select
          onChange={(e) => {
            if (e.target.value) router.push(`/category/${e.target.value}`);
          }}
          className="w-full h-9 rounded-lg border border-[var(--theme-border,#e2e8f0)] bg-[var(--theme-bg,#f8f7f4)] text-xs text-[var(--theme-text,#1d2327)] px-3 focus:outline-none focus:border-[var(--theme-primary,#2271b1)]"
        >
          <option value="">{isRtl ? "اختر قسماً للتصفح..." : "Select category..."}</option>
          {categoryEntries.map(([cat, count]) => {
            const slug = cat.toLowerCase().replace(/\s+/g, "-");
            return (
              <option key={cat} value={slug}>
                {cat} {showCount ? `(${count})` : ""}
              </option>
            );
          })}
        </select>
      ) : displayStyle === "pills" ? (
        <div className="flex flex-wrap gap-1.5">
          {categoryEntries.length ? (
            categoryEntries.map(([cat, count]) => {
              const slug = cat.toLowerCase().replace(/\s+/g, "-");
              return (
                <Link
                  key={cat}
                  href={`/category/${slug}`}
                  className="rounded-full border border-[var(--theme-border,#e2e8f0)] bg-[var(--theme-bg,#f8f7f4)] px-2.5 py-1 text-[11px] font-semibold text-[var(--theme-text,#1d2327)] hover:border-[var(--theme-primary,#2271b1)] hover:text-[var(--theme-primary,#2271b1)] transition-colors flex items-center gap-1.5"
                >
                  <span>{cat}</span>
                  {showCount && (
                    <span className="text-[9px] font-mono opacity-60">
                      {count}
                    </span>
                  )}
                </Link>
              );
            })
          ) : (
            <span className="text-xs text-[var(--theme-muted,#64748b)]">{isRtl ? "لا توجد تصنيفات حالياً." : "No categories found."}</span>
          )}
        </div>
      ) : (
        /* Vertical List */
        <ul className="divide-y divide-[var(--theme-border,#e2e8f0)] text-xs">
          {categoryEntries.length ? (
            categoryEntries.map(([cat, count]) => {
              const slug = cat.toLowerCase().replace(/\s+/g, "-");
              return (
                <li key={cat} className="py-2 flex items-center justify-between group">
                  <Link
                    href={`/category/${slug}`}
                    className="text-[var(--theme-text,#1d2327)] group-hover:text-[var(--theme-primary,#2271b1)] group-hover:underline font-medium transition-colors"
                  >
                    {cat}
                  </Link>
                  {showCount && (
                    <span className="text-[10px] text-[var(--theme-muted,#64748b)] bg-[var(--theme-bg,#f8f7f4)] border border-[var(--theme-border,#e2e8f0)] px-2 py-0.5 rounded-full font-mono">
                      {count}
                    </span>
                  )}
                </li>
              );
            })
          ) : (
            <li className="py-2 text-[var(--theme-muted,#64748b)] text-xs">{isRtl ? "لا توجد تصنيفات حالياً." : "No categories found."}</li>
          )}
        </ul>
      )}
    </div>
  );
}

export const categoriesWidgetModule: WidgetModule = {
  manifest: manifest as any,
  AdminForm: CategoriesAdminForm,
  render: CategoriesRender,
};

export default categoriesWidgetModule;
