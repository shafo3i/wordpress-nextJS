import { studioContainerWidthMode } from "@/lib/studio/container-width"
import { applyStudioStructurePreset } from "@/lib/studio/structure-presets"

import type { StudioElement, StudioStructurePreset } from "@/lib/studio/types"

import type { StudioInspectorProps } from "./studio-panel-types"
export function StudioLayoutControls({
  selectedElement,
  onUpdateSettings,
  onUpdateElement,
  dict,
}: StudioInspectorProps) {
  const s = selectedElement.settings
  const widthMode = studioContainerWidthMode(s)

  const applyContainerColumnsPreset = (
    el: StudioElement,
    preset: StudioStructurePreset
  ) =>
    onUpdateElement(el.id, (current) =>
      applyStudioStructurePreset(current, preset)
    )

  return (
    <>
      {" "}
      {selectedElement.elType === "container" && (
        <>
          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-700">
              {dict?.["admin.studio.field.container_type"]}
            </label>
            <select
              value={s.containerType || "flexbox"}
              onChange={(e) =>
                onUpdateSettings(selectedElement.id, {
                  containerType: e.target.value as "flexbox" | "grid" | "div",
                })
              }
              className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5"
            >
              <option value="flexbox">
                {dict?.["admin.studio.el.flexbox"]}
              </option>
              <option value="grid">{dict?.["admin.studio.el.grid"]}</option>
              <option value="div">{dict?.["admin.studio.el.div"]}</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-700">
              {dict?.["admin.studio.field.content_width"]}
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() =>
                  onUpdateSettings(selectedElement.id, {
                    contentWidth: "inherit",
                  })
                }
                className={`rounded border py-1.5 font-medium ${widthMode === "inherit" ? "border-blue-600 bg-blue-50 text-blue-600" : "border-slate-200 text-slate-600"}`}
              >
                {dict?.["admin.studio.width.inherit"]}
              </button>
              <button
                type="button"
                onClick={() =>
                  onUpdateSettings(selectedElement.id, {
                    contentWidth: "boxed",
                    customWidth: true,
                    maxWidth: s.maxWidth || 1280,
                  })
                }
                className={`rounded border py-1.5 font-medium ${
                  widthMode === "boxed"
                    ? "border-blue-600 bg-blue-50 text-blue-600"
                    : "border-slate-200 text-slate-600"
                }`}
              >
                {dict?.["admin.builder.container_boxed"]}
              </button>
              <button
                type="button"
                onClick={() =>
                  onUpdateSettings(selectedElement.id, { contentWidth: "full" })
                }
                className={`rounded border py-1.5 font-medium ${
                  widthMode === "full"
                    ? "border-blue-600 bg-blue-50 text-blue-600"
                    : "border-slate-200 text-slate-600"
                }`}
              >
                {dict?.["admin.builder.container_full"]}
              </button>
            </div>
          </div>

          {widthMode === "boxed" && (
            <label className="block space-y-1.5">
              <span>{dict?.["admin.studio.width.custom"]}</span>
              <input
                type="number"
                min={320}
                max={3840}
                value={s.maxWidth || 1280}
                onChange={(event) =>
                  onUpdateSettings(selectedElement.id, {
                    maxWidth: Math.max(
                      320,
                      Math.min(3840, Number(event.target.value) || 1280)
                    ),
                    customWidth: true,
                  })
                }
                className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5"
              />
            </label>
          )}

          {/* Column Structure Presets */}
          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-700">
              {dict?.["admin.builder.row_layout"]}
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  { id: "100", label: dict?.["admin.studio.preset.100"] || "" },
                  {
                    id: "50_50",
                    label: dict?.["admin.studio.preset.50_50"] || "",
                  },
                  {
                    id: "66_33",
                    label: dict?.["admin.studio.preset.66_33"] || "",
                  },
                  {
                    id: "33_66",
                    label: dict?.["admin.studio.preset.33_66"] || "",
                  },
                  {
                    id: "33_33_33",
                    label: dict?.["admin.studio.preset.33_33_33"] || "",
                  },
                  {
                    id: "25_25_25_25",
                    label: dict?.["admin.studio.preset.25_25_25_25"] || "",
                  },
                ] as { id: StudioStructurePreset; label: string }[]
              ).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() =>
                    applyContainerColumnsPreset(selectedElement, p.id)
                  }
                  className="rounded border border-slate-200 px-2 py-1.5 text-[11px] font-medium text-slate-700 hover:border-blue-500 hover:bg-blue-50"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {s.containerType === "grid" ? (
            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-700">
                {dict?.["admin.studio.field.grid_columns"]} (
                {s.gridColumns || 3})
              </label>
              <input
                type="range"
                min={1}
                max={6}
                value={s.gridColumns || 3}
                onChange={(e) =>
                  onUpdateSettings(selectedElement.id, {
                    gridColumns: Number(e.target.value),
                  })
                }
                className="w-full"
              />
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-700">
                {dict?.["admin.studio.field.flex_direction"]}
              </label>
              <select
                value={s.flexDirection || "row"}
                onChange={(e) =>
                  onUpdateSettings(selectedElement.id, {
                    flexDirection: e.target.value as "row" | "column",
                  })
                }
                className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5"
              >
                <option value="row">{dict?.["admin.studio.option.row"]}</option>
                <option value="column">
                  {dict?.["admin.studio.option.column"]}
                </option>
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-700">
              {dict?.["admin.studio.field.gap"]} ({s.gap ?? 20}
              {dict?.["admin.studio.control.px"]})
            </label>
            <input
              type="range"
              min={0}
              max={64}
              step={4}
              value={s.gap ?? 20}
              onChange={(e) =>
                onUpdateSettings(selectedElement.id, {
                  gap: Number(e.target.value),
                })
              }
              className="w-full"
            />
          </div>
        </>
      )}
      {/* HEADING / PARAGRAPH / TEXT EDITOR / TEXT PATH CONTROLS */}
    </>
  )
}
