import { cache } from "react";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { wpOptions } from "@/db/schema";
import type { Theme } from "./types";
import {
  THEME_MODULES,
  getThemeModule,
  resolveThemeSlug,
} from "@/themes/registry";

export const AVAILABLE_THEMES: Theme[] = THEME_MODULES.map(
  (mod) => mod.manifest
);

/**
 * Get the active stylesheet slug from wp_options
 */
async function read_getActiveThemeSlug(): Promise<string> {
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

/**
 * Activate a theme by updating stylesheet, template, and current_theme in wp_options
 */
export async function activateTheme(slug: string): Promise<void> {
  const { verifyAdmin } = await import("@/lib/authMIddleware");
  await verifyAdmin();
  const { themeSlugSchema } = await import("@/db/schema/cms-themes");
  slug = themeSlugSchema.parse(slug);
  const theme = AVAILABLE_THEMES.find((t) => t.slug === slug);
  if (!theme) {
    throw new Error("admin.themes.activation_error");
  }

  const { setOption } = await import("@/services/settings.service");
  await db.transaction(async (tx) => {
    await setOption("stylesheet", theme.slug, tx);
    await setOption("template", theme.slug, tx);
    await setOption("current_theme", theme.name, tx);
  });
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

export const getActiveThemeSlug = cache(read_getActiveThemeSlug);
