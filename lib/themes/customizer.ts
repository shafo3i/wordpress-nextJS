import { eq } from "drizzle-orm";
import { db } from "@/db";
import { wpOptions } from "@/db/schema";
import { AVAILABLE_THEMES, getActiveThemeSlug } from "./loader";
import { CustomizerPayload, DEFAULT_MODS, Theme, ThemeMods } from "./types";
import { getMenuWithItems, getNavMenuLocations } from "@/lib/menus/db";
import { MenuItem } from "@/lib/menus/types";

export { type CustomizerPayload, DEFAULT_MODS };


async function getOption(name: string, fallback = ""): Promise<string> {
  try {
    const row = await db
      .select({ value: wpOptions.optionValue })
      .from(wpOptions)
      .where(eq(wpOptions.optionName, name))
      .limit(1);

    return row[0]?.value ?? fallback;
  } catch (err) {
    return fallback;
  }
}

async function setOption(name: string, value: string): Promise<void> {
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
 * Retrieve all customizer data for the specified or active theme
 */
export async function getCustomizerData(targetThemeSlug?: string): Promise<CustomizerPayload> {
  const [activeSlug, siteTitle, siteTagline, locations] = await Promise.all([
    getActiveThemeSlug(),
    getOption("blogname", "The Daily Ledger"),
    getOption("blogdescription", "The Independent News Journal"),
    getNavMenuLocations(),
  ]);

  const slug = targetThemeSlug || activeSlug;
  const currentTheme = AVAILABLE_THEMES.find((t) => t.slug === slug) || AVAILABLE_THEMES[0];
  const activeTheme = AVAILABLE_THEMES.find((t) => t.slug === activeSlug) || AVAILABLE_THEMES[0];

  const modsRaw = await getOption(`theme_mods_${slug}`, "");

  const defaultThemeMods = DEFAULT_MODS[slug] || DEFAULT_MODS["ledger-classic"];
  let mods: ThemeMods = { ...defaultThemeMods };

  if (modsRaw) {
    try {
      const parsed = JSON.parse(modsRaw);
      mods = { ...mods, ...parsed };
    } catch (e) {
      console.error(`Failed to parse theme_mods_${slug}:`, e);
    }
  }

  // Load primary nav items for live preview
  let primaryNav: MenuItem[] = [
    { id: "1", title: "Home", url: "/", order: 1 },
    { id: "2", title: "News", url: "/category/news", order: 2 },
    { id: "3", title: "Business", url: "/category/business", order: 3 },
    { id: "4", title: "Technology", url: "/category/technology", order: 4 },
    { id: "5", title: "Culture", url: "/category/culture", order: 5 },
    { id: "6", title: "Opinion", url: "/category/opinion", order: 6 },
    { id: "7", title: "About", url: "/about", order: 7 },
  ];

  if (locations.primary) {
    const pMenu = await getMenuWithItems(locations.primary);
    if (pMenu && pMenu.items.length > 0) {
      primaryNav = pMenu.items;
    }
  }

  let footerNav: MenuItem[] = [
    { id: "f1", title: "About", url: "/about", order: 1 },
    { id: "f2", title: "Contact", url: "/contact", order: 2 },
    { id: "f3", title: "Editorial Standards", url: "/editorial-standards", order: 3 },
    { id: "f4", title: "Privacy Policy", url: "/privacy", order: 4 },
  ];

  if (locations.footer) {
    const fMenu = await getMenuWithItems(locations.footer);
    if (fMenu && fMenu.items.length > 0) {
      footerNav = fMenu.items;
    }
  }

  return {
    themeSlug: currentTheme.slug,
    themeName: currentTheme.name,
    activeThemeSlug: activeTheme.slug,
    activeThemeName: activeTheme.name,
    siteTitle,
    siteTagline,
    mods,
    allThemes: AVAILABLE_THEMES,
    primaryNav,
    footerNav,
  };
}

/**
 * Persist customizer adjustments into wp_options
 */
export async function saveCustomizerData(
  stylesheet: string,
  mods: ThemeMods,
  identity: { siteTitle: string; siteTagline: string },
  activate = false
): Promise<void> {
  const updates = [
    setOption(`theme_mods_${stylesheet}`, JSON.stringify(mods)),
    setOption("blogname", identity.siteTitle.trim()),
    setOption("blogdescription", identity.siteTagline.trim()),
  ];

  if (activate) {
    const theme = AVAILABLE_THEMES.find((t) => t.slug === stylesheet);
    if (theme) {
      updates.push(setOption("stylesheet", theme.slug));
      updates.push(setOption("template", theme.slug));
      updates.push(setOption("current_theme", theme.name));
    }
  }

  await Promise.all(updates);
}
