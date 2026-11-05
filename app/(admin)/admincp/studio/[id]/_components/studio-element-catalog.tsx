import {
  getStudioCatalogItems,
  STUDIO_EDITORIAL_TYPES,
  type StudioCatalogGroup,
} from "@/lib/studio/widget-registry"
import { STUDIO_WIDGET_ICONS } from "./studio-widget-icons"
import React, { useState } from "react"
import {
  ChevronDown,
  LayoutGrid,
  Newspaper,
  Puzzle,
  Search,
} from "lucide-react"

import type { StudioWidgetType } from "@/lib/studio/types"

import { BlockWireframeIcon } from "@/app/(admin)/admincp/theme-settings/_components/block-wireframes"

import type { StudioLeftPanelProps } from "./studio-panel-types"
type CatalogWidgetItem = {
  type: StudioWidgetType
  labelKey: string
  icon: React.ReactNode
}

const catalogItems = (group: StudioCatalogGroup): CatalogWidgetItem[] =>
  getStudioCatalogItems(group).map((item) => {
    const Icon = STUDIO_WIDGET_ICONS[item.icon]
    return {
      type: item.type,
      labelKey: item.labelKey,
      icon: <Icon className="size-5 stroke-[1.5]" />,
    }
  })
const ATOMIC_ELEMENTS = catalogItems("atomic")
const LAYOUT_ELEMENTS = catalogItems("layout")
const BASIC_ELEMENTS = catalogItems("basic")
const GENERAL_ELEMENTS = catalogItems("general")
const EDITORIAL_BLOCKS = STUDIO_EDITORIAL_TYPES.filter(
  (type) => type !== "hero"
)

export function StudioElementCatalog({
  onAddOrInsertWidget,
  availableWidgets,
  dict,
}: StudioLeftPanelProps) {
  const getBlockName = (type: string) =>
    dict?.[`admin.theme_settings.block.${type}.name`] || type
  const [catalogTab, setCatalogTab] = useState<
    "widgets" | "components" | "globals"
  >("widgets")
  const [searchQuery, setSearchQuery] = useState("")
  const [atomicOpen, setAtomicOpen] = useState(true)
  const [layoutOpen, setLayoutOpen] = useState(true)
  const [basicOpen, setBasicOpen] = useState(true)
  const [generalOpen, setGeneralOpen] = useState(true)
  const [editorialOpen, setEditorialOpen] = useState(true)

  const q = searchQuery.trim().toLowerCase()

  const filterList = (items: CatalogWidgetItem[]) =>
    items.filter((item) => {
      const label = (dict?.[item.labelKey] || item.type).toLowerCase()
      return !q || label.includes(q)
    })

  const filteredAtomic = filterList(ATOMIC_ELEMENTS)
  const filteredLayout = filterList(LAYOUT_ELEMENTS)
  const filteredBasic = filterList(BASIC_ELEMENTS)
  const filteredGeneral = filterList(GENERAL_ELEMENTS)

  const filteredEditorial = EDITORIAL_BLOCKS.filter((bType) => {
    const label = (
      dict?.[`admin.theme_settings.block.${bType}.name`] || bType
    ).toLowerCase()
    return !q || label.includes(q)
  })

  const filteredGlobals = availableWidgets.filter((w) => {
    const label = (
      dict?.[`admin.widgets.descriptor.${w.type}.name`] || w.name
    ).toLowerCase()
    return !q || label.includes(q)
  })

  return (
    <aside className="z-30 flex h-full w-[300px] shrink-0 flex-col border-e border-slate-200 bg-white select-none">
      {/* Header */}
      <div className="border-b border-slate-200 px-4 py-3 text-center">
        <h2 className="text-xs font-bold tracking-wide text-slate-800">
          {dict?.["admin.studio.elements"]}
        </h2>
      </div>

      {/* 3 Tabs: Widgets | Components | Globals */}
      <div className="grid grid-cols-3 border-b border-slate-200 text-[11px] font-semibold text-slate-600">
        <button
          type="button"
          onClick={() => setCatalogTab("widgets")}
          className={`border-b-2 py-2.5 text-center transition-colors ${
            catalogTab === "widgets"
              ? "border-slate-900 text-slate-900"
              : "border-transparent hover:text-slate-900"
          }`}
        >
          {dict?.["admin.studio.tab.widgets"]}
        </button>
        <button
          type="button"
          onClick={() => setCatalogTab("components")}
          className={`border-b-2 py-2.5 text-center transition-colors ${
            catalogTab === "components"
              ? "border-slate-900 text-slate-900"
              : "border-transparent hover:text-slate-900"
          }`}
        >
          {dict?.["admin.studio.tab.components"]}
        </button>
        <button
          type="button"
          onClick={() => setCatalogTab("globals")}
          className={`border-b-2 py-2.5 text-center transition-colors ${
            catalogTab === "globals"
              ? "border-slate-900 text-slate-900"
              : "border-transparent hover:text-slate-900"
          }`}
        >
          {dict?.["admin.studio.tab.globals"]}
        </button>
      </div>

      {/* Search Input */}
      <div className="border-b border-slate-100 p-3">
        <div className="relative flex items-center">
          <Search className="pointer-events-none absolute start-2.5 size-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={dict?.["admin.studio.search_widget"]}
            className="w-full rounded border border-slate-200 bg-slate-50/50 py-1.5 ps-8 pe-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {/* Scrollable Elements Grid */}
      <div className="flex-1 space-y-4 overflow-y-auto p-3">
        {catalogTab === "widgets" && (
          <>
            {(
              [
                {
                  id: "atomic",
                  title: dict?.["admin.studio.atomic_elements"],
                  open: atomicOpen,
                  toggle: () => setAtomicOpen((v) => !v),
                  items: filteredAtomic,
                },
                {
                  id: "layout",
                  title: dict?.["admin.studio.section.layout"],
                  open: layoutOpen,
                  toggle: () => setLayoutOpen((v) => !v),
                  items: filteredLayout,
                },
                {
                  id: "basic",
                  title: dict?.["admin.studio.section.basic"],
                  open: basicOpen,
                  toggle: () => setBasicOpen((v) => !v),
                  items: filteredBasic,
                },
                {
                  id: "general",
                  title: dict?.["admin.studio.section.general"],
                  open: generalOpen,
                  toggle: () => setGeneralOpen((v) => !v),
                  items: filteredGeneral,
                },
              ] as const
            ).map((sec, sIdx) => (
              <div
                key={sec.id}
                className={sIdx > 0 ? "border-t border-slate-100 pt-3" : ""}
              >
                <button
                  type="button"
                  onClick={sec.toggle}
                  className="flex w-full items-center justify-between py-1.5 text-xs font-bold text-slate-800"
                >
                  <span className="flex items-center gap-1.5">
                    <ChevronDown
                      className={`size-3.5 transition-transform ${
                        sec.open ? "" : "-rotate-90"
                      }`}
                    />
                    {sec.title}
                  </span>
                </button>

                {sec.open && (
                  <div className="mt-2 grid grid-cols-2 gap-2.5">
                    {sec.items.map((item) => {
                      const label = dict?.[item.labelKey] || item.type
                      return (
                        <button
                          key={`${sec.id}-${item.type}`}
                          type="button"
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData(
                              "application/x-studio-widget",
                              item.type
                            )
                            e.dataTransfer.effectAllowed = "copy"
                          }}
                          onClick={() => onAddOrInsertWidget(item.type)}
                          className="group relative flex cursor-grab flex-col items-center justify-center rounded border border-slate-200 bg-white p-3.5 text-slate-700 transition-all hover:border-blue-500 hover:text-blue-600 hover:shadow-sm active:cursor-grabbing"
                        >
                          <LayoutGrid className="absolute end-1.5 top-1.5 size-3 text-slate-300 group-hover:text-blue-400" />
                          <div className="mb-2 text-slate-600 group-hover:text-blue-600">
                            {item.icon}
                          </div>
                          <span className="text-center text-[11px] leading-tight font-medium">
                            {label}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}

            {/* Editorial Blocks Quick Access in Widgets Tab */}
            <div>
              <button
                type="button"
                onClick={() => setEditorialOpen((v) => !v)}
                className="flex w-full items-center justify-between border-t border-slate-100 py-1.5 pt-3 text-xs font-bold text-slate-800"
              >
                <span className="flex items-center gap-1.5">
                  <ChevronDown
                    className={`size-3.5 transition-transform ${
                      editorialOpen ? "" : "-rotate-90"
                    }`}
                  />
                  {dict?.["admin.studio.news_blocks"]}
                </span>
              </button>

              {editorialOpen && (
                <div className="mt-2 grid grid-cols-2 gap-2.5">
                  {filteredEditorial.map((bType) => {
                    const label = getBlockName(bType)
                    const fullType: StudioWidgetType = `block_${bType}`
                    return (
                      <button
                        key={bType}
                        type="button"
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData(
                            "application/x-studio-widget",
                            fullType
                          )
                          e.dataTransfer.effectAllowed = "copy"
                        }}
                        onClick={() => onAddOrInsertWidget(fullType)}
                        className="group relative flex cursor-grab flex-col items-center justify-center rounded border border-slate-200 bg-white p-3 text-slate-700 transition-all hover:border-blue-500 hover:text-blue-600 hover:shadow-sm active:cursor-grabbing"
                      >
                        <Newspaper className="absolute end-1.5 top-1.5 size-3 text-slate-300 group-hover:text-blue-400" />
                        <div className="mb-2">
                          <BlockWireframeIcon
                            type={bType}
                            className="h-7 w-10"
                          />
                        </div>
                        <span className="line-clamp-2 text-center text-[11px] leading-tight font-medium">
                          {label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {catalogTab === "components" && (
          <div className="grid grid-cols-2 gap-2.5">
            {filteredEditorial.map((bType) => {
              const label = getBlockName(bType)
              const fullType: StudioWidgetType = `block_${bType}`
              return (
                <button
                  key={bType}
                  type="button"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData(
                      "application/x-studio-widget",
                      fullType
                    )
                    e.dataTransfer.effectAllowed = "copy"
                  }}
                  onClick={() => onAddOrInsertWidget(fullType)}
                  className="group relative flex cursor-grab flex-col items-center justify-center rounded border border-slate-200 bg-white p-3 text-slate-700 transition-all hover:border-blue-500 hover:text-blue-600 hover:shadow-sm active:cursor-grabbing"
                >
                  <div className="mb-2">
                    <BlockWireframeIcon type={bType} className="h-8 w-11" />
                  </div>
                  <span className="text-center text-[11px] leading-tight font-medium">
                    {label}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {catalogTab === "globals" && (
          <div className="grid grid-cols-2 gap-2.5">
            {filteredGlobals.map((w) => {
              const label =
                dict?.[`admin.widgets.descriptor.${w.type}.name`] || w.name
              const fullType: StudioWidgetType = `widget_${w.type}`
              return (
                <button
                  key={w.type}
                  type="button"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData(
                      "application/x-studio-widget",
                      fullType
                    )
                    e.dataTransfer.effectAllowed = "copy"
                  }}
                  onClick={() => onAddOrInsertWidget(fullType)}
                  className="group relative flex cursor-grab flex-col items-center justify-center rounded border border-slate-200 bg-white p-3.5 text-slate-700 transition-all hover:border-blue-500 hover:text-blue-600 hover:shadow-sm active:cursor-grabbing"
                >
                  <Puzzle className="mb-2 size-5 text-indigo-500" />
                  <span className="text-center text-[11px] leading-tight font-medium">
                    {label}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </aside>
  )
}
