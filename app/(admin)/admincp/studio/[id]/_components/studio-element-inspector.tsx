import { useState } from "react"
import { ArrowLeft, Copy, Trash2 } from "lucide-react"
import type { StudioInspectorProps } from "./studio-panel-types"
import { StudioLayoutControls } from "./studio-layout-controls"
import { StudioWidgetControls } from "./studio-widget-controls"
import { StudioEditorialControls } from "./studio-editorial-controls"
import { StudioGlobalWidgetControls } from "./studio-global-widget-controls"
import { StudioStyleControls } from "./studio-style-controls"
import { StudioAdvancedControls } from "./studio-advanced-controls"
import { getStudioWidgetDefinition } from "@/lib/studio/widget-registry"

const CONTENT_CONTROLS = {
  layout: StudioLayoutControls,
  atomic: StudioWidgetControls,
  editorial: StudioEditorialControls,
  global: StudioGlobalWidgetControls,
}

export function StudioElementInspector(props: StudioInspectorProps) {
  const {
    selectedElement,
    onSetPanelMode,
    onDuplicateElement,
    onDeleteElement,
    dict,
  } = props
  const [inspectorTab, setInspectorTab] = useState<
    "content" | "style" | "advanced"
  >("content")
  const definition = getStudioWidgetDefinition(selectedElement.widgetType)
  const ContentControls = definition
    ? CONTENT_CONTROLS[definition.controlGroup]
    : null
  return (
    <aside className="z-30 flex h-full w-[300px] shrink-0 flex-col border-e border-slate-200 bg-white text-xs select-none">
      {/* Inspector Header */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-3 py-2.5">
        <button
          type="button"
          onClick={() => onSetPanelMode("elements")}
          className="flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="size-3.5" />
          <span>{dict?.["admin.studio.elements"]}</span>
        </button>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onDuplicateElement(selectedElement.id)}
            className="rounded p-1 text-slate-500 hover:bg-slate-200/60 hover:text-slate-800"
            title={dict?.["admin.studio.action.duplicate"]}
          >
            <Copy className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDeleteElement(selectedElement.id)}
            className="rounded p-1 text-slate-500 hover:bg-red-50 hover:text-red-600"
            title={dict?.["admin.studio.action.delete"]}
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>

      {/* 3 Inspector Tabs: Content | Style | Advanced */}
      <div className="grid grid-cols-3 border-b border-slate-200 text-[11px] font-semibold text-slate-600">
        <button
          type="button"
          onClick={() => setInspectorTab("content")}
          className={`border-b-2 py-2.5 text-center transition-colors ${
            inspectorTab === "content"
              ? "border-blue-600 text-blue-600"
              : "border-transparent hover:text-slate-900"
          }`}
        >
          {dict?.["admin.studio.inspector.content"]}
        </button>
        <button
          type="button"
          onClick={() => setInspectorTab("style")}
          className={`border-b-2 py-2.5 text-center transition-colors ${
            inspectorTab === "style"
              ? "border-blue-600 text-blue-600"
              : "border-transparent hover:text-slate-900"
          }`}
        >
          {dict?.["admin.studio.inspector.style"]}
        </button>
        <button
          type="button"
          onClick={() => setInspectorTab("advanced")}
          className={`border-b-2 py-2.5 text-center transition-colors ${
            inspectorTab === "advanced"
              ? "border-blue-600 text-blue-600"
              : "border-transparent hover:text-slate-900"
          }`}
        >
          {dict?.["admin.studio.inspector.advanced"]}
        </button>
      </div>

      {/* Inspector Controls Body */}
      <div className="flex-1 space-y-4 overflow-y-auto p-3.5">
        {inspectorTab === "content" && (
          <div className="space-y-4">
            {ContentControls && <ContentControls {...props} />}
          </div>
        )}
        {inspectorTab === "style" && <StudioStyleControls {...props} />}
        {inspectorTab === "advanced" && <StudioAdvancedControls {...props} />}
      </div>
    </aside>
  )
}
