export type Theme = {
  slug: string;
  name: string;
  description: string;
  version: string;
  author: string;
  authorUrl?: string;
  themeUrl?: string;
  screenshot?: string;
  tags?: string;
  isActive?: boolean;
};

export type ThemeMods = {
  // Brand & Identity
  logoUrl?: string;
  logoWidth?: number; // e.g. 180 (px)
  showSiteTitle?: boolean;
  showTagline?: boolean;
  faviconUrl?: string;

  // Complete Color Palette
  primaryColor?: string; // Brand accent
  secondaryColor?: string; // Secondary accent / highlight
  backgroundColor?: string; // Canvas background
  surfaceColor?: string; // Card / container background
  textColor?: string; // Main body text
  headingColor?: string; // Headlines / title text
  mutedTextColor?: string; // Meta, dates, excerpts
  borderColor?: string; // Dividers, borders, rules

  // Header & Masthead Colors
  headerBg?: string;
  headerTextColor?: string;
  topBarBg?: string;
  topBarTextColor?: string;
  navBarBg?: string;
  navLinkColor?: string;
  navLinkHoverColor?: string;

  // Footer Colors
  footerBg?: string;
  footerTextColor?: string;
  footerHeadingColor?: string;
  footerLinkColor?: string;

  // Typography Engine
  headingFontFamily?: "playfair" | "merriweather" | "inter" | "roboto" | "oswald" | "montserrat" | "georgia";
  bodyFontFamily?: "inter" | "roboto" | "source_serif" | "lora" | "open_sans";
  baseFontSize?: number; // 14, 15, 16, 17, 18 (px)
  headingFontWeight?: "400" | "600" | "700" | "800" | "900";
  headingTransform?: "none" | "uppercase" | "capitalize";
  headingFont?: "serif" | "sans"; // backward compatibility

  // Header Layout & Components
  headerLayout?: "classic" | "minimal" | "magazine" | "centered";
  stickyHeader?: boolean;
  showTopBar?: boolean;
  topBarTickerText?: string;
  showDateInHeader?: boolean;
  showSearchInNav?: boolean;
  showSocialIconsInHeader?: boolean;
  headerBorderStyle?: "solid" | "double" | "none";

  // Navigation Bar Styling
  navAlignment?: "left" | "center" | "right" | "between";
  navStyle?: "classic-text" | "pill-badge" | "underlined";
  navUppercase?: boolean;

  // Layout & Container Geometry
  containerWidth?: "1140" | "1280" | "1440";
  borderRadius?: "0" | "4" | "8" | "16"; // px (0 = sharp broadsheet, 8 = modern card)
  cardStyle?: "flat-bordered" | "lifted-shadow" | "clean-minimal";

  // Article / Single Post Display Options
  singleShowFeaturedImage?: boolean;
  singleShowAuthorAvatar?: boolean;
  singleShowDate?: boolean;
  singleShowReadingTime?: boolean;
  singleShowShareButtons?: boolean;
  singleContentWidth?: "narrow" | "standard" | "wide"; // 680px vs 760px vs 880px

  // Footer Options
  footerColumns?: 1 | 2 | 3 | 4;
  footerCopyright?: string;
  showBackToTop?: boolean;
  showFooterSocials?: boolean;

  // Custom CSS
  customCss?: string;

  // Dark Mode Overrides
  darkMode?: boolean;
};

import { MenuItem } from "@/lib/menus/types";

export type CustomizerPayload = {
  themeSlug: string;
  themeName: string;
  activeThemeSlug: string;
  activeThemeName: string;
  siteTitle: string;
  siteTagline: string;
  mods: ThemeMods;
  allThemes: Theme[];
  primaryNav: MenuItem[];
  footerNav?: MenuItem[];
};

export const DEFAULT_MODS: Record<string, ThemeMods> = {
  "pressforge-broadsheet": {
    showSiteTitle: true,
    showTagline: true,
    logoWidth: 180,
    primaryColor: "#2271b1",
    secondaryColor: "#135e96",
    backgroundColor: "#f8f7f4",
    surfaceColor: "#ffffff",
    textColor: "#1d2327",
    headingColor: "#0f172a",
    mutedTextColor: "#64748b",
    borderColor: "#e2e8f0",
    headerBg: "#ffffff",
    headerTextColor: "#0f172a",
    topBarBg: "#0f172a",
    topBarTextColor: "#f8fafc",
    navBarBg: "#ffffff",
    navLinkColor: "#1d2327",
    navLinkHoverColor: "#2271b1",
    footerBg: "#0f172a",
    footerTextColor: "#94a3b8",
    footerHeadingColor: "#ffffff",
    footerLinkColor: "#cbd5e1",
    headingFontFamily: "playfair",
    bodyFontFamily: "inter",
    baseFontSize: 16,
    headingFontWeight: "700",
    headingTransform: "none",
    headingFont: "serif",
    headerLayout: "classic",
    stickyHeader: true,
    showTopBar: true,
    topBarTickerText: "MARKETS CLOSE UP: TECH & COMMODITIES LEAD BULLISH RALLY",
    showDateInHeader: true,
    showSearchInNav: true,
    showSocialIconsInHeader: true,
    headerBorderStyle: "double",
    navAlignment: "left",
    navStyle: "classic-text",
    navUppercase: false,
    containerWidth: "1280",
    borderRadius: "4",
    cardStyle: "flat-bordered",
    singleShowFeaturedImage: true,
    singleShowAuthorAvatar: true,
    singleShowDate: true,
    singleShowReadingTime: true,
    singleShowShareButtons: true,
    singleContentWidth: "standard",
    footerColumns: 4,
    footerCopyright: "© 2026 Signal News Digital Edition. All rights reserved.",
    showBackToTop: true,
    showFooterSocials: true,
    darkMode: false,
  },
  "pressforge-longform": {
    showSiteTitle: true,
    showTagline: true,
    logoWidth: 160,
    primaryColor: "#292524",
    secondaryColor: "#44403c",
    backgroundColor: "#fbf9f5",
    surfaceColor: "#ffffff",
    textColor: "#292524",
    headingColor: "#1c1917",
    mutedTextColor: "#78716c",
    borderColor: "#e7e5e4",
    headerBg: "#fbf9f5",
    headerTextColor: "#1c1917",
    topBarBg: "#292524",
    topBarTextColor: "#f5f5f4",
    navBarBg: "#fbf9f5",
    navLinkColor: "#292524",
    navLinkHoverColor: "#0c0a09",
    footerBg: "#1c1917",
    footerTextColor: "#a8a29e",
    footerHeadingColor: "#fafaf9",
    footerLinkColor: "#d6d3d1",
    headingFontFamily: "merriweather",
    bodyFontFamily: "source_serif",
    baseFontSize: 17,
    headingFontWeight: "700",
    headingTransform: "none",
    headingFont: "serif",
    headerLayout: "minimal",
    stickyHeader: false,
    showTopBar: false,
    showDateInHeader: true,
    showSearchInNav: true,
    showSocialIconsInHeader: false,
    headerBorderStyle: "solid",
    navAlignment: "center",
    navStyle: "underlined",
    navUppercase: false,
    containerWidth: "1140",
    borderRadius: "0",
    cardStyle: "clean-minimal",
    singleShowFeaturedImage: true,
    singleShowAuthorAvatar: true,
    singleShowDate: true,
    singleShowReadingTime: true,
    singleShowShareButtons: false,
    singleContentWidth: "narrow",
    footerColumns: 3,
    footerCopyright: "© 2026 PressForge Longform. Dedicated to investigative storytelling.",
    showBackToTop: true,
    showFooterSocials: false,
    darkMode: false,
  },
  "pressforge-midnight": {
    showSiteTitle: true,
    showTagline: true,
    logoWidth: 170,
    primaryColor: "#10b981",
    secondaryColor: "#059669",
    backgroundColor: "#0a0f1d",
    surfaceColor: "#111827",
    textColor: "#e2e8f0",
    headingColor: "#f8fafc",
    mutedTextColor: "#94a3b8",
    borderColor: "#1f2937",
    headerBg: "#0a0f1d",
    headerTextColor: "#f8fafc",
    topBarBg: "#030712",
    topBarTextColor: "#34d399",
    navBarBg: "#0f172a",
    navLinkColor: "#e2e8f0",
    navLinkHoverColor: "#10b981",
    footerBg: "#030712",
    footerTextColor: "#64748b",
    footerHeadingColor: "#f8fafc",
    footerLinkColor: "#10b981",
    headingFontFamily: "oswald",
    bodyFontFamily: "inter",
    baseFontSize: 15,
    headingFontWeight: "700",
    headingTransform: "uppercase",
    headingFont: "sans",
    singleShowShareButtons: true,
    singleContentWidth: "wide",
    footerColumns: 4,
    footerCopyright: "© 2026 PressForge Midnight. High-velocity terminal intelligence.",
    showBackToTop: true,
    showFooterSocials: true,
    darkMode: true,
  },
  "pressforge-magazine": {
    showSiteTitle: true,
    showTagline: true,
    logoWidth: 200,
    primaryColor: "#e11d48",
    secondaryColor: "#be123c",
    backgroundColor: "#f8fafc",
    surfaceColor: "#ffffff",
    textColor: "#0f172a",
    headingColor: "#020617",
    mutedTextColor: "#475569",
    borderColor: "#e2e8f0",
    headerBg: "#ffffff",
    headerTextColor: "#020617",
    topBarBg: "#e11d48",
    topBarTextColor: "#ffffff",
    navBarBg: "#0f172a",
    navLinkColor: "#f8fafc",
    navLinkHoverColor: "#f43f5e",
    footerBg: "#020617",
    footerTextColor: "#94a3b8",
    footerHeadingColor: "#ffffff",
    footerLinkColor: "#f43f5e",
    headingFontFamily: "montserrat",
    bodyFontFamily: "roboto",
    baseFontSize: 16,
    headingFontWeight: "900",
    headingTransform: "none",
    headingFont: "sans",
    headerLayout: "magazine",
    stickyHeader: true,
    showTopBar: true,
    topBarTickerText: "BREAKING: SPECIAL INVESTIGATION INTO AI SILICON MANUFACTURING BREAKTHROUGHS",
    showDateInHeader: true,
    showSearchInNav: true,
    showSocialIconsInHeader: true,
    headerBorderStyle: "none",
    navAlignment: "between",
    navStyle: "pill-badge",
    navUppercase: true,
    containerWidth: "1280",
    borderRadius: "8",
    cardStyle: "lifted-shadow",
    singleShowFeaturedImage: true,
    singleShowAuthorAvatar: true,
    singleShowDate: true,
    singleShowReadingTime: true,
    singleShowShareButtons: true,
    singleContentWidth: "standard",
    footerColumns: 4,
    footerCopyright: "© 2026 PressForge Magazine. High-impact digital publishing.",
    showBackToTop: true,
    showFooterSocials: true,
    darkMode: false,
  },
};

// Aliases for legacy stored option keys
DEFAULT_MODS["ledger-classic"] = DEFAULT_MODS["pressforge-broadsheet"];
DEFAULT_MODS["ledger-magazine"] = DEFAULT_MODS["pressforge-magazine"];
DEFAULT_MODS["ledger-dark"] = DEFAULT_MODS["pressforge-midnight"];
DEFAULT_MODS["ledger-reader"] = DEFAULT_MODS["pressforge-longform"];

