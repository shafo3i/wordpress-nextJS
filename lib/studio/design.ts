import type { CSSProperties } from "react"
import { FONTS } from "@/lib/customizer/fonts"
import type { StudioDesign } from "@/db/schema/cms-studio-design"
import type { StudioElementSettings } from "./types"

export function studioDesignForDevice(
  design: StudioDesign | undefined,
  device?: "desktop" | "tablet" | "mobile"
): StudioDesign | undefined {
  if (!design || !device) return design
  const typography = { ...design.typography }
  for (const scope of Object.keys(typography) as (keyof typeof typography)[]) {
    const values = typography[scope]
    const merged = { ...values?.desktop }
    for (const override of device === "desktop"
      ? []
      : device === "tablet"
        ? [values?.tablet]
        : [values?.tablet, values?.mobile]) {
      if (!override) continue
      const { unit, ...properties } = override
      Object.assign(
        merged,
        Object.fromEntries(
          Object.entries(properties).filter(([, value]) => value !== undefined)
        )
      )
      if (override.size !== undefined) merged.unit = unit || "px"
    }
    typography[scope] = { desktop: merged }
  }
  return { ...design, typography }
}

export function effectiveStudioDesign(
  settings: StudioElementSettings
): StudioDesign {
  const design = { ...settings.design }
  if (settings.borderRadius !== undefined) {
    const corners = {
      topLeft: settings.borderRadius,
      topRight: settings.borderRadius,
      bottomRight: settings.borderRadius,
      bottomLeft: settings.borderRadius,
    }
    design.cardRadius ??= corners
    design.imageRadius ??= corners
  }
  design.cardBorderStyle ??= settings.borderStyle
  design.cardBorderWidth ??= settings.borderWidth
  design.cardBorderColor ??= settings.borderColor
  design.cardBackground ??= settings.backgroundColor
  for (const scope of [
    "heading",
    "title",
    "text",
    "excerpt",
    "meta",
  ] as const) {
    if (
      settings.fontSize === undefined &&
      !settings.textColor &&
      !settings.fontWeight
    )
      continue
    design.typography = {
      ...design.typography,
      [scope]: {
        ...design.typography?.[scope],
        desktop: {
          ...(settings.fontSize !== undefined
            ? { size: settings.fontSize, unit: "px" as const }
            : {}),
          ...(settings.textColor ? { color: settings.textColor } : {}),
          ...(settings.fontWeight ? { weight: settings.fontWeight } : {}),
          ...design.typography?.[scope]?.desktop,
        },
      },
    }
  }
  return design
}

export function studioDesignPresentation(design?: StudioDesign) {
  const style: Record<string, string | number> = {}
  const attributes: Record<string, string> = {}
  for (const [scope, devices] of Object.entries(design?.typography || {})) {
    for (const [device, values] of Object.entries(devices || {})) {
      for (const [property, value] of Object.entries(values || {})) {
        if (property === "unit" || value === undefined) continue
        attributes[`data-s-${scope}-${property.toLowerCase()}-${device}`] = ""
        const suffix =
          property === "size"
            ? values.unit || "px"
            : property === "spacing"
              ? "px"
              : ""
        style[`--s-${scope}-${property.toLowerCase()}-${device}`] =
          property === "family"
            ? FONTS.find((font) => font.id === value)?.stack || String(value)
            : `${value}${suffix}`
      }
    }
  }
  for (const target of ["card", "image"] as const) {
    const radius = design?.[`${target}Radius`]
    if (radius) {
      attributes[`data-s-${target}-radius`] = ""
      style[`--s-${target}-radius`] =
        `${radius.topLeft}px ${radius.topRight}px ${radius.bottomRight}px ${radius.bottomLeft}px`
    }
  }
  const properties = {
    cardBackground: "background",
    cardBorderStyle: "border-style",
    cardBorderWidth: "border-width",
    cardBorderColor: "border-color",
    cardPadding: "padding",
    gap: "gap",
    thumbnailWidth: "thumbnail-width",
    titleLines: "title-lines",
  } as const
  for (const [key, name] of Object.entries(properties)) {
    const value = design?.[key as keyof typeof properties]
    if (value === undefined) continue
    attributes[`data-s-${name}`] = ""
    style[`--s-${name}`] =
      `${value}${["cardBorderWidth", "cardPadding", "gap", "thumbnailWidth"].includes(key) ? "px" : ""}`
  }
  if (design?.shadow) {
    const s = design.shadow
    attributes["data-s-shadow"] = ""
    style["--s-shadow"] =
      `${s.x}px ${s.y}px ${s.blur}px ${s.spread}px ${s.color}`
  }
  return { style: style as CSSProperties, attributes }
}
