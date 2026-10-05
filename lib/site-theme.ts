import { getActiveThemeSlug } from "@/lib/themes/loader";
import { getCustomizerData } from "@/lib/themes/customizer";
import { getMenuWithItems, getNavMenuLocations } from "@/lib/menus/db";
import { MenuItem } from "@/lib/menus/types";

import { ThemeMods } from "@/lib/themes/types";
import { getFontKind } from "@/lib/customizer/fonts";
import { resolveColor } from "@/lib/customizer/resolve";
import { getThemeModule } from "@/themes/registry";
import { getActivePluginSlugs } from "@/lib/plugins/loader";
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
  isDefault: boolean;
};

export type FrontEndThemeContext = {
  themeSlug: string;
  siteTitle: string;
  siteTagline: string;
  primaryColor: string;
  headerLayout: "classic" | "minimal" | "magazine" | "centered";
  headingFont: "serif" | "sans";
  sectionStyle: "classic" | "magazine" | "terminal" | "minimal";
  /** Slugs of active plugins, used to gate plugin owned UI such as the breaking ticker. */
  activePlugins: string[];
  darkMode: boolean;
  footerCopyright: string;
  primaryNav: MenuItem[];
  footerNav: MenuItem[];
  mods: ThemeMods;
  locale?: string;
  defaultLocale?: string;
  isDefaultLocale?: boolean;
  direction?: "ltr" | "rtl";
  languages?: LanguageLink[];
  dict?: Record<string, string>;
};

import { localizePath } from "@/components/site/utils";
export { localizePath };

export async function getFrontEndThemeContext(options?: {
  locale?: string;
  postTranslations?: LinkedPostTranslation[];
  currentPath?: string;
}): Promise<FrontEndThemeContext> {
  const [themeSlug, customizer, locations, activeLanguages, defaultLang, activePlugins] = await Promise.all([
    getActiveThemeSlug(),
    getCustomizerData(),
    getNavMenuLocations(),
    getActiveLanguages().catch(() => []),
    getDefaultLanguage().catch(() => null),
    getActivePluginSlugs(),
  ]);

  const defaultLocale = defaultLang?.code || "en";
  const activeLocale = options?.locale || defaultLocale;
  const currentLangObj = activeLanguages.find((l) => l.code === activeLocale) || defaultLang;
  const direction = (currentLangObj?.direction as "ltr" | "rtl") || "ltr";

  // Build clean language links for the switcher without query parameters
  const languages: LanguageLink[] = activeLanguages.map((l) => {
    const isThisDefault = l.isDefault || l.code === defaultLocale;
    let rawPath = options?.currentPath || "/";
    for (const al of activeLanguages) {
      if (rawPath === `/${al.code}` || rawPath.startsWith(`/${al.code}/`)) {
        rawPath = rawPath.replace(new RegExp(`^/${al.code}`), "") || "/";
        break;
      }
    }

    let url = isThisDefault ? rawPath : (rawPath === "/" ? `/${l.code}` : `/${l.code}${rawPath}`);

    if (options?.postTranslations && options.postTranslations.length > 0) {
      const match = options.postTranslations.find((t) => t.languageCode === l.code);
      if (match) {
        url = isThisDefault ? `/posts/${match.slug}` : `/${l.code}/posts/${match.slug}`;
      }
    }

    return {
      code: l.code,
      name: l.name,
      nativeName: l.nativeName || l.name,
      url,
      isActive: l.code === activeLocale,
      direction: (l.direction as "ltr" | "rtl") || "ltr",
      isDefault: isThisDefault,
    };
  });

  const dict = await getTranslations(activeLocale).catch(() => ({}));

  let primaryNav: MenuItem[] = [];
  let footerNav: MenuItem[] = [];

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
      primaryNav = pMenu.items.map((item) => ({
        ...item,
        url: localizePath(item.url, activeLocale, defaultLocale),
      }));
    }
  }

  if (footerMenuId) {
    const fMenu = await getMenuWithItems(footerMenuId);
    if (fMenu && fMenu.items.length > 0) {
      footerNav = fMenu.items.map((item) => ({
        ...item,
        url: localizePath(item.url, activeLocale, defaultLocale),
      }));
    }
  }

  const mods = customizer.mods;

  // Mods are fully resolved (core -> theme -> stored), so no slug sniffing is needed.
  const supports = getThemeModule(themeSlug).supports;

  return {
    themeSlug,
    siteTitle: customizer.siteTitle || "PressForge News",
    siteTagline: customizer.siteTagline || "Open-Source Editorial Engine & Newsroom",
    primaryColor: resolveColor(mods, "primaryColor"),
    headerLayout: mods.headerLayout ?? "classic",
    headingFont: getFontKind(mods.headingFontFamily),
    sectionStyle: supports?.sectionStyle ?? "minimal",
    activePlugins,
    darkMode: Boolean(mods.darkMode),
    footerCopyright: mods.footerCopyright || "© 2026 PressForge. All rights reserved.",
    primaryNav,
    footerNav,
    mods,
    locale: activeLocale,
    defaultLocale,
    isDefaultLocale: activeLocale === defaultLocale,
    direction,
    languages,
    dict,
  };
}
