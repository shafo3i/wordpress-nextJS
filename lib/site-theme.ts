import { getActiveThemeSlug } from "@/lib/themes/loader";
import { getCustomizerData } from "@/lib/themes/customizer";
import { getMenuWithItems, getNavMenuLocations } from "@/lib/menus/db";
import { MenuItem } from "@/lib/menus/types";

import { ThemeMods } from "@/lib/themes/types";
import {
  getActiveLanguages,
  getDefaultLanguage,
  getTranslations,
  type LinkedPostTranslation,
} from "@/services/language.service";

export type LanguageLink = {
  code: string;
  name: string;
  nativeName: string;
  url: string;
  isActive: boolean;
  direction: string;
};

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
  locale?: string;
  direction?: "ltr" | "rtl";
  languages?: LanguageLink[];
  dict?: Record<string, string>;
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

export async function getFrontEndThemeContext(options?: {
  locale?: string;
  postTranslations?: LinkedPostTranslation[];
  currentPath?: string;
}): Promise<FrontEndThemeContext> {
  const [themeSlug, customizer, locations, activeLanguages, defaultLang] = await Promise.all([
    getActiveThemeSlug(),
    getCustomizerData(),
    getNavMenuLocations(),
    getActiveLanguages().catch(() => []),
    getDefaultLanguage().catch(() => null),
  ]);

  const defaultLocale = defaultLang?.code || "en";
  const activeLocale = options?.locale || defaultLocale;
  const currentLangObj = activeLanguages.find((l) => l.code === activeLocale) || defaultLang;
  const direction = (currentLangObj?.direction as "ltr" | "rtl") || "ltr";

  // Build language links for the switcher
  const languages: LanguageLink[] = activeLanguages.map((l) => {
    let url = "/";
    const isThisDefault = l.isDefault || l.code === defaultLocale;

    if (options?.postTranslations && options.postTranslations.length > 0) {
      const match = options.postTranslations.find((t) => t.languageCode === l.code);
      if (match) {
        url = isThisDefault ? `/posts/${match.slug}` : `/${l.code}/posts/${match.slug}`;
      } else {
        url = isThisDefault ? "/" : `/${l.code}`;
      }
    } else {
      url = isThisDefault ? "/" : `/${l.code}`;
    }

    return {
      code: l.code,
      name: l.name,
      nativeName: l.nativeName || l.name,
      url,
      isActive: l.code === activeLocale,
      direction: (l.direction as "ltr" | "rtl") || "ltr",
    };
  });

  const dict = await getTranslations(activeLocale).catch(() => ({}));

  let primaryNav = DEFAULT_PRIMARY_NAV;
  let footerNav = DEFAULT_FOOTER_NAV;

  const primaryMenuId =
    locations[`primary_${activeLocale}`] ||
    (activeLocale === defaultLocale ? locations.primary : undefined) ||
    locations.primary;

  const footerMenuId =
    locations[`footer_${activeLocale}`] ||
    (activeLocale === defaultLocale ? locations.footer : undefined) ||
    locations.footer;

  if (primaryMenuId) {
    const pMenu = await getMenuWithItems(primaryMenuId);
    if (pMenu && pMenu.items.length > 0) {
      primaryNav = pMenu.items;
    }
  }

  if (footerMenuId) {
    const fMenu = await getMenuWithItems(footerMenuId);
    if (fMenu && fMenu.items.length > 0) {
      footerNav = fMenu.items;
    }
  }

  const mods = customizer.mods;

  // Let mods take precedence over theme defaults
  const isDark = mods.darkMode !== undefined
    ? Boolean(mods.darkMode)
    : themeSlug.includes("dark") || themeSlug.includes("midnight");

  const isSerifTheme = themeSlug.includes("reader") || themeSlug.includes("longform") || themeSlug.includes("classic") || themeSlug.includes("broadsheet");
  const font = mods.headingFont || (isSerifTheme ? "serif" : "sans");

  const layout = mods.headerLayout || (themeSlug.includes("magazine") ? "magazine" : (themeSlug.includes("reader") || themeSlug.includes("longform")) ? "minimal" : "classic");

  return {
    themeSlug,
    siteTitle: customizer.siteTitle || "PressForge News",
    siteTagline: customizer.siteTagline || "Open-Source Editorial Engine & Newsroom",
    primaryColor: mods.primaryColor || (isDark ? "#10b981" : "#2271b1"),
    headerLayout: layout,
    headingFont: font,
    darkMode: isDark,
    footerCopyright: mods.footerCopyright || "© 2026 PressForge. All rights reserved.",
    primaryNav,
    footerNav,
    mods,
    locale: activeLocale,
    direction,
    languages,
    dict,
  };
}
