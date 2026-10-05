import type { ContentItem } from "@/lib/site-content";
import type { FrontEndThemeContext } from "@/lib/site-theme";
import { resolveMods } from "@/lib/customizer/resolve";

export function formatDate(value: Date | string | number, locale = "en") {
  try {
    const d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) return "";
    return new Intl.DateTimeFormat(locale || "en", {
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

export function localizePath(path: string, locale?: string, defaultLocale?: string): string {
  if (!path) return "/";
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("#") || path.startsWith("mailto:")) {
    return path;
  }
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  if (!locale || (defaultLocale && locale === defaultLocale)) {
    return cleanPath;
  }
  if (cleanPath === `/${locale}` || cleanPath.startsWith(`/${locale}/`)) {
    return cleanPath;
  }
  return cleanPath === "/" ? `/${locale}` : `/${locale}${cleanPath}`;
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
    item.excerpt ||
    item.content
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, maxChars)
  );
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
  primaryNav: [
    { id: "1", title: "Home", url: "/", order: 1 },
    { id: "2", title: "Business", url: "/category/business", order: 2 },
    { id: "3", title: "Technology", url: "/category/technology", order: 3 },
    { id: "4", title: "Markets", url: "/category/markets", order: 4 },
    { id: "5", title: "Opinion", url: "/category/opinion", order: 5 },
    { id: "6", title: "About", url: "/about", order: 6 },
  ],
  footerNav: [
    { id: "f1", title: "About", url: "/about", order: 1 },
    { id: "f2", title: "Contact", url: "/contact", order: 2 },
    { id: "f3", title: "Editorial Standards", url: "/editorial-standards", order: 3 },
    { id: "f4", title: "Privacy Policy", url: "/privacy", order: 4 },
  ],
};
