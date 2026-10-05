import type { MenuItem } from "@/lib/menus/types";
import type { CustomizerSection, HeaderLayout, Palette, SingleLayout } from "@/lib/customizer/types";

/** Public theme metadata, mirrors `themes/<slug>/theme.json`. */
export type ThemeManifest = {
  slug: string;
  name: string;
  description: string;
  version: string;
  author: string;
  authorUrl?: string;
  themeUrl?: string;
  screenshot?: string;
  tags?: string;
  /** Previously stored `stylesheet` option values that map to this theme. */
  legacySlugs?: string[];
};

export type Theme = ThemeManifest & {
  isActive?: boolean;
};

/** Per-theme capabilities, used instead of sniffing the theme slug. */
export type ThemeSupports = {
  headerLayouts?: HeaderLayout[];
  singleLayouts?: SingleLayout[];
  /** Visual treatment of homepage section headings. */
  sectionStyle?: "classic" | "magazine" | "terminal" | "minimal";
};

export type ThemeModule = {
  manifest: ThemeManifest;
  /** Only the settings that differ from the core defaults. */
  defaults: Partial<ThemeMods>;
  /** Full palettes for the theme; core palettes are used when omitted. */
  palettes?: Palette[];
  supports?: ThemeSupports;
  /** Theme specific customizer sections, merged after the core ones. */
  sections?: CustomizerSection[];
  /** Core setting ids this theme does not support, hidden from the UI. */
  hiddenSettings?: string[];
};

export type ThemeMods = {
  // Brand & Identity
  logoUrl?: string;
  logoWidth?: number; // e.g. 180 (px)
  showSiteTitle?: boolean;
  showTagline?: boolean;
  faviconUrl?: string;
  socialFacebook?: string;
  socialX?: string;
  socialInstagram?: string;
  socialYoutube?: string;
  socialLinkedin?: string;

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
  headerBorderColor?: string;
  topBarBg?: string;
  topBarTextColor?: string;
  topBarTickerBg?: string;
  topBarTickerTextColor?: string;
  navBarBg?: string;
  navLinkColor?: string;
  navLinkHoverColor?: string;

  // Sidebar & Widget Colors
  widgetBg?: string;
  widgetTitleColor?: string;
  widgetTitleBg?: string;
  widgetTextColor?: string;
  widgetLinkColor?: string;
  widgetBorderColor?: string;

  // Badges & Tag Colors
  badgeBg?: string;
  badgeTextColor?: string;

  // Links, Buttons & Forms
  linkColor?: string;
  linkHoverColor?: string;
  buttonBg?: string;
  buttonTextColor?: string;
  buttonHoverBg?: string;
  inputBg?: string;
  inputBorderColor?: string;
  inputTextColor?: string;

  // Text on photo overlays (cards with an image background)
  overlayTextColor?: string;
  overlayMutedColor?: string;
  overlayScrimColor?: string;

  // Status colours used by widgets and plugins
  successColor?: string;
  warningColor?: string;
  dangerColor?: string;
  infoColor?: string;

  // Footer Colors
  footerBg?: string;
  footerTextColor?: string;
  footerHeadingColor?: string;
  footerLinkColor?: string;
  footerBorderColor?: string;
  footerWidgetBg?: string;
  subFooterBg?: string;
  subFooterTextColor?: string;

  // Typography Engine
  headingFontFamily?: "playfair" | "merriweather" | "inter" | "roboto" | "oswald" | "montserrat" | "georgia";
  bodyFontFamily?: "inter" | "roboto" | "source_serif" | "lora" | "open_sans";
  baseFontSize?: number; // root size in px, everything rem based scales with it
  headingScale?: number; // percent
  arabicHeadingFontFamily?: string;
  arabicBodyFontFamily?: string;
  siteTitleFontFamily?: string; // font id, or "heading" / "body"
  siteTitleScale?: number; // percent
  widgetTitleFontFamily?: string;
  widgetTitleSize?: number; // rem
  widgetTitleWeight?: string;
  widgetTitleTransform?: string;
  navFontFamily?: string;
  navFontSize?: number; // rem
  headingFontWeight?: "400" | "600" | "700" | "800" | "900";
  headingTransform?: "none" | "uppercase" | "capitalize";
  /** @deprecated Derived from `headingFontFamily`; only read from old stored data. */
  headingFont?: "serif" | "sans";

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
  singleLayout?: "sidebar-right" | "sidebar-left" | "full-container" | "centered";
  singleShowFeaturedImage?: boolean;
  singleShowAuthorAvatar?: boolean;
  singleShowDate?: boolean;
  singleShowReadingTime?: boolean;
  singleShowShareButtons?: boolean;
  singleContentWidth?: "narrow" | "standard" | "wide"; // narrow (720px), standard (860px), wide (full container)

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

export type CustomizerPayload = {
  themeSlug: string;
  themeName: string;
  activeThemeSlug: string;
  activeThemeName: string;
  siteTitle: string;
  siteTagline: string;
  /** Fully resolved mods: core defaults, theme defaults and stored values merged. */
  mods: ThemeMods;
  allThemes: Theme[];
  primaryNav: MenuItem[];
  footerNav?: MenuItem[];
};


