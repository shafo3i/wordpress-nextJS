import type { Mods, SettingDef } from "./types";
import { DEFAULT_SETTINGS, indexSettings } from "./registry";
import { resolveSetting } from "./resolve";
import { DEFAULT_ARABIC_FONT, getFont, getFontFamilyCss, getFontKind } from "./fonts";
import { getContrastColor } from "./color";

export interface BuildCssOptions {
  /** Settings to emit, defaults to every statically known setting. Pass a theme aware list when needed. */
  settings?: SettingDef[];
}

type Rule = { selectors: string[]; declarations: string[]; layer?: "base" };

/** Custom CSS is admin supplied; stop it from closing our <style> element. */
export function sanitizeCustomCss(css: string | undefined): string {
  return (css ?? "").replace(/<\/?\s*style/gi, "");
}

/** Values end up inside a declaration, so statement and block delimiters are removed. */
function sanitizeValue(value: string): string {
  return value.replace(/[;{}<>\\]/g, "").trim();
}

function formatRule({ selectors, declarations }: Rule): string {
  return `${selectors.join(",\n")} {\n  ${declarations.join("\n  ")}\n}`;
}

/**
 * Rules marked `layer: "base"` go into Tailwind's base layer so utility classes such as
 * `text-white` on image cards still win over element selectors like `h2`.
 */
function formatRules(rules: Rule[]): string {
  const unlayered = rules.filter((rule) => !rule.layer).map(formatRule);
  const base = rules.filter((rule) => rule.layer === "base").map(formatRule);
  return [...unlayered, base.length ? `@layer base {\n${base.join("\n")}\n}` : ""].filter(Boolean).join("\n");
}

/** Font stack for a role setting, which can follow the headline/body font or use a font of its own. */
function roleFontStack(value: string | undefined, fallback: "heading" | "body"): string {
  if (value === "heading") return "var(--font-theme-heading)";
  if (value === "body") return "var(--font-theme-body)";
  return getFont(value)?.stack ?? `var(--font-theme-${fallback})`;
}

function variableDeclarations(mods: Mods, settings: SettingDef[]): string[] {
  const byId = indexSettings(settings);
  const out: string[] = [];

  for (const setting of settings) {
    if (!setting.cssVar) continue;
    const value = resolveSetting(mods, setting.id, byId);
    if (value === undefined || value === "") continue;

    const numeric = /^-?\d+(\.\d+)?$/.test(String(value));
    if (numeric && setting.cssFactor) {
      out.push(`${setting.cssVar}: ${Math.round(Number(value) * setting.cssFactor * 10000) / 10000};`);
      continue;
    }
    const unit = setting.cssUnit && numeric ? setting.cssUnit : "";
    out.push(`${setting.cssVar}: ${sanitizeValue(String(value))}${unit};`);
  }

  const headingFont = getFontFamilyCss(mods.headingFontFamily, getFontKind(mods.headingFontFamily));
  out.push(
    `--theme-on-primary: ${getContrastColor(String(resolveSetting(mods, "primaryColor", byId) ?? ""))};`,
    `--font-theme-heading: ${headingFont};`,
    `--font-theme-body: ${getFontFamilyCss(mods.bodyFontFamily, "sans")};`,
    `--font-theme-site-title: ${roleFontStack(mods.siteTitleFontFamily, "heading")};`,
    `--font-theme-widget-title: ${roleFontStack(mods.widgetTitleFontFamily, "heading")};`,
    `--font-theme-nav: ${roleFontStack(mods.navFontFamily, "body")};`,
    // Tailwind's rounded-* utilities derive from --radius, so the corner setting reaches every card.
    `--radius: calc(var(--theme-radius, 4px) * 2);`
  );

  // Headline utilities (text-lg and up) scale together with the headline size setting.
  for (const [name, rem] of Object.entries(HEADLINE_SIZES)) {
    out.push(`--text-${name}: calc(${rem}rem * var(--theme-heading-scale, 1));`);
  }
  return out;
}

const HEADLINE_SIZES: Record<string, number> = {
  lg: 1.125,
  xl: 1.25,
  "2xl": 1.5,
  "3xl": 1.875,
  "4xl": 2.25,
  "5xl": 3,
  "6xl": 3.75,
};

const CARD_STYLES = {
  "flat-bordered": { shadow: "none", hover: "none", lift: "0" },
  "lifted-shadow": {
    shadow: "0 1px 3px rgba(15, 23, 42, 0.08), 0 10px 24px -12px rgba(15, 23, 42, 0.22)",
    hover: "0 16px 32px -12px rgba(15, 23, 42, 0.32)",
    lift: "-3px",
  },
  "clean-minimal": { shadow: "none", hover: "none", lift: "0" },
} as const;

/** Variables and rules that depend on typography/layout choices rather than a single colour. */
function arabicBlock(mods: Mods): string {
  const heading = getFontFamilyCss(mods.arabicHeadingFontFamily ?? DEFAULT_ARABIC_FONT, "sans");
  const body = getFontFamilyCss(mods.arabicBodyFontFamily ?? DEFAULT_ARABIC_FONT, "sans");
  return `[dir="rtl"] {
  --font-theme-heading: ${heading};
  --font-theme-body: ${body};
  --font-theme-site-title: var(--font-theme-heading);
  --font-theme-widget-title: var(--font-theme-heading);
  --font-theme-nav: var(--font-theme-body);
  font-family: var(--font-theme-body);
}`;
}

function staticRules(mods: Mods): Rule[] {
  const headingDeclarations = ["font-family: var(--font-theme-heading), serif;"];
  if (mods.headingTransform && mods.headingTransform !== "none") {
    headingDeclarations.push(`text-transform: ${sanitizeValue(mods.headingTransform)};`);
  }
  if (mods.headingFontWeight) {
    headingDeclarations.push(`font-weight: ${sanitizeValue(String(mods.headingFontWeight))};`);
  }
  const card = CARD_STYLES[mods.cardStyle ?? "flat-bordered"] ?? CARD_STYLES["flat-bordered"];

  return [
    {
      selectors: ["html"],
      declarations: ["font-size: var(--theme-base-font-size, 16px);"],
    },
    {
      selectors: ["body"],
      declarations: [
        "background-color: var(--theme-bg) !important;",
        "color: var(--theme-text) !important;",
        "font-family: var(--font-theme-body), sans-serif;",
        "font-size: 1rem;",
        "min-width: 0;",
      ],
    },
    // The theme fonts win over component level font-serif / font-sans utilities.
    {
      selectors: [".font-sans"],
      declarations: ["font-family: var(--font-theme-body), sans-serif;"],
    },
    {
      selectors: ["h1", "h2", "h3", "h4", "h5", "h6", ".theme-heading", ".font-serif"],
      declarations: headingDeclarations,
    },
    {
      selectors: ["h1", "h2", "h3", "h4", "h5", "h6", ".theme-heading"],
      declarations: ["color: var(--theme-heading);"],
      layer: "base",
    },
    {
      selectors: [".theme-site-title"],
      declarations: ["font-family: var(--font-theme-site-title), serif;", "zoom: var(--theme-site-title-scale, 1);"],
    },
    {
      selectors: [".theme-nav-link"],
      declarations: ["font-family: var(--font-theme-nav), sans-serif;", "font-size: var(--theme-nav-size, 0.8rem);"],
    },
    {
      selectors: [".theme-card", ".theme-widget"],
      declarations: [`box-shadow: ${card.shadow};`, "transition: box-shadow 0.2s ease, transform 0.2s ease;"],
    },
    ...(mods.cardStyle === "clean-minimal"
      ? [{ selectors: [".theme-card"], declarations: ["border-color: transparent !important;"] }]
      : []),
    {
      selectors: [".theme-card:hover"],
      declarations: [`box-shadow: ${card.hover};`, `transform: translateY(${card.lift});`],
    },
    {
      selectors: [".prose"],
      declarations: ["color: var(--theme-text);", "line-height: 1.75;"],
      layer: "base",
    },
    {
      selectors: [".prose p", ".prose ul", ".prose ol", ".prose blockquote", ".prose figure", ".prose pre"],
      declarations: ["margin-block: 1.1em;"],
      layer: "base",
    },
    {
      selectors: [".prose ul"],
      declarations: ["list-style: disc;", "padding-inline-start: 1.5em;"],
      layer: "base",
    },
    {
      selectors: [".prose ol"],
      declarations: ["list-style: decimal;", "padding-inline-start: 1.5em;"],
      layer: "base",
    },
    {
      selectors: [".prose h2", ".prose h3", ".prose h4"],
      declarations: ["margin-block: 1.6em 0.6em;", "line-height: 1.25;"],
      layer: "base",
    },
    {
      selectors: [".prose h2"],
      declarations: ["font-size: 1.6em;"],
      layer: "base",
    },
    {
      selectors: [".prose h3"],
      declarations: ["font-size: 1.3em;"],
      layer: "base",
    },
    {
      selectors: [".prose a"],
      declarations: ["color: var(--theme-link);", "text-decoration: underline;", "text-underline-offset: 3px;"],
      layer: "base",
    },
    {
      selectors: [".prose a:hover"],
      declarations: ["color: var(--theme-link-hover);"],
      layer: "base",
    },
    {
      selectors: [".prose blockquote"],
      declarations: [
        "border-inline-start: 4px solid var(--theme-primary);",
        "padding-inline-start: 1.1em;",
        "color: var(--theme-heading);",
        "font-style: italic;",
      ],
      layer: "base",
    },
    {
      selectors: [".prose hr", ".prose table", ".prose th", ".prose td"],
      declarations: ["border-color: var(--theme-border);"],
      layer: "base",
    },
    {
      selectors: [".prose img"],
      declarations: ["max-width: 100%;", "height: auto;", "border-radius: var(--theme-radius);"],
      layer: "base",
    },
    {
      selectors: [".prose code"],
      declarations: [
        "background-color: color-mix(in srgb, var(--theme-border) 50%, transparent);",
        "padding: 0.15em 0.4em;",
        "border-radius: 3px;",
        "font-size: 0.9em;",
      ],
      layer: "base",
    },
    {
      selectors: [".theme-btn"],
      declarations: [
        "background-color: var(--theme-button-bg);",
        "color: var(--theme-button-text);",
        "transition: background-color 0.15s;",
      ],
      layer: "base",
    },
    {
      selectors: [".theme-btn:hover:not(:disabled)"],
      declarations: ["background-color: var(--theme-button-hover-bg);"],
      layer: "base",
    },
    {
      selectors: [".theme-input"],
      declarations: [
        "background-color: var(--theme-input-bg);",
        "border: 1px solid var(--theme-input-border);",
        "color: var(--theme-input-text);",
      ],
      layer: "base",
    },
    {
      selectors: [".theme-input::placeholder"],
      declarations: ["color: color-mix(in srgb, var(--theme-input-text) 55%, transparent);"],
      layer: "base",
    },
    {
      selectors: [".theme-input:focus"],
      declarations: ["outline: 2px solid var(--theme-primary);", "outline-offset: 1px;"],
      layer: "base",
    },
    {
      selectors: [".theme-container", ".site-container"],
      declarations: ["max-width: var(--theme-container-width, 1280px) !important;", "width: 100%;"],
    },
    {
      selectors: [".theme-rounded", "[data-theme-rounded]"],
      declarations: ["border-radius: var(--theme-radius, 4px) !important;"],
    },
    {
      selectors: [".theme-widget", "[data-theme-widget]"],
      declarations: [
        "background-color: var(--theme-widget-bg) !important;",
        "border-color: var(--theme-widget-border) !important;",
        "color: var(--theme-widget-text) !important;",
      ],
    },
    {
      selectors: [".theme-widget-title", "[data-theme-widget-title]"],
      declarations: [
        "color: var(--theme-widget-title-color) !important;",
        "font-family: var(--font-theme-widget-title), serif;",
        "font-size: var(--theme-widget-title-size, 0.85rem);",
        "font-weight: var(--theme-widget-title-weight, 700);",
        "text-transform: var(--theme-widget-title-transform, uppercase);",
        "background-color: var(--theme-widget-title-bg, transparent);",
      ],
    },
    {
      selectors: [".theme-widget a", "[data-theme-widget] a"],
      declarations: ["color: var(--theme-widget-link);"],
    },
    {
      selectors: ["footer .theme-widget", "[data-footer-widgets] .theme-widget"],
      declarations: [
        "background-color: var(--theme-footer-widget-bg, transparent) !important;",
        "border-color: var(--theme-footer-border) !important;",
        "color: var(--theme-footer-text) !important;",
        "box-shadow: none !important;",
      ],
    },
    {
      selectors: [
        "footer .theme-widget .theme-widget-title",
        "[data-footer-widgets] .theme-widget-title",
        "footer .theme-widget h1",
        "footer .theme-widget h2",
        "footer .theme-widget h3",
        "footer .theme-widget h4",
        "footer .theme-widget h5",
        "footer .theme-widget h6",
      ],
      declarations: ["color: var(--theme-footer-heading) !important;"],
    },
    {
      selectors: ["footer .theme-widget a", "[data-footer-widgets] .theme-widget a"],
      declarations: ["color: var(--theme-footer-link) !important;"],
    },
    {
      selectors: ["footer .theme-widget p", "footer .theme-widget span", "footer .theme-widget li"],
      declarations: ["color: var(--theme-footer-text);"],
    },
    {
      selectors: ["footer .theme-widget input", "footer .theme-widget select", "footer .theme-widget textarea"],
      declarations: [
        "background-color: color-mix(in srgb, var(--theme-footer-heading) 8%, transparent) !important;",
        "border-color: color-mix(in srgb, var(--theme-footer-heading) 18%, transparent) !important;",
        "color: var(--theme-footer-heading) !important;",
      ],
    },
    {
      selectors: ["footer .theme-widget input::placeholder", "footer .theme-widget textarea::placeholder"],
      declarations: ["color: color-mix(in srgb, var(--theme-footer-heading) 45%, transparent) !important;"],
    },
    {
      selectors: [".theme-badge", "[data-theme-badge]"],
      declarations: [
        "background-color: var(--theme-badge-bg) !important;",
        "color: var(--theme-badge-text) !important;",
      ],
    },
  ];
}

/**
 * The only place theme CSS is generated. Used by the live site and the customizer preview,
 * so the two can't drift apart.
 */
export function buildThemeCss(mods: Mods, options: BuildCssOptions = {}): string {
  const { settings = DEFAULT_SETTINGS } = options;
  const variables = variableDeclarations(mods, settings);
  const root = `:root {\n  ${variables.join("\n  ")}\n}`;
  const rules = formatRules(staticRules(mods));

  const customCss = sanitizeCustomCss(mods.customCss);

  return [root, arabicBlock(mods), rules, customCss].filter(Boolean).join("\n\n");
}
