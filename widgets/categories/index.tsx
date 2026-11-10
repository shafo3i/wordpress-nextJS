"use client"

import React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import manifest from "./widget.json"
import type {
  WidgetModule,
  WidgetAdminFormProps,
  WidgetRenderProps,
} from "../types"

export function CategoriesAdminForm({
  item,
  onChange,
  dict,
  direction,
}: WidgetAdminFormProps) {
  const isRtl = direction === "rtl"
  const displayStyle = item.config?.displayStyle || "list"
  const limit = item.config?.limit || 10

  return (
    <div className="space-y-3 text-start">
      <div>
        <label className="mb-1 block text-[0.75rem] font-medium text-[#50575e]">
          {dict?.["admin.widgets.widget_title"] ||
            (isRtl ? "عنوان الأداة" : "Widget Title")}
        </label>
        <input
          type="text"
          value={item.title}
          onChange={(e) => onChange({ title: e.target.value })}
          className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[0.8125rem] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-[0.6875rem] font-medium text-[#50575e]">
            {isRtl ? "نمط العرض" : "Display Format"}
          </label>
          <select
            value={displayStyle}
            onChange={(e) =>
              onChange({
                config: { ...item.config, displayStyle: e.target.value },
              })
            }
            className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-xs text-[#2c3338]"
          >
            <option value="list">
              {isRtl ? "قائمة عمودية" : "Vertical List"}
            </option>
            <option value="pills">
              {isRtl ? "سحابة شارات (Pills)" : "Pills / Badge Cloud"}
            </option>
            <option value="dropdown">
              {isRtl ? "قائمة منسدلة سريعة" : "Quick Dropdown"}
            </option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[0.6875rem] font-medium text-[#50575e]">
            {isRtl ? "الحد الأقصى للأقسام" : "Max Categories"}
          </label>
          <input
            type="number"
            min="1"
            max="30"
            value={limit}
            onChange={(e) =>
              onChange({
                config: { ...item.config, limit: Number(e.target.value) || 10 },
              })
            }
            className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-xs text-[#2c3338]"
          />
        </div>
      </div>
    </div>
  )
}

export function CategoriesRender({
  item,
  theme,
  posts = [],
}: WidgetRenderProps) {
  const isRtl = theme?.direction === "rtl"
  const router = useRouter()
  const displayStyle = item.config?.displayStyle || "list"
  const limit = item.config?.limit || 10

  // Aggregate category counts from posts
  const counts: Record<string, number> = {}
  for (const post of posts) {
    if (post.categories) {
      for (const cat of post.categories) {
        counts[cat] = (counts[cat] || 0) + 1
      }
    }
  }

  const categoryEntries = Object.entries(counts).slice(0, limit)
  if (!categoryEntries.length) return null

  return (
    <div className="theme-widget rounded-xl border border-[var(--theme-widget-border,var(--theme-border))] bg-[var(--theme-widget-bg,var(--theme-surface))] p-4 text-start text-[var(--theme-widget-text,var(--theme-text))] shadow-sm">
      <div className="mb-3 flex items-center justify-between border-b border-[var(--theme-border)] pb-2">
        <h4 className="theme-widget-title text-xs font-bold tracking-wider text-[var(--theme-widget-title-color,var(--theme-heading))] uppercase">
          {item.title || (isRtl ? "التصنيفات" : "Categories")}
        </h4>
      </div>

      {displayStyle === "dropdown" ? (
        <select
          onChange={(e) => {
            if (e.target.value) router.push(`/category/${e.target.value}`)
          }}
          className="theme-input h-9 w-full rounded-lg px-3 text-xs text-[var(--theme-text)] focus:border-[var(--theme-primary)] focus:outline-none"
        >
          <option value="">
            {isRtl ? "اختر قسماً للتصفح..." : "Select category..."}
          </option>
          {categoryEntries.map(([cat]) => {
            const slug = cat.toLowerCase().replace(/\s+/g, "-")
            return (
              <option key={cat} value={slug}>
                {cat}
              </option>
            )
          })}
        </select>
      ) : displayStyle === "pills" ? (
        <div className="flex flex-wrap gap-1.5">
          {categoryEntries.length ? (
            categoryEntries.map(([cat]) => {
              const slug = cat.toLowerCase().replace(/\s+/g, "-")
              return (
                <Link
                  key={cat}
                  href={`/category/${slug}`}
                  className="flex items-center gap-1.5 rounded-full border border-theme-border bg-theme-surface px-2.5 py-1 text-[0.6875rem] font-semibold text-[var(--theme-text)] transition-colors hover:border-[var(--theme-primary)] hover:text-[var(--theme-primary)]"
                >
                  <span>{cat}</span>
                </Link>
              )
            })
          ) : (
            <span className="text-xs text-[var(--theme-muted)]">
              {isRtl ? "لا توجد تصنيفات حالياً." : "No categories found."}
            </span>
          )}
        </div>
      ) : (
        /* Vertical List */
        <ul className="divide-y divide-[var(--theme-border)] text-xs">
          {categoryEntries.length ? (
            categoryEntries.map(([cat]) => {
              const slug = cat.toLowerCase().replace(/\s+/g, "-")
              return (
                <li
                  key={cat}
                  className="group flex items-center justify-between py-2"
                >
                  <Link
                    href={`/category/${slug}`}
                    className="font-medium text-[var(--theme-text)] transition-colors group-hover:text-[var(--theme-primary)] group-hover:underline"
                  >
                    {cat}
                  </Link>
                </li>
              )
            })
          ) : (
            <li className="py-2 text-xs text-[var(--theme-muted)]">
              {isRtl ? "لا توجد تصنيفات حالياً." : "No categories found."}
            </li>
          )}
        </ul>
      )}
    </div>
  )
}

export const categoriesWidgetModule: WidgetModule = {
  manifest: manifest as WidgetModule["manifest"],
  AdminForm: CategoriesAdminForm,
  render: CategoriesRender,
}

export default categoriesWidgetModule
