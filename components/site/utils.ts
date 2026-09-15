import type { ContentItem } from "@/lib/site-content";
import type { FrontEndThemeContext } from "@/lib/site-theme";

export function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(value);
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

export const DEFAULT_THEME: FrontEndThemeContext = {
  themeSlug: "ledger-classic",
  siteTitle: "Signal News",
  siteTagline: "The Independent News Journal",
  primaryColor: "#2271b1",
  headerLayout: "classic",
  headingFont: "serif",
  darkMode: false,
  footerCopyright: "© 2026 Signal News. All rights reserved.",
  mods: {},
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
