import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Plus,
  Trash2,
} from "lucide-react"

import type { StudioElementSettings } from "@/lib/studio/types"
import { generateStudioId } from "@/lib/studio/tree-helpers"

import type { StudioInspectorProps } from "./studio-panel-types"
export function StudioWidgetControls({
  selectedElement,
  onUpdateSettings,
  dict,
}: StudioInspectorProps) {
  const s = selectedElement.settings

  return (
    <>
      {" "}
      {(selectedElement.widgetType === "heading" ||
        selectedElement.widgetType === "paragraph" ||
        selectedElement.widgetType === "text_editor" ||
        selectedElement.widgetType === "text_path") && (
        <>
          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-700">
              {dict?.["admin.studio.field.text"]}
            </label>
            <textarea
              rows={
                selectedElement.widgetType === "paragraph" ||
                selectedElement.widgetType === "text_editor"
                  ? 4
                  : 2
              }
              value={s.text || ""}
              placeholder={
                selectedElement.widgetType === "heading"
                  ? dict?.["admin.studio.placeholder.heading"]
                  : dict?.["admin.studio.placeholder.paragraph"]
              }
              onChange={(e) =>
                onUpdateSettings(selectedElement.id, { text: e.target.value })
              }
              className="w-full rounded border border-slate-300 p-2"
            />
          </div>

          {selectedElement.widgetType === "heading" && (
            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-700">
                {dict?.["admin.studio.field.html_tag"]}
              </label>
              <select
                value={s.htmlTag || "h2"}
                onChange={(e) =>
                  onUpdateSettings(selectedElement.id, {
                    htmlTag: e.target.value as StudioElementSettings["htmlTag"],
                  })
                }
                className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5"
              >
                {["h1", "h2", "h3", "h4", "h5", "h6"].map((t) => (
                  <option key={t} value={t}>
                    {t.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-700">
              {dict?.["admin.studio.field.alignment"]}
            </label>
            <div className="grid grid-cols-4 gap-1">
              {(
                [
                  { id: "start", icon: <AlignLeft className="size-3.5" /> },
                  { id: "center", icon: <AlignCenter className="size-3.5" /> },
                  { id: "end", icon: <AlignRight className="size-3.5" /> },
                  {
                    id: "justify",
                    icon: <AlignJustify className="size-3.5" />,
                  },
                ] as const
              ).map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() =>
                    onUpdateSettings(selectedElement.id, { align: a.id })
                  }
                  className={`flex items-center justify-center rounded border py-1.5 ${
                    (s.align || "start") === a.id
                      ? "border-blue-600 bg-blue-50 text-blue-600"
                      : "border-slate-200 text-slate-600"
                  }`}
                >
                  {a.icon}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
      {/* IMAGE CONTROLS */}
      {selectedElement.widgetType === "image" && (
        <>
          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-700">
              {dict?.["admin.studio.field.image_url"]}
            </label>
            <input
              type="text"
              value={s.imageUrl || ""}
              onChange={(e) =>
                onUpdateSettings(selectedElement.id, {
                  imageUrl: e.target.value,
                })
              }
              className="w-full rounded border border-slate-300 px-2.5 py-1.5"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-700">
              {dict?.["admin.studio.field.height"]} ({s.imageHeight || 360}
              {dict?.["admin.studio.control.px"]})
            </label>
            <input
              type="range"
              min={120}
              max={800}
              step={20}
              value={s.imageHeight || 360}
              onChange={(e) =>
                onUpdateSettings(selectedElement.id, {
                  imageHeight: Number(e.target.value),
                })
              }
              className="w-full"
            />
          </div>
        </>
      )}
      {/* BUTTON / READ MORE CONTROLS */}
      {(selectedElement.widgetType === "button" ||
        selectedElement.widgetType === "read_more") && (
        <>
          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-700">
              {dict?.["admin.studio.field.text"]}
            </label>
            <input
              type="text"
              value={s.buttonText || ""}
              placeholder={dict?.["admin.studio.placeholder.button"]}
              onChange={(e) =>
                onUpdateSettings(selectedElement.id, {
                  buttonText: e.target.value,
                })
              }
              className="w-full rounded border border-slate-300 px-2.5 py-1.5"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-700">
              {dict?.["admin.studio.field.link_url"]}
            </label>
            <input
              type="text"
              value={s.buttonUrl || ""}
              onChange={(e) =>
                onUpdateSettings(selectedElement.id, {
                  buttonUrl: e.target.value,
                })
              }
              className="w-full rounded border border-slate-300 px-2.5 py-1.5"
            />
          </div>
          {selectedElement.widgetType === "button" && (
            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-700">
                {dict?.["admin.studio.field.style_variant"]}
              </label>
              <select
                value={s.buttonVariant || "primary"}
                onChange={(e) =>
                  onUpdateSettings(selectedElement.id, {
                    buttonVariant: e.target
                      .value as StudioElementSettings["buttonVariant"],
                  })
                }
                className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5"
              >
                <option value="primary">
                  {dict?.["admin.studio.control.primary"]}
                </option>
                <option value="secondary">
                  {dict?.["admin.studio.control.secondary"]}
                </option>
                <option value="outline">
                  {dict?.["admin.studio.control.outline"]}
                </option>
                <option value="dark">
                  {dict?.["admin.studio.control.dark"]}
                </option>
              </select>
            </div>
          )}
        </>
      )}
      {/* YOUTUBE / VIDEO CONTROLS */}
      {(selectedElement.widgetType === "youtube" ||
        selectedElement.widgetType === "video") && (
        <div className="space-y-1.5">
          <label className="block font-semibold text-slate-700">
            {dict?.["admin.studio.field.video_url"]}
          </label>
          <input
            type="text"
            value={s.videoUrl || ""}
            onChange={(e) =>
              onUpdateSettings(selectedElement.id, { videoUrl: e.target.value })
            }
            className="w-full rounded border border-slate-300 px-2.5 py-1.5"
          />
        </div>
      )}
      {/* GOOGLE MAPS CONTROLS */}
      {selectedElement.widgetType === "google_maps" && (
        <>
          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-700">
              {dict?.["admin.studio.field.text"]}
            </label>
            <input
              type="text"
              value={s.mapAddress || ""}
              onChange={(e) =>
                onUpdateSettings(selectedElement.id, {
                  mapAddress: e.target.value,
                })
              }
              className="w-full rounded border border-slate-300 px-2.5 py-1.5"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-700">
              {dict?.["admin.studio.field.height"]} ({s.imageHeight || 320}
              {dict?.["admin.studio.control.px"]})
            </label>
            <input
              type="range"
              min={180}
              max={640}
              step={20}
              value={s.imageHeight || 320}
              onChange={(e) =>
                onUpdateSettings(selectedElement.id, {
                  imageHeight: Number(e.target.value),
                })
              }
              className="w-full"
            />
          </div>
        </>
      )}
      {/* IMAGE BOX / ICON BOX / ALERT CONTROLS */}
      {(selectedElement.widgetType === "image_box" ||
        selectedElement.widgetType === "icon_box" ||
        selectedElement.widgetType === "alert") && (
        <>
          {selectedElement.widgetType === "image_box" && (
            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-700">
                {dict?.["admin.studio.field.image_url"]}
              </label>
              <input
                type="text"
                value={s.imageUrl || ""}
                onChange={(e) =>
                  onUpdateSettings(selectedElement.id, {
                    imageUrl: e.target.value,
                  })
                }
                className="w-full rounded border border-slate-300 px-2.5 py-1.5"
              />
            </div>
          )}
          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-700">
              {dict?.["admin.theme_settings.display_title"]}
            </label>
            <input
              type="text"
              value={s.text || ""}
              onChange={(e) =>
                onUpdateSettings(selectedElement.id, { text: e.target.value })
              }
              className="w-full rounded border border-slate-300 px-2.5 py-1.5"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-700">
              {dict?.["admin.studio.field.text"]}
            </label>
            <textarea
              rows={3}
              value={s.subText || ""}
              onChange={(e) =>
                onUpdateSettings(selectedElement.id, {
                  subText: e.target.value,
                })
              }
              className="w-full rounded border border-slate-300 p-2"
            />
          </div>
        </>
      )}
      {/* COUNTER / PROGRESS BAR / RATING CONTROLS */}
      {selectedElement.widgetType === "counter" && (
        <>
          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-700">
              {dict?.["admin.studio.el.counter"]}
            </label>
            <input
              type="number"
              value={s.counterValue ?? 125}
              onChange={(e) =>
                onUpdateSettings(selectedElement.id, {
                  counterValue: Number(e.target.value),
                })
              }
              className="w-full rounded border border-slate-300 px-2.5 py-1.5"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-700">
              {dict?.["admin.theme_settings.display_title"]}
            </label>
            <input
              type="text"
              value={s.text || ""}
              onChange={(e) =>
                onUpdateSettings(selectedElement.id, { text: e.target.value })
              }
              className="w-full rounded border border-slate-300 px-2.5 py-1.5"
            />
          </div>
        </>
      )}
      {selectedElement.widgetType === "progress_bar" && (
        <>
          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-700">
              {dict?.["admin.theme_settings.display_title"]}
            </label>
            <input
              type="text"
              value={s.text || ""}
              onChange={(e) =>
                onUpdateSettings(selectedElement.id, { text: e.target.value })
              }
              className="w-full rounded border border-slate-300 px-2.5 py-1.5"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-700">
              {s.progressPercent ?? 78}%
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={s.progressPercent ?? 78}
              onChange={(e) =>
                onUpdateSettings(selectedElement.id, {
                  progressPercent: Number(e.target.value),
                })
              }
              className="w-full"
            />
          </div>
        </>
      )}
      {selectedElement.widgetType === "testimonial" && (
        <>
          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-700">
              {dict?.["admin.studio.field.text"]}
            </label>
            <textarea
              rows={3}
              value={s.text || ""}
              onChange={(e) =>
                onUpdateSettings(selectedElement.id, { text: e.target.value })
              }
              className="w-full rounded border border-slate-300 p-2"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-700">
              {dict?.["admin.theme_settings.display_title"]}
            </label>
            <input
              type="text"
              value={s.testimonialName || ""}
              onChange={(e) =>
                onUpdateSettings(selectedElement.id, {
                  testimonialName: e.target.value,
                })
              }
              className="w-full rounded border border-slate-300 px-2.5 py-1.5"
            />
          </div>
        </>
      )}
      {(selectedElement.widgetType === "shortcode" ||
        selectedElement.widgetType === "menu_anchor" ||
        selectedElement.widgetType === "soundcloud") && (
        <div className="space-y-1.5">
          <label className="block font-semibold text-slate-700">
            {dict?.["admin.studio.field.text"]}
          </label>
          <input
            type="text"
            value={
              selectedElement.widgetType === "shortcode"
                ? s.shortcodeText || ""
                : selectedElement.widgetType === "menu_anchor"
                  ? s.anchorId || ""
                  : s.soundcloudUrl || ""
            }
            onChange={(e) =>
              onUpdateSettings(
                selectedElement.id,
                selectedElement.widgetType === "shortcode"
                  ? { shortcodeText: e.target.value }
                  : selectedElement.widgetType === "menu_anchor"
                    ? { anchorId: e.target.value }
                    : { soundcloudUrl: e.target.value }
              )
            }
            className="w-full rounded border border-slate-300 px-2.5 py-1.5"
          />
        </div>
      )}
      {/* SPACER CONTROLS */}
      {selectedElement.widgetType === "spacer" && (
        <div className="space-y-1.5">
          <label className="block font-semibold text-slate-700">
            {dict?.["admin.studio.field.height"]} ({s.spacerHeight ?? 48}
            {dict?.["admin.studio.control.px"]})
          </label>
          <input
            type="range"
            min={8}
            max={240}
            step={4}
            value={s.spacerHeight ?? 48}
            onChange={(e) =>
              onUpdateSettings(selectedElement.id, {
                spacerHeight: Number(e.target.value),
              })
            }
            className="w-full"
          />
        </div>
      )}
      {/* TABS / ACCORDION CONTROLS */}
      {(selectedElement.widgetType === "tabs" ||
        selectedElement.widgetType === "accordion") && (
        <div className="space-y-2.5">
          {(selectedElement.widgetType === "tabs"
            ? s.tabsItems || []
            : s.accordionItems || []
          ).map((item, idx, arr) => (
            <div
              key={item.id}
              className="space-y-2 rounded border border-slate-200 bg-slate-50/50 p-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">#{idx + 1}</span>
                <button
                  type="button"
                  onClick={() => {
                    const next = arr.filter((i) => i.id !== item.id)
                    onUpdateSettings(
                      selectedElement.id,
                      selectedElement.widgetType === "tabs"
                        ? { tabsItems: next }
                        : { accordionItems: next }
                    )
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
              <input
                type="text"
                value={item.title}
                onChange={(e) => {
                  const next = arr.map((i) =>
                    i.id === item.id ? { ...i, title: e.target.value } : i
                  )
                  onUpdateSettings(
                    selectedElement.id,
                    selectedElement.widgetType === "tabs"
                      ? { tabsItems: next }
                      : { accordionItems: next }
                  )
                }}
                className="w-full rounded border border-slate-300 bg-white px-2 py-1"
              />
              <textarea
                rows={2}
                value={item.content}
                onChange={(e) => {
                  const next = arr.map((i) =>
                    i.id === item.id ? { ...i, content: e.target.value } : i
                  )
                  onUpdateSettings(
                    selectedElement.id,
                    selectedElement.widgetType === "tabs"
                      ? { tabsItems: next }
                      : { accordionItems: next }
                  )
                }}
                className="w-full rounded border border-slate-300 bg-white p-2"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() => {
              const curr =
                selectedElement.widgetType === "tabs"
                  ? s.tabsItems || []
                  : s.accordionItems || []
              const next = [
                ...curr,
                { id: generateStudioId("item"), title: "", content: "" },
              ]
              onUpdateSettings(
                selectedElement.id,
                selectedElement.widgetType === "tabs"
                  ? { tabsItems: next }
                  : { accordionItems: next }
              )
            }}
            className="flex w-full items-center justify-center gap-1 rounded border border-dashed border-blue-500 py-1.5 font-semibold text-blue-600 hover:bg-blue-50"
          >
            <Plus className="size-3.5" />
            <span>{dict?.["admin.studio.add_item"]}</span>
          </button>
        </div>
      )}
      {/* SVG / HTML CONTROLS */}
      {(selectedElement.widgetType === "svg" ||
        selectedElement.widgetType === "html") && (
        <div className="space-y-1.5">
          <label className="block font-semibold text-slate-700">
            {dict?.["admin.studio.field.code"]}
          </label>
          <textarea
            rows={6}
            value={
              selectedElement.widgetType === "svg"
                ? s.svgCode || ""
                : s.htmlCode || ""
            }
            onChange={(e) =>
              onUpdateSettings(
                selectedElement.id,
                selectedElement.widgetType === "svg"
                  ? { svgCode: e.target.value }
                  : { htmlCode: e.target.value }
              )
            }
            className="w-full rounded border border-slate-300 p-2 font-mono text-[11px]"
          />
        </div>
      )}
      {/* EDITORIAL NEWS BLOCK CONTROLS */}
    </>
  )
}
