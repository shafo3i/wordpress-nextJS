import { eq } from "drizzle-orm";
import { db } from "@/db";
import { wpOptions } from "@/db/schema";
import { Theme } from "./types";

export const AVAILABLE_THEMES: Theme[] = [
  {
    slug: "ledger-classic",
    name: "Ledger Classic",
    description: "The flagship newspaper theme with a bold editorial masthead, classic serif headlines, and a multi-column front page.",
    version: "1.3.0",
    author: "Ledger Labs",
    authorUrl: "https://ledgerlabs.example",
    themeUrl: "https://ledgerlabs.example/themes/ledger-classic",
    screenshot: "/themes/ledger-classic/screenshot.png",
    tags: "news, newspaper, two-columns, custom-header, editorial",
  },
  {
    slug: "ledger-reader",
    name: "Ledger Reader",
    description: "A distraction-free reading theme with generous white-space, elegant typography, and focused single-column storytelling.",
    version: "1.0.2",
    author: "Ledger Labs",
    authorUrl: "https://ledgerlabs.example",
    themeUrl: "https://ledgerlabs.example/themes/ledger-reader",
    screenshot: "/themes/ledger-reader/screenshot.png",
    tags: "news, clean, one-column, longform, accessibility-ready",
  },
  {
    slug: "ledger-dark",
    name: "Ledger Dark",
    description: "A sleek high-contrast dark theme designed for night-time digital journalism, financial terminals, and tech publications.",
    version: "0.9.5",
    author: "Ledger Labs",
    authorUrl: "https://ledgerlabs.example",
    themeUrl: "https://ledgerlabs.example/themes/ledger-dark",
    screenshot: "/themes/ledger-dark/screenshot.png",
    tags: "dark-mode, news, modern, high-contrast",
  },
  {
    slug: "ledger-magazine",
    name: "Ledger Magazine",
    description: "A high-impact magazine layout featuring prominent visual hero banners, trending story grids, and multimedia highlights.",
    version: "2.1.0",
    author: "Ledger Labs",
    authorUrl: "https://ledgerlabs.example",
    themeUrl: "https://ledgerlabs.example/themes/ledger-magazine",
    screenshot: "/themes/ledger-magazine/screenshot.png",
    tags: "magazine, visual, grid-layout, trending-widgets",
  },
];

const DEFAULT_THEME_SLUG = "ledger-classic";

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

    return row[0]?.value || DEFAULT_THEME_SLUG;
  } catch (err) {
    console.error("Failed to read active theme slug:", err);
    return DEFAULT_THEME_SLUG;
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

    return row[0]?.value || "Ledger Classic";
  } catch (err) {
    console.error("Failed to read current_theme:", err);
    return "Ledger Classic";
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
