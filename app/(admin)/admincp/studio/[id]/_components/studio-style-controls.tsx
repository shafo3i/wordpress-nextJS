import { StudioDesignControls } from "./studio-design-controls"
import type { StudioElementSettings } from "@/lib/studio/types"

import type { StudioInspectorProps } from "./studio-panel-types"
export function StudioStyleControls({
  selectedElement,
  onUpdateSettings,
  dict,
}: Pick<
  StudioInspectorProps,
  "selectedElement" | "onUpdateSettings" | "dict"
>) {
  const s = selectedElement.settings
  const isTicker =
    s.blockConfig?.type === "breaking_ticker" ||
    s.blockConfig?.displayStyle === "breaking_bar"
  const defaultFontSize = isTicker ? 12 : 16

  return (
    <div className="space-y-4">
      {selectedElement.elType === "widget" && (
        <StudioDesignControls
          key={selectedElement.id}
          selectedElement={selectedElement}
          onUpdateSettings={onUpdateSettings}
          dict={dict}
        />
      )}
      <details
        open={selectedElement.elType === "container"}
        className="space-y-3"
      >
        <summary className="cursor-pointer font-semibold">
          {dict?.["admin.studio.design.element_surface"]}
        </summary>
        <p className="text-xs text-slate-500">
          {dict?.["admin.studio.design.element_surface_help"]}
        </p>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-700">
              {dict?.["admin.studio.style.background_color"]}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={s.backgroundColor || "#ffffff"}
                onChange={(e) =>
                  onUpdateSettings(selectedElement.id, {
                    backgroundColor: e.target.value,
                  })
                }
                className="h-8 w-10 cursor-pointer rounded border border-slate-300"
              />
              <input
                type="text"
                value={s.backgroundColor || ""}
                aria-label={dict?.["admin.studio.style.background_color"]}
                placeholder={dict?.["admin.studio.control.transparent"] || ""}
                onChange={(e) =>
                  onUpdateSettings(selectedElement.id, {
                    backgroundColor: e.target.value,
                  })
                }
                className="flex-1 rounded border border-slate-300 px-2 py-1"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-700">
              {dict?.["admin.studio.style.text_color"]}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={s.textColor || "#0f172a"}
                onChange={(e) =>
                  onUpdateSettings(selectedElement.id, {
                    textColor: e.target.value,
                  })
                }
                className="h-8 w-10 cursor-pointer rounded border border-slate-300"
              />
              <input
                type="text"
                value={s.textColor || ""}
                aria-label={dict?.["admin.studio.style.text_color"]}
                placeholder={dict?.["admin.studio.control.inherit"] || ""}
                onChange={(e) =>
                  onUpdateSettings(selectedElement.id, {
                    textColor: e.target.value,
                  })
                }
                className="flex-1 rounded border border-slate-300 px-2 py-1"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-700">
              {dict?.["admin.studio.style.font_size"]} (
              {s.fontSize ?? defaultFontSize}
              {dict?.["admin.studio.control.px"]})
            </label>
            <input
              type="range"
              min={12}
              max={72}
              value={s.fontSize ?? defaultFontSize}
              aria-label={dict?.["admin.studio.style.font_size"]}
              onChange={(e) =>
                onUpdateSettings(selectedElement.id, {
                  fontSize: Number(e.target.value),
                })
              }
              className="w-full"
            />
          </div>

          {isTicker && (
            <div className="space-y-3 border-t border-slate-200 pt-3">
              {(
                [
                  "tickerLabelColor",
                  "tickerLabelBackground",
                  "tickerMetaColor",
                  "tickerControlsColor",
                ] as const
              ).map((key) => (
                <label key={key} className="block space-y-1.5">
                  <span className="block font-semibold text-slate-700">
                    {dict?.[`admin.studio.style.${key}`]}
                  </span>
                  <input
                    type="text"
                    value={s[key] || ""}
                    placeholder={dict?.["admin.studio.control.inherit"] || ""}
                    onChange={(event) =>
                      onUpdateSettings(selectedElement.id, {
                        [key]: event.target.value,
                      })
                    }
                    className="w-full rounded border border-slate-300 px-2 py-1"
                  />
                </label>
              ))}
            </div>
          )}

          <label className="block space-y-1.5">
            <span className="block font-semibold text-slate-700">
              {dict?.["admin.studio.style.font_weight"]}
            </span>
            <select
              value={s.fontWeight || (isTicker ? "700" : "400")}
              onChange={(event) =>
                onUpdateSettings(selectedElement.id, {
                  fontWeight: event.target
                    .value as StudioElementSettings["fontWeight"],
                })
              }
              className="w-full rounded border border-slate-300 px-2 py-1"
            >
              {["400", "500", "600", "700", "800", "900"].map((weight) => (
                <option key={weight} value={weight}>
                  {weight}
                </option>
              ))}
            </select>
          </label>

          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-700">
              {dict?.["admin.studio.style.border_radius"]}
            </label>
            <input
              type="number"
              min={0}
              max={200}
              aria-label={dict?.["admin.studio.style.border_radius"]}
              placeholder={dict?.["admin.studio.control.inherit"]}
              value={s.borderRadius ?? ""}
              onChange={(e) =>
                onUpdateSettings(selectedElement.id, {
                  borderRadius:
                    e.target.value === "" ? undefined : Number(e.target.value),
                })
              }
              className="w-full"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-700">
              {dict?.["admin.studio.style.box_shadow"]}
            </label>
            <select
              value={s.boxShadow || "none"}
              onChange={(e) =>
                onUpdateSettings(selectedElement.id, {
                  boxShadow: e.target
                    .value as StudioElementSettings["boxShadow"],
                })
              }
              className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5"
            >
              <option value="none">
                {dict?.["admin.studio.control.none"]}
              </option>
              <option value="sm">{dict?.["admin.studio.control.small"]}</option>
              <option value="md">
                {dict?.["admin.studio.control.medium"]}
              </option>
              <option value="lg">{dict?.["admin.studio.control.large"]}</option>
              <option value="xl">
                {dict?.["admin.studio.control.extra_large"]}
              </option>
            </select>
          </div>
          <label className="block space-y-1.5">
            <span className="block font-semibold text-slate-700">
              {dict?.["admin.studio.style.border_style"]}
            </span>
            <select
              value={s.borderStyle || (isTicker ? "solid" : "none")}
              onChange={(event) =>
                onUpdateSettings(selectedElement.id, {
                  borderStyle: event.target
                    .value as StudioElementSettings["borderStyle"],
                })
              }
              className="w-full rounded border border-slate-300 px-2 py-1"
            >
              {(["none", "solid", "dashed", "dotted"] as const).map((value) => (
                <option key={value} value={value}>
                  {dict?.[`admin.studio.style.border_${value}`]}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className="block font-semibold text-slate-700">
              {dict?.["admin.studio.style.border_width"]}
            </span>
            <input
              type="number"
              min={0}
              max={20}
              value={s.borderWidth ?? (isTicker ? 2 : 1)}
              onChange={(event) =>
                onUpdateSettings(selectedElement.id, {
                  borderStyle: s.borderStyle || "solid",
                  borderWidth: Math.max(
                    0,
                    Math.min(20, Number(event.target.value))
                  ),
                })
              }
              className="w-full rounded border border-slate-300 px-2 py-1"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="block font-semibold text-slate-700">
              {dict?.["admin.studio.style.border_color"]}
            </span>
            <input
              type="text"
              value={s.borderColor || ""}
              placeholder={dict?.["admin.studio.control.inherit"] || ""}
              onChange={(event) =>
                onUpdateSettings(selectedElement.id, {
                  borderStyle: s.borderStyle || "solid",
                  borderColor: event.target.value,
                })
              }
              className="w-full rounded border border-slate-300 px-2 py-1"
            />
          </label>
        </div>
      </details>
    </div>
  )
}
