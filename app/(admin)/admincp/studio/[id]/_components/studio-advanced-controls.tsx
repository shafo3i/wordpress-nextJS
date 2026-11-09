import { StudioVisibilityControls } from "./studio-visibility-controls"
import type { StudioInspectorProps } from "./studio-panel-types"
export function StudioAdvancedControls({
  selectedElement,
  onUpdateSettings,
  dict,
}: StudioInspectorProps) {
  const s = selectedElement.settings
  const isTicker =
    s.blockConfig?.type === "breaking_ticker" ||
    s.blockConfig?.displayStyle === "breaking_bar"

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="block font-semibold text-slate-700">
          {dict?.["admin.studio.advanced.padding"]} (
          {dict?.["admin.studio.control.px"]})
        </label>
        <div className="grid grid-cols-4 gap-1.5">
          {(
            [
              {
                key: "paddingTop",
                label: dict?.["admin.studio.control.top"] || "",
              },
              {
                key: "paddingRight",
                label: dict?.["admin.studio.control.right"] || "",
              },
              {
                key: "paddingBottom",
                label: dict?.["admin.studio.control.bottom"] || "",
              },
              {
                key: "paddingLeft",
                label: dict?.["admin.studio.control.left"] || "",
              },
            ] as const
          ).map((side) => (
            <div key={side.key} className="text-center">
              <input
                type="number"
                min={0}
                aria-label={`${dict?.["admin.studio.advanced.padding"] || ""} ${side.label}`}
                value={
                  s[side.key] ??
                  (isTicker
                    ? side.key === "paddingLeft" || side.key === "paddingRight"
                      ? 20
                      : 12
                    : 0)
                }
                onChange={(e) =>
                  onUpdateSettings(selectedElement.id, {
                    [side.key]: Math.max(0, Number(e.target.value)),
                  })
                }
                className="w-full rounded border border-slate-300 px-1.5 py-1 text-center"
              />
              <span className="text-[10px] text-slate-400">{side.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block font-semibold text-slate-700">
          {dict?.["admin.studio.advanced.margin"]} (
          {dict?.["admin.studio.control.px"]})
        </label>
        <div className="grid grid-cols-4 gap-1.5">
          {(
            [
              {
                key: "marginTop",
                label: dict?.["admin.studio.control.top"] || "",
              },
              {
                key: "marginRight",
                label: dict?.["admin.studio.control.right"] || "",
              },
              {
                key: "marginBottom",
                label: dict?.["admin.studio.control.bottom"] || "",
              },
              {
                key: "marginLeft",
                label: dict?.["admin.studio.control.left"] || "",
              },
            ] as const
          ).map((side) => (
            <div key={side.key} className="text-center">
              <input
                type="number"
                aria-label={`${dict?.["admin.studio.advanced.margin"] || ""} ${side.label}`}
                value={s[side.key] ?? 0}
                onChange={(e) =>
                  onUpdateSettings(selectedElement.id, {
                    [side.key]: Number(e.target.value),
                  })
                }
                className="w-full rounded border border-slate-300 px-1.5 py-1 text-center"
              />
              <span className="text-[10px] text-slate-400">{side.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block font-semibold text-slate-700">
          {dict?.["admin.studio.advanced.custom_class"]}
        </label>
        <input
          type="text"
          value={s.customClass || ""}
          onChange={(e) =>
            onUpdateSettings(selectedElement.id, {
              customClass: e.target.value,
            })
          }
          className="w-full rounded border border-slate-300 px-2.5 py-1.5"
        />
      </div>

      <StudioVisibilityControls
        {...{ selectedElement, onUpdateSettings, dict }}
      />
    </div>
  )
}
