import type { ThemeMods } from "@/lib/themes/types";

export function getFontFamilyCss(family?: string, fallback: "serif" | "sans" = "serif"): string {
  switch (family) {
    case "playfair":
      return "'Playfair Display', Georgia, serif";
    case "merriweather":
      return "'Merriweather', Georgia, serif";
    case "georgia":
      return "Georgia, Cambria, 'Times New Roman', Times, serif";
    case "oswald":
      return "'Oswald', sans-serif";
    case "montserrat":
      return "'Montserrat', -apple-system, sans-serif";
    case "inter":
      return "'Inter', -apple-system, sans-serif";
    case "roboto":
      return "'Roboto', -apple-system, sans-serif";
    case "source_serif":
      return "'Source Serif 4', Georgia, serif";
    case "lora":
      return "'Lora', Georgia, serif";
    case "open_sans":
      return "'Open Sans', -apple-system, sans-serif";
    default:
      return fallback === "serif" ? "Georgia, serif" : "-apple-system, sans-serif";
  }
}

export function ThemeDynamicStyles({ mods }: { mods: ThemeMods }) {
  const primary = mods.primaryColor || "#2271b1";
  const secondary = mods.secondaryColor || "#135e96";
  const bg = mods.backgroundColor || (mods.darkMode ? "#0a0f1d" : "#f8f7f4");
  const surface = mods.surfaceColor || (mods.darkMode ? "#111827" : "#ffffff");
  const text = mods.textColor || (mods.darkMode ? "#e2e8f0" : "#1d2327");
  const heading = mods.headingColor || (mods.darkMode ? "#f8fafc" : "#0f172a");
  const muted = mods.mutedTextColor || (mods.darkMode ? "#94a3b8" : "#64748b");
  const border = mods.borderColor || (mods.darkMode ? "#1f2937" : "#e2e8f0");
  const radius = mods.borderRadius ? `${mods.borderRadius}px` : "4px";
  const maxWidth = mods.containerWidth ? `${mods.containerWidth}px` : "1280px";
  const fontSize = mods.baseFontSize ? `${mods.baseFontSize}px` : "16px";

  const headingFont = getFontFamilyCss(
    mods.headingFontFamily,
    mods.headingFont === "sans" ? "sans" : "serif"
  );
  const bodyFont = getFontFamilyCss(mods.bodyFontFamily, "sans");

  const css = `
    :root {
      --theme-primary: ${primary};
      --theme-secondary: ${secondary};
      --theme-bg: ${bg};
      --theme-surface: ${surface};
      --theme-text: ${text};
      --theme-heading: ${heading};
      --theme-muted: ${muted};
      --theme-border: ${border};
      --theme-radius: ${radius};
      --theme-container-width: ${maxWidth};
      --theme-base-font-size: ${fontSize};
      --font-theme-heading: ${headingFont};
      --font-theme-body: ${bodyFont};

      /* Header & Navigation Variables */
      --theme-header-bg: ${mods.headerBg || surface};
      --theme-header-text: ${mods.headerTextColor || heading};
      --theme-header-border: ${mods.headerBorderColor || border};
      --theme-topbar-bg: ${mods.topBarBg || (mods.darkMode ? '#030712' : '#0f172a')};
      --theme-topbar-text: ${mods.topBarTextColor || '#f8fafc'};
      --theme-topbar-ticker-bg: ${mods.topBarTickerBg || primary};
      --theme-topbar-ticker-text: ${mods.topBarTickerTextColor || '#ffffff'};
      --theme-nav-bg: ${mods.navBarBg || surface};
      --theme-nav-link: ${mods.navLinkColor || heading};
      --theme-nav-link-hover: ${mods.navLinkHoverColor || primary};
      --theme-nav-dropdown-bg: ${mods.navDropdownBg || surface};
      --theme-nav-dropdown-link: ${mods.navDropdownLinkColor || text};

      /* Sidebar & Widget Variables */
      --theme-widget-bg: ${mods.widgetBg || surface};
      --theme-widget-title-color: ${mods.widgetTitleColor || heading};
      --theme-widget-title-bg: ${mods.widgetTitleBg || 'transparent'};
      --theme-widget-text: ${mods.widgetTextColor || text};
      --theme-widget-link: ${mods.widgetLinkColor || primary};
      --theme-widget-border: ${mods.widgetBorderColor || border};

      /* Badge & Tag Variables */
      --theme-badge-bg: ${mods.badgeBg || primary};
      --theme-badge-text: ${mods.badgeTextColor || '#ffffff'};

      /* Footer Variables */
      --theme-footer-bg: ${mods.footerBg || (mods.darkMode ? '#030712' : '#0f172a')};
      --theme-footer-heading: ${mods.footerHeadingColor || '#ffffff'};
      --theme-footer-text: ${mods.footerTextColor || '#94a3b8'};
      --theme-footer-link: ${mods.footerLinkColor || '#cbd5e1'};
      --theme-footer-border: ${mods.footerBorderColor || border};
      --theme-subfooter-bg: ${mods.subFooterBg || (mods.footerBg || (mods.darkMode ? '#030712' : '#0f172a'))};
      --theme-subfooter-text: ${mods.subFooterTextColor || (mods.footerTextColor || '#94a3b8')};
    }

    body {
      background-color: var(--theme-bg) !important;
      color: var(--theme-text) !important;
      font-family: var(--font-theme-body), sans-serif;
      font-size: var(--theme-base-font-size);
    }

    h1, h2, h3, h4, h5, h6, .theme-heading {
      font-family: var(--font-theme-heading), serif;
      color: var(--theme-heading);
      ${mods.headingTransform && mods.headingTransform !== "none" ? `text-transform: ${mods.headingTransform};` : ""}
      ${mods.headingFontWeight ? `font-weight: ${mods.headingFontWeight};` : ""}
    }

    .theme-container, .site-container {
      max-width: var(--theme-container-width, 1280px) !important;
      width: 100%;
    }

    .theme-rounded, [data-theme-rounded] {
      border-radius: var(--theme-radius, 4px) !important;
    }

    /* Granular Theme Widget Styling */
    .theme-widget, [data-theme-widget] {
      background-color: var(--theme-widget-bg) !important;
      border-color: var(--theme-widget-border) !important;
      color: var(--theme-widget-text) !important;
    }
    .theme-widget-title, [data-theme-widget-title] {
      color: var(--theme-widget-title-color) !important;
      background-color: var(--theme-widget-title-bg, transparent);
    }
    .theme-widget a, [data-theme-widget] a {
      color: var(--theme-widget-link);
    }

    /* Granular Badge Styling */
    .theme-badge, [data-theme-badge] {
      background-color: var(--theme-badge-bg) !important;
      color: var(--theme-badge-text) !important;
    }

    ${mods.customCss || ""}
  `;

  return (
    <>
      {/* External Google Fonts link for modern typography engine */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400..700;1,400..700&family=Merriweather:ital,wght@0,300;0,400;0,700;0,900;1,300;1,400;1,700&family=Montserrat:ital,wght@0,400..900;1,400..900&family=Open+Sans:ital,wght@0,300..800;1,300..800&family=Oswald:wght@300..700&family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Roboto:ital,wght@0,300..900;1,300..900&family=Source+Serif+4:ital,opsz,wght@0,8..60,400..900;1,8..60,400..900&display=swap"
      />
      <style dangerouslySetInnerHTML={{ __html: css }} />
    </>
  );
}
