import type React from "react"
import type { StudioElement } from "@/lib/studio/types"
export function buildElementInlineStyles(
  el: StudioElement,
  isChildColumn = false
): React.CSSProperties {
  const s = el.settings
  const style: React.CSSProperties = {}

  if (s.backgroundColor) style.backgroundColor = s.backgroundColor
  if (s.textColor) style.color = s.textColor
  if (s.fontSize !== undefined) style.fontSize = `${s.fontSize}px`
  if (s.fontWeight) style.fontWeight = s.fontWeight
  if (s.lineHeight !== undefined) style.lineHeight = s.lineHeight
  if (s.letterSpacing !== undefined)
    style.letterSpacing = `${s.letterSpacing}px`

  if (s.paddingTop !== undefined) style.paddingTop = `${s.paddingTop}px`
  if (s.paddingRight !== undefined) style.paddingRight = `${s.paddingRight}px`
  if (s.paddingBottom !== undefined)
    style.paddingBottom = `${s.paddingBottom}px`
  if (s.paddingLeft !== undefined) style.paddingLeft = `${s.paddingLeft}px`

  if (s.marginTop !== undefined) style.marginTop = `${s.marginTop}px`
  if (s.marginRight !== undefined) style.marginRight = `${s.marginRight}px`
  if (s.marginBottom !== undefined) style.marginBottom = `${s.marginBottom}px`
  if (s.marginLeft !== undefined) style.marginLeft = `${s.marginLeft}px`

  if (s.minHeight) style.minHeight = `${s.minHeight}px`

  if (s.borderStyle && s.borderStyle !== "none") {
    style.borderStyle = s.borderStyle
    style.borderWidth = `${s.borderWidth ?? 1}px`
    style.borderColor = s.borderColor || "#e2e8f0"
  }

  if (s.borderRadius !== undefined) {
    style.borderRadius = `${s.borderRadius}px`
  }

  if (isChildColumn && s.widthPercent) {
    style.flex = `1 1 ${s.widthPercent}%`
    style.minWidth = 0
  }

  if (
    s.blockConfig?.type === "breaking_ticker" ||
    s.blockConfig?.displayStyle === "breaking_bar"
  ) {
    // The ticker owns its surface; apply style controls to that surface rather than a hidden wrapper.
    const properties = [
      "backgroundColor",
      "color",
      "fontSize",
      "fontWeight",
      "lineHeight",
      "letterSpacing",
      "paddingTop",
      "paddingRight",
      "paddingBottom",
      "paddingLeft",
      "borderStyle",
      "borderWidth",
      "borderColor",
      "borderRadius",
    ] as const
    const variables = style as Record<string, string | number | undefined>
    for (const property of properties) {
      if (style[property] !== undefined) {
        variables[
          `--studio-ticker-${property.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`)}`
        ] = style[property] as string | number
        delete style[property]
      }
    }
    if (s.borderStyle === "none")
      variables["--studio-ticker-border-style"] = "none"
    if (s.tickerLabelColor)
      variables["--studio-ticker-label-color"] = s.tickerLabelColor
    if (s.tickerLabelBackground)
      variables["--studio-ticker-label-background"] = s.tickerLabelBackground
    if (s.tickerMetaColor)
      variables["--studio-ticker-meta-color"] = s.tickerMetaColor
    if (s.tickerControlsColor)
      variables["--studio-ticker-controls-color"] = s.tickerControlsColor
  }

  return style
}

export function getShadowClass(shadow?: string): string {
  switch (shadow) {
    case "sm":
      return "shadow-sm"
    case "md":
      return "shadow-md"
    case "lg":
      return "shadow-lg"
    case "xl":
      return "shadow-xl"
    default:
      return ""
  }
}
