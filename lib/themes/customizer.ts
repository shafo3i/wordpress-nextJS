import { eq } from "drizzle-orm";
import { db } from "@/db";
import { wpOptions } from "@/db/schema";
import { AVAILABLE_THEMES, getActiveThemeSlug } from "./loader";
import type { CustomizerPayload, ThemeMods } from "./types";
import { getMenuWithItems, getNavMenuLocations } from "@/lib/menus/db";
import { MenuItem } from "@/lib/menus/types";
import { resolveMods, sanitizeMods } from "@/lib/customizer/resolve";
import { buildSections, getPluginSections } from "@/lib/customizer/registry";
import type { CustomizerSection } from "@/lib/customizer/types";
import { applyFilters } from "@/lib/plugins/hooks";
import { getActivePluginSlugs } from "@/lib/plugins/loader";
import { getThemeModule, hasTheme, resolveThemeSlug } from "@/themes/registry";

export type { CustomizerPayload };


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
    getOption("blogname", "PressForge News"),
    getOption("blogdescription", "The Independent News Journal"),
    getNavMenuLocations(),
  ]);

  const slug = resolveThemeSlug(targetThemeSlug || activeSlug);
  const currentTheme = getThemeModule(slug).manifest;
  const activeTheme = getThemeModule(activeSlug).manifest;

  const modsRaw = await getOption(`theme_mods_${slug}`, "");

  let stored: Record<string, unknown> | null = null;
  if (modsRaw) {
    try {
      stored = JSON.parse(modsRaw);
    } catch (e) {
      console.error(`Failed to parse theme_mods_${slug}:`, e);
    }
  }
  const mods: ThemeMods = resolveMods(slug, stored);

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

  const primaryMenuId = locations.primary_en || locations.primary;
  if (primaryMenuId) {
    const pMenu = await getMenuWithItems(primaryMenuId);
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

  const footerMenuId = locations.footer_en || locations.footer;
  if (footerMenuId) {
    const fMenu = await getMenuWithItems(footerMenuId);
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
 * Customizer sections for a theme: core + theme sections, extended by plugins through
 * the `customizer_sections` filter (plugins must be initialised by the caller).
 */
export async function getCustomizerSections(themeSlug: string): Promise<CustomizerSection[]> {
  const sections = buildSections(themeSlug, getPluginSections(await getActivePluginSlugs()));
  return applyFilters<CustomizerSection[]>("customizer_sections", sections, { themeSlug });
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
  if (!hasTheme(stylesheet)) {
    throw new Error(`Theme '${stylesheet}' not found`);
  }

  const updates = [
    setOption(`theme_mods_${stylesheet}`, JSON.stringify(sanitizeMods(stylesheet, mods as Record<string, unknown>))),
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

/** Favicon chosen in the active theme's customizer settings, if it is a usable URL. */
export async function getActiveFaviconUrl(): Promise<string | null> {
  try {
    const slug = await getActiveThemeSlug();
    const raw = await getOption(`theme_mods_${slug}`, "");
    const url = String(JSON.parse(raw || "{}").faviconUrl ?? "").trim();
    return /^(https?:\/\/|\/)/.test(url) ? url : null;
  } catch {
    return null;
  }
}