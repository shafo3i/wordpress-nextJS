import { eq } from "drizzle-orm";
import { db } from "@/db";
import { wpOptions } from "@/db/schema";
import { Theme } from "./types";

export const AVAILABLE_THEMES: Theme[] = [
  {
    slug: "pressforge-broadsheet",
    name: "PressForge Broadsheet",
    description: "The flagship newspaper of record layout with a distinguished masthead, classic serif headlines, and a multi-column front page.",
    version: "2.0.0",
    author: "PressForge Community",
    authorUrl: "https://github.com/pressforge/pressforge",
    themeUrl: "https://github.com/pressforge/pressforge",
    screenshot: "/themes/ledger-classic/screenshot.png",
    tags: "news, newspaper, two-columns, custom-header, editorial",
  },
  {
    slug: "pressforge-magazine",
    name: "PressForge Magazine",
    description: "A high-impact digital magazine layout featuring bento grid hero cards, trending story grids, and multimedia highlights.",
    version: "2.1.0",
    author: "PressForge Community",
    authorUrl: "https://github.com/pressforge/pressforge",
    themeUrl: "https://github.com/pressforge/pressforge",
    screenshot: "/themes/ledger-magazine/screenshot.png",
    tags: "magazine, visual, grid-layout, trending-widgets",
  },
  {
    slug: "pressforge-midnight",
    name: "PressForge Midnight",
    description: "A sleek high-contrast dark theme designed for night-time digital journalism, financial terminals, and tech publications.",
    version: "1.0.0",
    author: "PressForge Community",
    authorUrl: "https://github.com/pressforge/pressforge",
    themeUrl: "https://github.com/pressforge/pressforge",
    screenshot: "/themes/ledger-dark/screenshot.png",
    tags: "dark-mode, news, modern, high-contrast",
  },
  {
    slug: "pressforge-longform",
    name: "PressForge Longform",
    description: "A distraction-free reading theme with generous white-space, elegant typography, and focused single-column storytelling.",
    version: "1.0.2",
    author: "PressForge Community",
    authorUrl: "https://github.com/pressforge/pressforge",
    themeUrl: "https://github.com/pressforge/pressforge",
    screenshot: "/themes/ledger-reader/screenshot.png",
    tags: "news, clean, one-column, longform, accessibility-ready",
  },
];

const DEFAULT_THEME_SLUG = "pressforge-broadsheet";

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

    const val = row[0]?.value;
    if (val === "ledger-classic") return "pressforge-broadsheet";
    if (val === "ledger-magazine") return "pressforge-magazine";
    if (val === "ledger-dark") return "pressforge-midnight";
    if (val === "ledger-reader") return "pressforge-longform";
    return val ?? DEFAULT_THEME_SLUG;
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
