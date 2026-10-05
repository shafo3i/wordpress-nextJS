import type { Mods } from "./types";

/** Route rendered inside the customizer iframe. */
export const PREVIEW_ROUTE = "/customize-preview";

export const previewUrl = (themeSlug: string, lang?: string) =>
  `${PREVIEW_ROUTE}?theme=${encodeURIComponent(themeSlug)}${lang ? `&lang=${encodeURIComponent(lang)}` : ""}`;

export type PreviewPage = "home" | "single";

/** Everything the preview needs that changes while editing. */
export interface PreviewState {
  mods: Mods;
  siteTitle: string;
  siteTagline: string;
  page: PreviewPage;
}

export type CustomizerToPreview = { type: "customizer:state"; state: PreviewState };
export type PreviewToCustomizer = { type: "customizer:ready" };