import type { CSSProperties } from "react"
import {
  themeLayoutSchema,
  type ThemeLayoutSettings,
} from "@/db/schema/cms-theme-layout"
import type { HomepageSettings } from "./homepage-types"

export function getHomepageLayoutSettings(
  settings?: Partial<HomepageSettings>
): ThemeLayoutSettings {
  const shape = themeLayoutSchema.shape
  return {
    layout: shape.layout.safeParse(settings?.layout).data ?? "right_sidebar",
    sidebarWidth:
      shape.sidebarWidth.safeParse(settings?.sidebarWidth).data ?? null,
    columnGap: shape.columnGap.safeParse(settings?.columnGap).data ?? null,
    stickySidebars:
      shape.stickySidebars.safeParse(settings?.stickySidebars).data ?? true,
  }
}

export function getHomepageLayoutStyle(
  settings?: Partial<HomepageSettings>
): CSSProperties {
  const options = getHomepageLayoutSettings(settings)
  return {
    ...(options.sidebarWidth !== null
      ? { "--feed-sidebar-width": `${options.sidebarWidth}px` }
      : {}),
    ...(options.columnGap !== null
      ? { "--feed-column-gap": `${options.columnGap}px` }
      : {}),
    "--feed-sidebar-position": options.stickySidebars ? "sticky" : "static",
  } as CSSProperties
}

/** Patch layout only; retain all legacy sections, blocks and unknown future fields. */
export function mergeHomepageLayout(
  raw: string,
  patch: ThemeLayoutSettings,
  fallback: HomepageSettings
): Record<string, unknown> & ThemeLayoutSettings {
  let source: Record<string, unknown> = fallback
  try {
    const parsed: unknown = JSON.parse(raw)
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed))
      source = parsed as Record<string, unknown>
  } catch {
    /* Recover malformed settings from the existing theme defaults. */
  }
  return { ...source, ...themeLayoutSchema.parse(patch) }
}
