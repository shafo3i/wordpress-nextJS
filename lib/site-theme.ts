import { getActiveThemeSlug } from "@/lib/themes/loader";
import { getCustomizerData } from "@/lib/themes/customizer";
import { getMenuWithItems, getNavMenuLocations } from "@/lib/menus/db";
import { MenuItem } from "@/lib/menus/types";

import { ThemeMods } from "@/lib/themes/types";

export type FrontEndThemeContext = {
  themeSlug: string;
  siteTitle: string;
  siteTagline: string;
  primaryColor: string;
  headerLayout: "classic" | "minimal" | "magazine" | "centered";
  headingFont: "serif" | "sans";
  darkMode: boolean;
  footerCopyright: string;
  primaryNav: MenuItem[];
  footerNav: MenuItem[];
  mods: ThemeMods;
};

const DEFAULT_PRIMARY_NAV: MenuItem[] = [
  { id: "def-1", title: "Home", url: "/", order: 1 },
  { id: "def-2", title: "News", url: "/category/news", order: 2 },
  { id: "def-3", title: "Business", url: "/category/business", order: 3 },
  { id: "def-4", title: "Technology", url: "/category/technology", order: 4 },
  { id: "def-5", title: "Opinion", url: "/category/opinion", order: 5 },
  { id: "def-6", title: "About", url: "/about", order: 6 },
];

const DEFAULT_FOOTER_NAV: MenuItem[] = [
  { id: "f-1", title: "About", url: "/about", order: 1 },
  { id: "f-2", title: "Contact", url: "/contact", order: 2 },
  { id: "f-3", title: "Editorial Standards", url: "/editorial-standards", order: 3 },
  { id: "f-4", title: "Privacy Policy", url: "/privacy", order: 4 },
];

export async function getFrontEndThemeContext(): Promise<FrontEndThemeContext> {
  const [themeSlug, customizer, locations] = await Promise.all([
    getActiveThemeSlug(),
    getCustomizerData(),
    getNavMenuLocations(),
  ]);

  let primaryNav = DEFAULT_PRIMARY_NAV;
  let footerNav = DEFAULT_FOOTER_NAV;

  if (locations.primary) {
    const pMenu = await getMenuWithItems(locations.primary);
    if (pMenu && pMenu.items.length > 0) {
      primaryNav = pMenu.items;
    }
  }

  if (locations.footer) {
    const fMenu = await getMenuWithItems(locations.footer);
    if (fMenu && fMenu.items.length > 0) {
      footerNav = fMenu.items;
    }
  }

  const mods = customizer.mods;

  // Let mods take precedence over theme defaults
  const isDark = mods.darkMode !== undefined 
    ? Boolean(mods.darkMode) 
    : themeSlug === "ledger-dark";

  const font = mods.headingFont || (themeSlug === "ledger-reader" || themeSlug === "ledger-classic" ? "serif" : "sans");

  const layout = mods.headerLayout || (themeSlug === "ledger-magazine" ? "magazine" : themeSlug === "ledger-reader" ? "minimal" : "classic");

  return {
    themeSlug,
    siteTitle: customizer.siteTitle || "Signal News",
    siteTagline: customizer.siteTagline || "The Independent News Journal",
    primaryColor: mods.primaryColor || (themeSlug === "ledger-dark" ? "#10b981" : "#2271b1"),
    headerLayout: layout,
    headingFont: font,
    darkMode: isDark,
    footerCopyright: mods.footerCopyright || "© 2026 Signal News. All rights reserved.",
    primaryNav,
    footerNav,
    mods,
  };
}
