import type { CustomizerSection, SettingDef } from "../types";

const colorSetting = (
  id: string,
  label: string,
  cssVar: string,
  opts: Partial<SettingDef> = {}
): SettingDef => ({ id, type: "color", label, cssVar, ...opts });

const key = (name: string) => `admin.customizer.colors.${name}`;

export const colorsSection: CustomizerSection = {
  id: "colors",
  title: "Color Palette & Scheme",
  titleKey: "admin.customizer.section.colors",
  icon: "Palette",
  priority: 20,
  palettes: true,
  groups: [
    {
      id: "scheme",
      settings: [
        {
          id: "darkMode",
          type: "toggle",
          label: "Dark Interface Mode",
          description: "Switches blocks and widgets to light-on-dark styling. Pair it with a dark palette.",
          default: false,
        },
      ],
    },
    {
      id: "brand",
      title: "Brand Accents & Highlights",
      titleKey: key("brand_accents"),
      settings: [
        colorSetting("primaryColor", "Primary Brand Accent", "--theme-primary", {
          labelKey: key("brand_primary"),
          default: "#2271b1",
        }),
        colorSetting("secondaryColor", "Secondary Accent / Hover", "--theme-secondary", {
          labelKey: key("brand_secondary"),
          default: "#135e96",
        }),
      ],
    },
    {
      id: "topbar",
      title: "Top Utility Bar",
      settings: [
        colorSetting("topBarBg", "Top Bar Background", "--theme-topbar-bg", {
          labelKey: key("topbar_bg"),
          default: "#0f172a",
        }),
        colorSetting("topBarTextColor", "Top Bar Text & Date", "--theme-topbar-text", {
          labelKey: key("topbar_text"),
          default: "#f8fafc",
        }),
      ],
    },
    {
      id: "header",
      title: "Header & Masthead",
      settings: [
        colorSetting("headerBg", "Header Background", "--theme-header-bg", {
          labelKey: key("header_bg"),
          fallback: "surfaceColor",
        }),
        colorSetting("headerTextColor", "Masthead Title & Tagline", "--theme-header-text", {
          labelKey: key("header_text"),
          fallback: "headingColor",
        }),
        colorSetting("headerBorderColor", "Header Divider / Border", "--theme-header-border", {
          labelKey: key("header_border"),
          fallback: "borderColor",
        }),
      ],
    },
    {
      id: "nav",
      title: "Navigation Menu Colors",
      settings: [
        colorSetting("navBarBg", "Nav Menu Background", "--theme-nav-bg", {
          labelKey: key("nav_bg"),
          fallback: "surfaceColor",
        }),
        colorSetting("navLinkColor", "Nav Links Text", "--theme-nav-link", {
          labelKey: key("nav_link"),
          fallback: "headingColor",
        }),
        colorSetting("navLinkHoverColor", "Nav Links Hover / Active", "--theme-nav-link-hover", {
          labelKey: key("nav_link_hover"),
          fallback: "primaryColor",
        }),
      ],
    },
    {
      id: "surfaces",
      title: "Canvas & Surfaces",
      settings: [
        colorSetting("backgroundColor", "Canvas Background", "--theme-bg", {
          labelKey: key("canvas_bg"),
          default: "#f8f7f4",
        }),
        colorSetting("surfaceColor", "Card Surface Background", "--theme-surface", {
          labelKey: key("card_surface"),
          default: "#ffffff",
        }),
        colorSetting("borderColor", "Card Borders & Rules", "--theme-border", {
          labelKey: key("card_border"),
          default: "#e2e8f0",
        }),
      ],
    },
    {
      id: "text",
      title: "Typography Colors",
      settings: [
        colorSetting("headingColor", "Headlines / Title Color", "--theme-heading", {
          labelKey: key("heading"),
          default: "#0f172a",
        }),
        colorSetting("textColor", "Body Paragraph Color", "--theme-text", {
          labelKey: key("body_text"),
          default: "#1d2327",
        }),
        colorSetting("mutedTextColor", "Muted Meta & Bylines", "--theme-muted", {
          labelKey: key("muted_text"),
          default: "#64748b",
        }),
      ],
    },
    {
      id: "links",
      title: "Links, Buttons & Forms",
      settings: [
        colorSetting("linkColor", "Content Links", "--theme-link", { fallback: "primaryColor" }),
        colorSetting("linkHoverColor", "Content Links Hover", "--theme-link-hover", { fallback: "secondaryColor" }),
        colorSetting("buttonBg", "Button Background", "--theme-button-bg", { fallback: "primaryColor" }),
        colorSetting("buttonTextColor", "Button Text", "--theme-button-text", { default: "#ffffff" }),
        colorSetting("buttonHoverBg", "Button Hover Background", "--theme-button-hover-bg", {
          fallback: "secondaryColor",
        }),
        colorSetting("inputBg", "Form Field Background", "--theme-input-bg", { fallback: "surfaceColor" }),
        colorSetting("inputBorderColor", "Form Field Border", "--theme-input-border", { fallback: "borderColor" }),
        colorSetting("inputTextColor", "Form Field Text", "--theme-input-text", { fallback: "textColor" }),
      ],
    },
    {
      id: "overlay",
      title: "Text on Images",
      settings: [
        colorSetting("overlayTextColor", "Headline Over Photos", "--theme-overlay-text", {
          description: "Titles on image cards and sliders",
          default: "#ffffff",
        }),
        colorSetting("overlayMutedColor", "Meta Over Photos", "--theme-overlay-muted", { default: "#e2e8f0" }),
        colorSetting("overlayScrimColor", "Photo Shade", "--theme-overlay-scrim", {
          description: "Gradient behind text on image cards",
          default: "#000000",
        }),
      ],
    },
    {
      id: "status",
      title: "Status & Plugin Colors",
      settings: [
        colorSetting("successColor", "Success / Verified", "--theme-status-success", { default: "#15803d" }),
        colorSetting("warningColor", "Warning / Developing", "--theme-status-warning", { default: "#b45309" }),
        colorSetting("dangerColor", "Danger / Breaking", "--theme-status-danger", { default: "#dc2626" }),
        colorSetting("infoColor", "Info / Alert", "--theme-status-info", { default: "#2563eb" }),
      ],
    },    {
      id: "widgets",
      title: "Sidebar & Widgets",
      settings: [
        colorSetting("widgetBg", "Widget Background", "--theme-widget-bg", {
          labelKey: key("widget_bg"),
          fallback: "surfaceColor",
        }),
        colorSetting("widgetTitleColor", "Widget Title Text", "--theme-widget-title-color", {
          labelKey: key("widget_title"),
          fallback: "headingColor",
        }),
        colorSetting("widgetTitleBg", "Widget Title Accent / Banner", "--theme-widget-title-bg", {
          labelKey: key("widget_title_bg"),
          default: "transparent",
        }),
        colorSetting("widgetTextColor", "Widget Content Text", "--theme-widget-text", {
          labelKey: key("widget_text"),
          fallback: "textColor",
        }),
        colorSetting("widgetLinkColor", "Widget Links Color", "--theme-widget-link", {
          labelKey: key("widget_link"),
          fallback: "primaryColor",
        }),
        colorSetting("widgetBorderColor", "Widget Border & Dividers", "--theme-widget-border", {
          labelKey: key("widget_border"),
          fallback: "borderColor",
        }),
      ],
    },
    {
      id: "badges",
      title: "Badges & Tags",
      settings: [
        colorSetting("badgeBg", "Badge Background", "--theme-badge-bg", {
          labelKey: key("badge_bg"),
          fallback: "primaryColor",
        }),
        colorSetting("badgeTextColor", "Badge Text Color", "--theme-badge-text", {
          labelKey: key("badge_text"),
          default: "#ffffff",
        }),
      ],
    },
    {
      id: "footer",
      title: "Footer",
      settings: [
        colorSetting("footerBg", "Footer Background", "--theme-footer-bg", {
          labelKey: key("footer_bg"),
          default: "#0f172a",
        }),
        colorSetting("footerHeadingColor", "Footer Headings", "--theme-footer-heading", {
          labelKey: key("footer_heading"),
          default: "#ffffff",
        }),
        colorSetting("footerTextColor", "Footer Body Text", "--theme-footer-text", {
          labelKey: key("footer_text"),
          default: "#94a3b8",
        }),
        colorSetting("footerLinkColor", "Footer Links", "--theme-footer-link", {
          labelKey: key("footer_link"),
          default: "#cbd5e1",
        }),
        colorSetting("footerWidgetBg", "Footer Widget Background", "--theme-footer-widget-bg", {
          default: "transparent",
        }),
        colorSetting("footerBorderColor", "Footer Divider Border", "--theme-footer-border", {
          labelKey: key("footer_border"),
          default: "#334155",
        }),
        colorSetting("subFooterBg", "Sub-Footer / Copyright Background", "--theme-subfooter-bg", {
          labelKey: key("subfooter_bg"),
          fallback: "footerBg",
        }),
        colorSetting("subFooterTextColor", "Sub-Footer / Copyright Text", "--theme-subfooter-text", {
          labelKey: key("subfooter_text"),
          fallback: "footerTextColor",
        }),
      ],
    },
  ],
};
