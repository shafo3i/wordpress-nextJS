import { useState } from "react"
import { FONTS } from "@/lib/customizer/fonts"
import type {
  StudioDesign,
  StudioTypography,
} from "@/db/schema/cms-studio-design"
import type { StudioInspectorProps } from "./studio-panel-types"

const inputClass = "w-full rounded border border-slate-300 bg-white px-2 py-1.5"
export function StudioDesignControls({
  selectedElement,
  onUpdateSettings,
  dict,
}: Pick<
  StudioInspectorProps,
  "selectedElement" | "onUpdateSettings" | "dict"
>) {
  const [scope, setScope] = useState<
    keyof NonNullable<StudioDesign["typography"]>
  >(
    selectedElement.widgetType === "heading"
      ? "heading"
      : ["paragraph", "text_editor"].includes(selectedElement.widgetType)
        ? "text"
        : "title"
  )
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">(
    "desktop"
  )
  const [linked, setLinked] = useState(true)
  const design = selectedElement.settings.design || {}
  const t = (key: string) => dict?.[`admin.studio.design.${key}`] || ""
  const update = (patch: Partial<StudioDesign>) =>
    onUpdateSettings(selectedElement.id, { design: { ...design, ...patch } })
  const typography = design.typography?.[scope]?.[device] || {}
  const updateType = (patch: Partial<StudioTypography>) =>
    update({
      typography: {
        ...design.typography,
        [scope]: {
          ...design.typography?.[scope],
          [device]: { ...typography, ...patch },
        },
      },
    })
  const number = (
    key: string,
    value: number | undefined,
    onChange: (value: number | undefined) => void,
    min: number,
    max: number,
    step = 1
  ) => (
    <label key={key} className="block space-y-1">
      <span>{t(key)}</span>
      <input
        className={inputClass}
        type="number"
        min={min}
        max={max}
        step={step}
        value={value ?? ""}
        placeholder={t("inherit")}
        onChange={(e) =>
          onChange(e.target.value === "" ? undefined : Number(e.target.value))
        }
      />
    </label>
  )
  const select = (
    key: string,
    value: string | undefined,
    options: readonly string[],
    onChange: (value: string) => void
  ) => (
    <label className="block space-y-1">
      <span>{t(key)}</span>
      <select
        className={inputClass}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{t("inherit")}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {key === "family"
              ? FONTS.find((font) => font.id === option)?.label || t(option)
              : t(option) || option}
          </option>
        ))}
      </select>
    </label>
  )
  const color = (
    key: string,
    value: string | undefined,
    onChange: (value: string | undefined) => void
  ) => (
    <label className="block space-y-1">
      <span>{t(key)}</span>
      <input
        className={inputClass}
        value={value || ""}
        placeholder={t("inherit")}
        onChange={(e) => onChange(e.target.value || undefined)}
      />
    </label>
  )
  return (
    <div className="space-y-4 border-t border-slate-200 pt-4">
      <details open className="space-y-3">
        <summary className="cursor-pointer font-semibold">
          {t("typography")}
        </summary>
        <label className="block space-y-1">
          <span>{t("target")}</span>
          <select
            className={inputClass}
            value={scope}
            onChange={(e) => setScope(e.target.value as typeof scope)}
          >
            {["heading", "title", "text", "excerpt", "meta", "category"].map(
              (value) => (
                <option key={value} value={value}>
                  {t(value)}
                </option>
              )
            )}
          </select>
        </label>
        <label className="block space-y-1">
          <span>{t("device")}</span>
          <select
            className={inputClass}
            value={device}
            onChange={(e) => setDevice(e.target.value as typeof device)}
          >
            {["desktop", "tablet", "mobile"].map((value) => (
              <option key={value} value={value}>
                {t(value)}
              </option>
            ))}
          </select>
        </label>
        <p className="text-xs text-slate-500">{t("responsive_help")}</p>
        <div className="grid grid-cols-2 gap-2">
          {number(
            "size",
            typography.size,
            (size) => updateType({ size }),
            0,
            200,
            0.1
          )}
          {select("unit", typography.unit, ["px", "rem", "em"], (unit) =>
            updateType({
              unit: (unit || undefined) as StudioTypography["unit"],
            })
          )}
        </div>
        {select(
          "family",
          typography.family,
          [
            "inherit",
            "serif",
            "sans-serif",
            "monospace",
            ...FONTS.map((font) => font.id),
          ],
          (family) =>
            updateType({
              family: (family || undefined) as StudioTypography["family"],
            })
        )}
        {select(
          "weight",
          typography.weight,
          ["300", "400", "500", "600", "700", "800", "900"],
          (weight) =>
            updateType({
              weight: (weight || undefined) as StudioTypography["weight"],
            })
        )}
        {select(
          "fontStyle",
          typography.fontStyle,
          ["normal", "italic"],
          (value) =>
            updateType({
              fontStyle: (value || undefined) as StudioTypography["fontStyle"],
            })
        )}
        <div className="grid grid-cols-2 gap-2">
          {number(
            "lineHeight",
            typography.lineHeight,
            (lineHeight) => updateType({ lineHeight }),
            0.5,
            4,
            0.05
          )}
          {number(
            "spacing",
            typography.spacing,
            (spacing) => updateType({ spacing }),
            -10,
            30,
            0.1
          )}
        </div>
        {color("color", typography.color, (color) => updateType({ color }))}
        {color("hoverColor", typography.hoverColor, (hoverColor) =>
          updateType({ hoverColor })
        )}
        {select(
          "align",
          typography.align,
          ["start", "center", "end", "justify"],
          (align) =>
            updateType({
              align: (align || undefined) as StudioTypography["align"],
            })
        )}
        {select(
          "transform",
          typography.transform,
          ["none", "uppercase", "lowercase", "capitalize"],
          (transform) =>
            updateType({
              transform: (transform ||
                undefined) as StudioTypography["transform"],
            })
        )}
        {select(
          "decoration",
          typography.decoration,
          ["none", "underline", "line-through"],
          (decoration) =>
            updateType({
              decoration: (decoration ||
                undefined) as StudioTypography["decoration"],
            })
        )}
        <button
          type="button"
          className="text-blue-700 underline"
          onClick={() =>
            update({
              typography: {
                ...design.typography,
                [scope]: { ...design.typography?.[scope], [device]: undefined },
              },
            })
          }
        >
          {t("reset_typography")}
        </button>
      </details>
      <details className="space-y-3">
        <summary className="cursor-pointer font-semibold">
          {t("appearance")}
        </summary>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={linked}
            onChange={(e) => setLinked(e.target.checked)}
          />
          {t("linked")}
        </label>
        {(["cardRadius", "imageRadius"] as const).map((target) => (
          <fieldset key={target} className="space-y-2">
            <legend className="font-semibold">{t(target)}</legend>
            <div className="grid grid-cols-2 gap-2">
              {(
                ["topLeft", "topRight", "bottomRight", "bottomLeft"] as const
              ).map((corner) =>
                number(
                  corner,
                  design[target]?.[corner],
                  (value) => {
                    if (value === undefined)
                      return update({ [target]: undefined })
                    const corners = {
                      topLeft: 0,
                      topRight: 0,
                      bottomRight: 0,
                      bottomLeft: 0,
                      ...design[target],
                    }
                    update({
                      [target]: linked
                        ? {
                            topLeft: value,
                            topRight: value,
                            bottomRight: value,
                            bottomLeft: value,
                          }
                        : { ...corners, [corner]: value },
                    })
                  },
                  0,
                  200
                )
              )}
            </div>
          </fieldset>
        ))}
        {color("cardBackground", design.cardBackground, (cardBackground) =>
          update({ cardBackground })
        )}
        {(["cardBorders", "postDividers", "sectionTitleBorder"] as const).map(
          (key) => (
            <label key={key} className="block space-y-1">
              <span>{t(key)}</span>
              <select
                aria-label={t(key)}
                className={inputClass}
                value={design[key] === undefined ? "" : String(design[key])}
                onChange={(event) =>
                  update({
                    [key]:
                      event.target.value === ""
                        ? undefined
                        : event.target.value === "true",
                    ...(key === "cardBorders" && event.target.value === "true"
                      ? {
                          cardBorderStyle:
                            design.cardBorderStyle &&
                            design.cardBorderStyle !== "none"
                              ? design.cardBorderStyle
                              : "solid",
                          cardBorderWidth: design.cardBorderWidth || 1,
                        }
                      : {}),
                  })
                }
              >
                <option value="">{t("inherit")}</option>
                <option value="true">{t("show")}</option>
                <option value="false">{t("hide")}</option>
              </select>
            </label>
          )
        )}
        {select(
          "cardBorderStyle",
          design.cardBorderStyle,
          ["none", "solid", "dashed", "dotted"],
          (value) =>
            update({
              cardBorderStyle: (value ||
                undefined) as StudioDesign["cardBorderStyle"],
            })
        )}
        {number(
          "cardBorderWidth",
          design.cardBorderWidth,
          (cardBorderWidth) => update({ cardBorderWidth }),
          0,
          20
        )}
        {color("cardBorderColor", design.cardBorderColor, (cardBorderColor) =>
          update({ cardBorderColor })
        )}
        {select(
          "thumbnailPosition",
          design.thumbnailPosition,
          ["start", "end"],
          (value) =>
            update({
              thumbnailPosition: (value ||
                undefined) as StudioDesign["thumbnailPosition"],
            })
        )}
        {(
          [
            "gap",
            "cardPadding",
            "thumbnailWidth",
            "titleLines",
            "excerptLength",
          ] as const
        ).map((key) =>
          number(
            key,
            design[key],
            (value) => update({ [key]: value }),
            key === "thumbnailWidth" ? 40 : key === "titleLines" ? 1 : 0,
            key === "titleLines"
              ? 8
              : key === "excerptLength"
                ? 600
                : key === "thumbnailWidth"
                  ? 320
                  : 120
          )
        )}
        <fieldset className="space-y-2">
          <legend className="font-semibold">{t("shadow")}</legend>
          <div className="grid grid-cols-2 gap-2">
            {(["x", "y", "blur", "spread"] as const).map((key) =>
              number(
                key,
                design.shadow?.[key],
                (value) =>
                  update({
                    shadow:
                      value === undefined
                        ? undefined
                        : {
                            x: 0,
                            y: 0,
                            blur: 0,
                            spread: 0,
                            color: "#00000033",
                            ...design.shadow,
                            [key]: value,
                          },
                  }),
                key === "blur" ? 0 : key === "spread" ? -50 : -100,
                100
              )
            )}
          </div>
          {color("color", design.shadow?.color, (value) =>
            update({
              shadow: value
                ? {
                    x: 0,
                    y: 0,
                    blur: 0,
                    spread: 0,
                    ...design.shadow,
                    color: value,
                  }
                : undefined,
            })
          )}
        </fieldset>
        <button
          type="button"
          className="text-blue-700 underline"
          onClick={() =>
            onUpdateSettings(selectedElement.id, {
              design: { typography: design.typography },
            })
          }
        >
          {t("reset_appearance")}
        </button>
      </details>
    </div>
  )
}
