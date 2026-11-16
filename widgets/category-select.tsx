"use client"
import { useId } from "react"
import type { WidgetAdminFormProps } from "./types"

export function WidgetCategorySelect({ item, onChange, categories = [], dict }: WidgetAdminFormProps) {
  const id = useId()
  const selected = typeof item.config?.categoryId === "string" ? item.config.categoryId : ""
  const legacy = typeof item.config?.categoryFilter === "string" ? item.config.categoryFilter : ""
  const options = categories.filter((category) => !item.locale || item.locale === "all" || !category.languageCode || category.languageCode === item.locale)
  const unavailable = selected && !options.some((category) => category.id === selected)
  return <div>
    <label htmlFor={id} className="mb-1 block text-[0.6875rem] font-medium text-[#50575e]">{dict?.["admin.widgets.category_filter"]}</label>
    <select id={id} value={selected || (legacy ? "legacy" : "")} onChange={(event) => onChange({ config: { ...item.config, categoryId: event.target.value, categoryFilter: "" } })}
      className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-xs text-[#2c3338]">
      <option value="">{dict?.["admin.posts.all_categories"]}</option>
      {!selected && legacy && <option value="legacy" disabled>{dict?.["admin.widgets.category_filter_legacy"]} {legacy}</option>}
      {unavailable && <option value={selected} disabled>{categories.find((category) => category.id === selected)?.name || dict?.["admin.widgets.category_filter_unavailable"]}</option>}
      {options.map((category) => <option key={category.id} value={category.id}>{category.name}{(!item.locale || item.locale === "all") && category.languageCode ? ` [${category.languageCode.toUpperCase()}]` : ""}</option>)}
    </select>
    {unavailable && <p role="status" className="mt-1 text-xs text-[#646970]">{dict?.["admin.widgets.category_filter_unavailable"]}</p>}
  </div>
}
