import { z } from "zod"
import { customizerModsSchema } from "@/db/schema/cms-customizer"
import { sanitizeMods } from "./resolve"
import type { Mods } from "./types"

/** Route rendered inside the customizer iframe. */
export const PREVIEW_ROUTE = "/customize-preview"

export const previewUrl = (themeSlug: string, lang?: string) =>
  `${PREVIEW_ROUTE}?theme=${encodeURIComponent(themeSlug)}${lang ? `&lang=${encodeURIComponent(lang)}` : ""}`

export type PreviewPage = "home" | "single" | "category"

/** Everything the preview needs that changes while editing. */
export interface PreviewState {
  mods: Mods
  siteTitle: string
  siteTagline: string
  page: PreviewPage
}

export type CustomizerToPreview = {
  type: "customizer:state"
  state: PreviewState
}
export type PreviewToCustomizer = { type: "customizer:ready" }

const previewStateSchema = z.object({
  mods: customizerModsSchema,
  siteTitle: z.string().max(500),
  siteTagline: z.string().max(2000),
  page: z.enum(["home", "single", "category"]),
})
export function parsePreviewState(
  value: unknown,
  themeSlug: string
): PreviewState | null {
  const parsed = previewStateSchema.safeParse(value)
  return parsed.success
    ? { ...parsed.data, mods: sanitizeMods(themeSlug, parsed.data.mods) }
    : null
}
