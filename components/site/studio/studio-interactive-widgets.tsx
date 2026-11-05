import { useState } from "react"

import type { StudioElement } from "@/lib/studio/types"

export function AtomicTabsView({
  el,
  dict,
}: {
  el: StudioElement
  dict?: Record<string, string>
}) {
  const items = el.settings.tabsItems || []
  const [activeIdx, setActiveIdx] = useState(0)
  if (!items.length) return null
  const activeItem = items[activeIdx] || items[0]

  return (
    <div className="overflow-hidden rounded-lg border border-theme-border bg-theme-surface">
      <div className="flex border-b border-theme-border bg-slate-50/60 dark:bg-slate-900/40">
        {items.map((tab, idx) => (
          <button
            key={tab.id}
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setActiveIdx(idx)
            }}
            className={`border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
              idx === activeIdx
                ? "border-blue-600 bg-white text-blue-600 dark:bg-slate-900"
                : "border-transparent text-theme-muted hover:text-theme-heading"
            }`}
          >
            {tab.title || `${dict?.["admin.studio.tab_item"] || ""} ${idx + 1}`}
          </button>
        ))}
      </div>
      <div className="p-4 text-sm leading-relaxed text-theme-text">
        {activeItem?.content ||
          dict?.["admin.studio.placeholder.tab_content"] ||
          ""}
      </div>
    </div>
  )
}

export function AtomicAccordionView({
  el,
  dict,
}: {
  el: StudioElement
  dict?: Record<string, string>
}) {
  const items = el.settings.accordionItems || []
  const [openIdx, setOpenIdx] = useState<number | null>(0)
  if (!items.length) return null

  return (
    <div className="divide-y divide-theme-border overflow-hidden rounded-lg border border-theme-border bg-theme-surface">
      {items.map((item, idx) => {
        const isOpen = openIdx === idx
        return (
          <div key={item.id}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setOpenIdx(isOpen ? null : idx)
              }}
              className="flex w-full items-center justify-between px-4 py-3 text-start text-sm font-semibold text-theme-heading hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
            >
              <span>
                {item.title ||
                  `${dict?.["admin.studio.accordion_item"] || ""} ${idx + 1}`}
              </span>
              <span className="text-xs text-theme-muted">
                {isOpen ? "−" : "+"}
              </span>
            </button>
            {isOpen && (
              <div className="px-4 pt-1 pb-3.5 text-sm leading-relaxed text-theme-text">
                {item.content ||
                  dict?.["admin.studio.placeholder.accordion_content"] ||
                  ""}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
