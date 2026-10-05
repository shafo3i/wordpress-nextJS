import type { ThemeModule } from "@/lib/themes/types";

import broadsheet from "./pressforge-broadsheet";
import magazine from "./pressforge-magazine";
import midnight from "./pressforge-midnight";
import longform from "./pressforge-longform";

export const DEFAULT_THEME_SLUG = "pressforge-broadsheet";

/** Registration order is the order shown in the admin. */
export const THEME_MODULES: ThemeModule[] = [broadsheet, magazine, midnight, longform];

const BY_SLUG = new Map<string, ThemeModule>();
for (const mod of THEME_MODULES) {
  BY_SLUG.set(mod.manifest.slug, mod);
  for (const legacy of mod.manifest.legacySlugs ?? []) BY_SLUG.set(legacy, mod);
}

export function resolveThemeSlug(slug?: string | null): string {
  return (slug && BY_SLUG.get(slug)?.manifest.slug) || DEFAULT_THEME_SLUG;
}

export function getThemeModule(slug?: string | null): ThemeModule {
  return BY_SLUG.get(resolveThemeSlug(slug))!;
}

export function hasTheme(slug: string): boolean {
  return BY_SLUG.has(slug);
}
