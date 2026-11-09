import type { StudioInspectorProps } from "./studio-panel-types"

export function StudioVisibilityControls({
  selectedElement,
  onUpdateSettings,
  dict,
}: Pick<
  StudioInspectorProps,
  "selectedElement" | "onUpdateSettings" | "dict"
>) {
  const s = selectedElement.settings
  return (
    <div className="space-y-2 border-t border-slate-200 pt-2.5">
      <label className="block font-semibold text-slate-700">
        {dict?.["admin.studio.advanced.responsive"]}
      </label>
      <p className="text-xs font-normal text-slate-500">
        {dict?.["admin.studio.advanced.responsive_help"]}
      </p>
      {(
        [
          {
            key: "hideOnDesktop",
            labelKey: "admin.studio.advanced.hide_desktop",
          },
          {
            key: "hideOnTablet",
            labelKey: "admin.studio.advanced.hide_tablet",
          },
          {
            key: "hideOnMobile",
            labelKey: "admin.studio.advanced.hide_mobile",
          },
        ] as const
      ).map((vis) => (
        <label key={vis.key} className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={Boolean(s[vis.key])}
            onChange={(e) =>
              onUpdateSettings(selectedElement.id, {
                [vis.key]: e.target.checked,
              })
            }
            className="rounded border-slate-300 text-blue-600"
          />
          <span>{dict?.[vis.labelKey]}</span>
        </label>
      ))}
    </div>
  )
}
