import { eq } from "drizzle-orm";
import { db } from "@/db";
import { wpOptions } from "@/db/schema";
import type { Theme } from "./types";
import { THEME_MODULES, getThemeModule, resolveThemeSlug } from "@/themes/registry";

export const AVAILABLE_THEMES: Theme[] = THEME_MODULES.map((mod) => mod.manifest);

/**
 * Get the active stylesheet slug from wp_options
 */
export async function getActiveThemeSlug(): Promise<string> {
  try {
    const row = await db
      .select({ value: wpOptions.optionValue })
      .from(wpOptions)
      .where(eq(wpOptions.optionName, "stylesheet"))
      .limit(1);

    return resolveThemeSlug(row[0]?.value);
  } catch (err) {
    console.error("Failed to read active theme slug:", err);
    return resolveThemeSlug();
  }
}

/**
 * Get the active theme name from wp_options
 */
export async function getActiveThemeName(): Promise<string> {
  try {
    const row = await db
      .select({ value: wpOptions.optionValue })
      .from(wpOptions)
      .where(eq(wpOptions.optionName, "current_theme"))
      .limit(1);

    return row[0]?.value || getThemeModule().manifest.name;
  } catch (err) {
    console.error("Failed to read current_theme:", err);
    return getThemeModule().manifest.name;
  }
}

async function setOption(name: string, value: string) {
  const existing = await db
    .select({ id: wpOptions.optionId })
    .from(wpOptions)
    .where(eq(wpOptions.optionName, name))
    .limit(1);

  if (existing.length) {
    await db
      .update(wpOptions)
      .set({ optionValue: value })
      .where(eq(wpOptions.optionId, existing[0].id));
  } else {
    await db.insert(wpOptions).values({
      optionName: name,
      optionValue: value,
      autoload: "yes",
    });
  }
}

/**
 * Activate a theme by updating stylesheet, template, and current_theme in wp_options
 */
export async function activateTheme(slug: string): Promise<void> {
  const theme = AVAILABLE_THEMES.find((t) => t.slug === slug);
  if (!theme) {
    throw new Error(`Theme '${slug}' not found`);
  }

  await setOption("stylesheet", theme.slug);
  await setOption("template", theme.slug);
  await setOption("current_theme", theme.name);
}

/**
 * Retrieve all available themes with their active status
 */
export async function getAllThemes(): Promise<Theme[]> {
  const activeSlug = await getActiveThemeSlug();

  return AVAILABLE_THEMES.map((theme) => ({
    ...theme,
    isActive: theme.slug === activeSlug,
  }));
}
