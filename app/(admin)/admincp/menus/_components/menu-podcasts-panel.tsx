"use client"

import { useState } from "react"
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"

export type PodcastMenuLink = { title: string; url: string }

export function MenuPodcastsPanel({
  directory,
  onAddItems,
  dict,
  direction,
}: {
  directory: PodcastMenuLink
  onAddItems: (items: PodcastMenuLink[]) => void
  dict: Record<string, string>
  direction: "rtl" | "ltr"
}) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(false)
  const CollapseIcon = direction === "rtl" ? ChevronLeft : ChevronRight
  return (
    <div className="rounded-[3px] border border-[#c3c4c7] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.04)]">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between border-b border-[#c3c4c7] bg-[#f6f7f7] px-3.5 py-2.5 font-semibold text-[#2c3338] hover:bg-[#f0f0f1]"
      >
        <span>{dict["admin.menus.podcasts"] || ""}</span>
        {open ? (
          <ChevronDown className="size-4" />
        ) : (
          <CollapseIcon className="size-4" />
        )}
      </button>
      {open && (
        <div className="space-y-3 p-3.5">
          <p className="text-[12px] text-[#646970]">
            {dict["admin.menus.podcasts_help"] || ""}
          </p>
          <label className="flex cursor-pointer items-center gap-2 border border-[#dcdcde] p-2.5">
            <input
              type="checkbox"
              checked={selected}
              onChange={(event) => setSelected(event.target.checked)}
              className="h-4 w-4 rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
            />
            <span className="text-[#2c3338]">{directory.title}</span>
          </label>
          <div className="flex justify-end">
            <button
              type="button"
              disabled={!selected}
              onClick={() => {
                onAddItems([directory])
                setSelected(false)
              }}
              className="rounded-[3px] border border-[#2271b1] bg-[#f6f7f7] px-3 py-1 text-[12px] font-medium text-[#2271b1] transition-colors hover:bg-[#f0f0f1] disabled:opacity-50"
            >
              {dict["admin.menus.add_to_menu"] || ""}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
