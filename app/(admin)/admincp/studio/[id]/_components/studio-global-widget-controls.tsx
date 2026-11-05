import type { WidgetDisplayStyle } from "@/widgets/types"

import { getWidget } from "@/widgets/registry"

import type { StudioInspectorProps } from "./studio-panel-types"
export function StudioGlobalWidgetControls({
  selectedElement,
  onUpdateSettings,
  dict,
  direction = "ltr",
  languages = [],
}: StudioInspectorProps) {
  const s = selectedElement.settings

  const t = (key: string) => dict?.[key] || ""

  return (
    <>
      {" "}
      {selectedElement.widgetType.startsWith("widget_") && (
        <div className="space-y-3.5">
          {/* Language Assignment Dropdown */}
          <div className="space-y-1.5 rounded border border-slate-200 bg-slate-50 p-2.5">
            <label className="block font-semibold text-slate-700">
              {t("admin.widgets.language")}
            </label>
            <select
              value={s.widgetLocale || "all"}
              onChange={(e) =>
                onUpdateSettings(selectedElement.id, {
                  widgetLocale: e.target.value,
                })
              }
              className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5"
            >
              <option value="all">{t("admin.widgets.all_languages")}</option>
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.nativeName
                    ? `${lang.nativeName} (${lang.name})`
                    : lang.name}{" "}
                  [{lang.code.toUpperCase()}]
                </option>
              ))}
            </select>
          </div>

          {(() => {
            const mod = s.widgetId ? getWidget(s.widgetId) : null
            const AdminForm = mod?.AdminForm
            if (AdminForm && s.widgetId) {
              return (
                <AdminForm
                  item={{
                    id: selectedElement.id,
                    type: s.widgetId,
                    title: s.widgetTitle || "",
                    content: s.widgetConfig?.content as string | undefined,
                    count: s.widgetConfig?.count as number | undefined,
                    displayStyle: s.widgetConfig?.displayStyle as
                      WidgetDisplayStyle | undefined,
                    config: s.widgetConfig || {},
                    locale: s.widgetLocale || "all",
                  }}
                  onChange={(updates) => {
                    const newConfig: Record<string, unknown> = {
                      ...(s.widgetConfig || {}),
                      ...(updates.config || {}),
                    }
                    if (updates.content !== undefined)
                      newConfig.content = updates.content
                    if (updates.count !== undefined)
                      newConfig.count = updates.count
                    if (updates.displayStyle !== undefined)
                      newConfig.displayStyle = updates.displayStyle

                    onUpdateSettings(selectedElement.id, {
                      widgetTitle:
                        updates.title !== undefined
                          ? updates.title
                          : s.widgetTitle,
                      widgetLocale:
                        updates.locale !== undefined
                          ? updates.locale
                          : s.widgetLocale,
                      widgetConfig: newConfig,
                    })
                  }}
                  dict={dict}
                  direction={direction}
                />
              )
            }

            return (
              <div className="space-y-1.5">
                <label className="block font-semibold text-slate-700">
                  {dict?.["admin.widgets.widget_title"] ||
                    dict?.["admin.theme_settings.display_title"]}
                </label>
                <input
                  type="text"
                  value={s.widgetTitle || ""}
                  placeholder={
                    dict?.[`admin.widgets.descriptor.${s.widgetId}.name`] || ""
                  }
                  onChange={(e) =>
                    onUpdateSettings(selectedElement.id, {
                      widgetTitle: e.target.value,
                    })
                  }
                  className="w-full rounded border border-slate-300 px-2.5 py-1.5"
                />
              </div>
            )
          })()}
        </div>
      )}
    </>
  )
}
