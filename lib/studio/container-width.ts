import type { StudioElementSettings } from "./types"

export function studioContainerWidthMode(settings: StudioElementSettings) {
  if (settings.contentWidth === "full") return "full"
  if (settings.contentWidth === "inherit") return "inherit"
  // Older Studio documents stamped 1280px on every new section. Treat that
  // legacy default as inherited; explicit choices now carry customWidth.
  if (settings.customWidth || (settings.maxWidth && settings.maxWidth !== 1280))
    return "boxed"
  return "inherit"
}
export function studioContainerMaxWidth(settings: StudioElementSettings) {
  const mode = studioContainerWidthMode(settings)
  return mode === "full"
    ? undefined
    : mode === "inherit"
      ? "var(--theme-container-width, 1280px)"
      : `${settings.maxWidth || 1280}px`
}
