import "server-only";
import { verifyAdmin } from "@/lib/authMIddleware";
import { customizerSaveSchema } from "@/db/schema/cms-appearance";
import { safeMediaUrl } from "@/lib/post-media";
import { eq } from "drizzle-orm"
import { db, type DB } from "@/db"
import { wpOptions } from "@/db/schema"
import { AVAILABLE_THEMES, getActiveThemeSlug } from "./loader"
import type { CustomizerPayload, ThemeMods } from "./types"
import { getMenuWithItems, getNavMenuLocations } from "@/lib/menus/db"
import { MenuItem } from "@/lib/menus/types"
import { resolveMods, sanitizeMods } from "@/lib/customizer/resolve"
import { buildSections, getPluginSections } from "@/lib/customizer/registry"
import type { CustomizerSection } from "@/lib/customizer/types"

import { getActivePluginSlugs } from "@/lib/plugins/loader"
import { getThemeModule, hasTheme, resolveThemeSlug } from "@/themes/registry"
import { getGlobalSiteLogo } from "@/services/site-logo.service"

export type { CustomizerPayload }

async function getOption(name: string, fallback = ""): Promise<string> {
  try {
    const row = await db
      .select({ value: wpOptions.optionValue })
      .from(wpOptions)
      .where(eq(wpOptions.optionName, name))
      .limit(1)

    return row[0]?.value ?? fallback
  } catch {
    return fallback
  }
}

/**
 * Retrieve all customizer data for the specified or active theme
 */
export async function getCustomizerData(
  targetThemeSlug?: string
): Promise<CustomizerPayload> {
  // This projected data is also used by the public theme context. Admin query/section entry points are guarded separately.
  const [activeSlug, siteTitle, siteTagline, locations] = await Promise.all([
    getActiveThemeSlug(),
    getOption("blogname", ""),
    getOption("blogdescription", ""),
    getNavMenuLocations(),
  ])

  const slug = resolveThemeSlug(targetThemeSlug || activeSlug)
  const currentTheme = getThemeModule(slug).manifest
  const activeTheme = getThemeModule(activeSlug).manifest

  const modsRaw = await getOption(`theme_mods_${slug}`, "")

  let stored: Record<string, unknown> | null = null
  if (modsRaw) {
    try {
      stored = JSON.parse(modsRaw)
    } catch (e) {
      console.error(`Failed to parse theme_mods_${slug}:`, e)
    }
  }
  const globalLogo = await getGlobalSiteLogo()
  const mods: ThemeMods = {
    ...resolveMods(slug, stored),
    ...(globalLogo ? { logoUrl: globalLogo.url } : {}),
  }

  // Load primary nav items for live preview
  let primaryNav: MenuItem[] = [];

  const primaryMenuId = locations.primary_en || locations.primary
  if (primaryMenuId) {
    const pMenu = await getMenuWithItems(primaryMenuId)
    if (pMenu && pMenu.items.length > 0) {
      primaryNav = pMenu.items
    }
  }

  let footerNav: MenuItem[] = [];

  const footerMenuId = locations.footer_en || locations.footer
  if (footerMenuId) {
    const fMenu = await getMenuWithItems(footerMenuId)
    if (fMenu && fMenu.items.length > 0) {
      footerNav = fMenu.items
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
  }
}

/**
 * Customizer sections for a theme: core + theme sections, extended by plugins through
 * the `customizer_sections` filter (plugins must be initialised by the caller).
 */
export async function getCustomizerSections(
  themeSlug: string
): Promise<CustomizerSection[]> {
  await verifyAdmin();
  const sections = buildSections(
    themeSlug,
    getPluginSections(await getActivePluginSlugs())
  )
  const globalLogo = await getGlobalSiteLogo()
  const visible = globalLogo
    ? sections.map((section) => ({
        ...section,
        groups: section.groups.map((group) => ({
          ...group,
          settings: group.settings.filter(
            (setting) => setting.id !== "logoUrl"
          ),
        })),
      }))
    : sections
  return visible
}

/**
 * Persist customizer adjustments into wp_options
 */
export async function saveCustomizerData(stylesheet: string, mods: ThemeMods, identity: {siteTitle:string;siteTagline:string}, activate = false, database: DB = db): Promise<void> {
  await verifyAdmin();
  const input = customizerSaveSchema.parse({stylesheet,mods,identity,activate});
  if (!hasTheme(input.stylesheet)) throw new Error("Invalid theme");
  const updates = [
    { optionName: `theme_mods_${input.stylesheet}`, optionValue: JSON.stringify(sanitizeMods(input.stylesheet, input.mods)), autoload:"yes" },
    { optionName:"blogname",optionValue:input.identity.siteTitle,autoload:"yes" },
    { optionName:"blogdescription",optionValue:input.identity.siteTagline,autoload:"yes" },
  ];
  if(input.activate){ const theme=getThemeModule(input.stylesheet).manifest;
    updates.push({optionName:"stylesheet",optionValue:theme.slug,autoload:"yes"},{optionName:"template",optionValue:theme.slug,autoload:"yes"},{optionName:"current_theme",optionValue:theme.name,autoload:"yes"});
  }
  await database.transaction(async tx=>{
    for(const update of updates) await tx.insert(wpOptions).values(update).onConflictDoUpdate({target:wpOptions.optionName,set:{optionValue:update.optionValue}});
  });
}

/** Favicon chosen in the active theme's customizer settings, if it is a usable URL. */
export async function getActiveFaviconUrl(): Promise<string | null> {
  try {
    const slug = await getActiveThemeSlug()
    const raw = await getOption(`theme_mods_${slug}`, "")
    const url = String(JSON.parse(raw || "{}").faviconUrl ?? "").trim()
    return safeMediaUrl(url)
  } catch {
    return null
  }
}
