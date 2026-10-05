import { getContrastColor, mixColors } from "./color";
import type { Mods } from "./types";

/** The design decisions of a palette. Everything else is derived so palettes stay complete and consistent. */
export interface PaletteTokens {
  dark?: boolean;
  primary: string;
  secondary: string;
  bg: string;
  surface: string;
  text: string;
  heading: string;
  muted: string;
  border: string;
  header: string;
  topbar: string;
  nav: string;
  footer: string;
  /** Accent readable on dark bars (nav hover, footer links). */
  accent: string;
  ticker?: string;
  overrides?: Partial<Mods>;
}

const LIGHT = "#ffffff";

/**
 * Expands design tokens into a value for every colour setting, so a palette never
 * inherits half-finished values from whatever was selected before.
 */
export function buildPalette(tokens: PaletteTokens): Mods {
  const { primary, secondary, bg, surface, text, heading, muted, border, header, topbar, nav, footer, accent } = tokens;
  const dark = Boolean(tokens.dark);
  const ink = dark ? bg : heading;
  const onBar = (background: string) => getContrastColor(background, "#f8fafc", ink);
  const navIsDark = onBar(nav) === "#f8fafc";
  const ticker = tokens.ticker ?? primary;

  const footerHeading = getContrastColor(footer, LIGHT, ink);
  const footerText = mixColors(footerHeading, footer, 0.72);

  return {
    darkMode: dark,
    primaryColor: primary,
    secondaryColor: secondary,
    backgroundColor: bg,
    surfaceColor: surface,
    textColor: text,
    headingColor: heading,
    mutedTextColor: muted,
    borderColor: border,

    headerBg: header,
    headerTextColor: getContrastColor(header, "#f8fafc", ink),
    headerBorderColor: border,
    topBarBg: topbar,
    topBarTextColor: onBar(topbar),
    topBarTickerBg: ticker,
    topBarTickerTextColor: getContrastColor(ticker, LIGHT, ink),
    navBarBg: nav,
    navLinkColor: onBar(nav),
    navLinkHoverColor: navIsDark ? accent : primary,

    linkColor: dark ? accent : primary,
    linkHoverColor: dark ? mixColors(accent, LIGHT, 0.7) : secondary,
    buttonBg: primary,
    buttonTextColor: getContrastColor(primary, LIGHT, ink),
    buttonHoverBg: secondary,
    inputBg: dark ? mixColors(surface, LIGHT, 0.92) : surface,
    inputBorderColor: mixColors(text, bg, 0.3),
    inputTextColor: text,

    widgetBg: surface,
    widgetTitleColor: heading,
    widgetTitleBg: "transparent",
    widgetTextColor: text,
    widgetLinkColor: dark ? accent : primary,
    widgetBorderColor: border,

    badgeBg: primary,
    badgeTextColor: getContrastColor(primary, LIGHT, ink),

    overlayTextColor: "#ffffff",
    overlayMutedColor: "#e2e8f0",
    overlayScrimColor: "#000000",

    successColor: dark ? "#34d399" : "#15803d",
    warningColor: dark ? "#fbbf24" : "#b45309",
    dangerColor: dark ? "#f87171" : "#dc2626",
    infoColor: dark ? "#60a5fa" : "#2563eb",

    footerBg: footer,
    footerHeadingColor: footerHeading,
    footerTextColor: footerText,
    footerLinkColor: footerHeading === LIGHT ? accent : primary,
    footerWidgetBg: "transparent",
    footerBorderColor: mixColors(footerHeading, footer, 0.18),
    subFooterBg: mixColors("#000000", footer, 0.3),
    subFooterTextColor: mixColors(footerHeading, footer, 0.55),

    ...tokens.overrides,
  };
}
