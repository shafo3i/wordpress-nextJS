import { getActiveThemeSlug, getAllThemes } from "@/lib/themes/loader";
import { getHomepageSettings } from "@/lib/themes/homepage-blocks";
import { getCategoriesForMenu } from "@/lib/menus/db";
import { Theme } from "@/lib/themes/types";
import { HomepageSettings } from "@/lib/themes/homepage-types";

export interface ThemeSettingsQueryData {
  allThemes: Theme[];
  currentTheme: Theme;
  targetSlug: string;
  homepageSettings: HomepageSettings;
  categories: { id: string; name: string; slug: string }[];
}

export async function getThemeSettingsQuery(targetThemeSlug?: string): Promise<ThemeSettingsQueryData> {
  const activeSlug = await getActiveThemeSlug();
  const targetSlug = targetThemeSlug || activeSlug;

  const [allThemes, homepageSettings, categories] = await Promise.all([
    getAllThemes(),
    getHomepageSettings(targetSlug),
    getCategoriesForMenu(),
  ]);

  const currentTheme = allThemes.find((t) => t.slug === targetSlug) || allThemes[0];

  return {
    allThemes,
    currentTheme,
    targetSlug: currentTheme?.slug || targetSlug,
    homepageSettings,
    categories,
  };
}
