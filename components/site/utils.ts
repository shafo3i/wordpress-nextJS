import type { ContentItem } from "@/lib/site-content";
import type { FrontEndThemeContext } from "@/lib/site-theme";
import { resolveMods } from "@/lib/customizer/resolve";

export function formatDate(value: Date | string | number, locale = "en", timeZone?: string) {
  try {
    const d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) return "";
    return new Intl.DateTimeFormat(locale || "en", {
      ...(timeZone ? { timeZone } : {}),
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(d);
  } catch {
    return "";
  }
}

export function t(key: string, theme?: FrontEndThemeContext, fallback?: string): string {
  if (theme?.dict && theme.dict[key]) {
    return theme.dict[key];
  }
  return fallback !== undefined ? fallback : key;
}

export function localizePath(path: string, locale?: string, defaultLocale?: string, supportedLocales: readonly string[] = []): string {
  if (!path) return "/";
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(path)) {
    return path;
  }
  if (!locale) return path.startsWith("/") ? path : `/${path}`;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const suffixIndex = normalized.search(/[?#]/);
  let pathname = suffixIndex < 0 ? normalized : normalized.slice(0, suffixIndex);
  const suffix = suffixIndex < 0 ? "" : normalized.slice(suffixIndex);
  const firstSegment = pathname.split("/")[1];
  if ([locale, defaultLocale, ...supportedLocales].includes(firstSegment)) {
    pathname = pathname.slice(firstSegment.length + 1) || "/";
  }
  const cleanPath = pathname + suffix;
  if (locale === defaultLocale) {
    return cleanPath;
  }
  return (pathname === "/" ? `/${locale}` : `/${locale}${pathname}`) + suffix;
}

export function getPostUrl(slug: string, theme?: FrontEndThemeContext): string {
  const locale = theme?.locale;
  const defaultLocale = theme?.defaultLocale;
  const isDefault = !locale || (defaultLocale ? locale === defaultLocale : false);
  return isDefault ? `/posts/${slug}` : `/${locale}/posts/${slug}`;
}

export function getCategoryUrl(slug: string, theme?: FrontEndThemeContext): string {
  const locale = theme?.locale;
  const defaultLocale = theme?.defaultLocale;
  const isDefault = !locale || (defaultLocale ? locale === defaultLocale : false);
  return isDefault ? `/category/${slug}` : `/${locale}/category/${slug}`;
}

export function getExcerpt(item: ContentItem, maxChars = 140) {
  return (
    item.excerpt ??
    item.content
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  ).slice(0, Math.max(0, maxChars));
}

export function isSerifHeading(theme?: FrontEndThemeContext): boolean {
  return theme ? theme.headingFont === "serif" : true;
}

export function isDarkTheme(theme?: FrontEndThemeContext): boolean {
  return Boolean(theme?.darkMode);
}

export const DEFAULT_THEME: FrontEndThemeContext = {
  themeSlug: "pressforge-broadsheet",
  siteTitle: "PressForge News",
  siteTagline: "Open-Source Editorial Engine & Newsroom",
  primaryColor: "#2271b1",
  headerLayout: "classic",
  headingFont: "serif",
  sectionStyle: "classic",
  activePlugins: [],
  darkMode: false,
  footerCopyright: "© 2026 PressForge. Open Source Editorial Engine.",
  mods: resolveMods("pressforge-broadsheet"),
  primaryNav: [],
  footerNav: [],
};

