import { buildPalette, type PaletteTokens } from "./palette-builder";
import type { Palette } from "./types";

export const BROADSHEET_BLUE: PaletteTokens = {
  primary: "#1d5fa8",
  secondary: "#134a86",
  bg: "#f6f4ef",
  surface: "#ffffff",
  text: "#1f2933",
  heading: "#0f172a",
  muted: "#5a6573",
  border: "#dad6cc",
  header: "#ffffff",
  topbar: "#0f172a",
  nav: "#ffffff",
  footer: "#0f172a",
  accent: "#8fc1f5",
  ticker: "#c8102e",
};

export const CRIMSON_MAGAZINE: PaletteTokens = {
  primary: "#d3123f",
  secondary: "#a30d31",
  bg: "#f5f6f8",
  surface: "#ffffff",
  text: "#1e293b",
  heading: "#0b1020",
  muted: "#526071",
  border: "#e1e5ec",
  header: "#ffffff",
  topbar: "#d3123f",
  nav: "#111827",
  footer: "#0b1020",
  accent: "#fb7185",
  ticker: "#7f0d29",
};

export const CYBER_EMERALD: PaletteTokens = {
  dark: true,
  primary: "#10b981",
  secondary: "#0d9668",
  bg: "#0a0f1d",
  surface: "#121a2b",
  text: "#dbe3ee",
  heading: "#f8fafc",
  muted: "#9aa7bb",
  border: "#25324a",
  header: "#0a0f1d",
  topbar: "#04070f",
  nav: "#0f1729",
  footer: "#04070f",
  accent: "#34d399",
  ticker: "#047857",
};

export const FINANCIAL_AMBER: PaletteTokens = {
  primary: "#b45309",
  secondary: "#92400e",
  bg: "#fbf6e9",
  surface: "#ffffff",
  text: "#292524",
  heading: "#1c1917",
  muted: "#6f655c",
  border: "#eadfc2",
  header: "#ffffff",
  topbar: "#1f2937",
  nav: "#1f2937",
  footer: "#1c1917",
  accent: "#fbbf24",
  ticker: "#b45309",
};

export const EDITORIAL_STONE: PaletteTokens = {
  primary: "#44403c",
  secondary: "#1c1917",
  bg: "#f9f7f2",
  surface: "#ffffff",
  text: "#292524",
  heading: "#1c1917",
  muted: "#6e6760",
  border: "#e4e0d8",
  header: "#f9f7f2",
  topbar: "#292524",
  nav: "#f9f7f2",
  footer: "#1c1917",
  accent: "#e7e2d9",
  ticker: "#9a3412",
};

export const OXFORD_NAVY: PaletteTokens = {
  primary: "#1e3a8a",
  secondary: "#172c6b",
  bg: "#f3f6fb",
  surface: "#ffffff",
  text: "#0f172a",
  heading: "#0a1330",
  muted: "#5b677c",
  border: "#d3dbe8",
  header: "#ffffff",
  topbar: "#0a1330",
  nav: "#1e3a8a",
  footer: "#0a1330",
  accent: "#93c5fd",
  ticker: "#b91c1c",
};

export const VIOLET_TECH: PaletteTokens = {
  primary: "#6d28d9",
  secondary: "#5b21b6",
  bg: "#f7f3ff",
  surface: "#ffffff",
  text: "#241b4b",
  heading: "#150f33",
  muted: "#66608a",
  border: "#e3d8f8",
  header: "#ffffff",
  topbar: "#2e1065",
  nav: "#4c1d95",
  footer: "#1a0f3d",
  accent: "#c4b5fd",
  ticker: "#be185d",
};

/** Built from the exact brand colours #d1e4dd (sage) and #28303d (slate). */
export const SAGE_SLATE: PaletteTokens = {
  primary: "#28303d",
  secondary: "#3b4658",
  bg: "#d1e4dd",
  surface: "#eef5f2",
  text: "#28303d",
  heading: "#28303d",
  muted: "#4a5565",
  border: "#aecbc0",
  header: "#d1e4dd",
  topbar: "#28303d",
  nav: "#28303d",
  footer: "#28303d",
  accent: "#d1e4dd",
  ticker: "#d1e4dd",
  overrides: {
    topBarTextColor: "#d1e4dd",
    navLinkColor: "#d1e4dd",
    navLinkHoverColor: "#ffffff",
    footerHeadingColor: "#d1e4dd",
    footerTextColor: "#b3cbc2",
    footerLinkColor: "#d1e4dd",
    subFooterTextColor: "#9db3ab",
  },
};

export const SLATE_SAGE: PaletteTokens = {
  dark: true,
  primary: "#d1e4dd",
  secondary: "#b6d2c8",
  bg: "#28303d",
  surface: "#323c4b",
  text: "#d1e4dd",
  heading: "#f2f8f5",
  muted: "#9db3ab",
  border: "#454f60",
  header: "#28303d",
  topbar: "#1e252f",
  nav: "#1e252f",
  footer: "#1e252f",
  accent: "#d1e4dd",
  ticker: "#d1e4dd",
};

const preset = (id: string, name: string, accent: string, tokens: PaletteTokens): Palette => ({
  id,
  name,
  accent,
  colors: buildPalette(tokens),
});

/** Core palettes offered to every theme unless the theme ships its own list. */
export const CORE_PALETTES: Palette[] = [
  preset("sage-slate", "Sage & Slate", "#d1e4dd", SAGE_SLATE),
  preset("slate-sage", "Slate & Sage (Dark)", "#28303d", SLATE_SAGE),
  preset("broadsheet-blue", "Broadsheet Blue", "#1d5fa8", BROADSHEET_BLUE),
  preset("crimson-magazine", "Crimson Magazine", "#d3123f", CRIMSON_MAGAZINE),
  preset("cyber-emerald", "Cyber Emerald (Dark)", "#10b981", CYBER_EMERALD),
  preset("financial-amber", "Financial Amber", "#b45309", FINANCIAL_AMBER),
  preset("editorial-stone", "Editorial Stone", "#44403c", EDITORIAL_STONE),
  preset("oxford-navy", "Oxford Navy", "#1e3a8a", OXFORD_NAVY),
  preset("violet-tech", "Violet Tech", "#6d28d9", VIOLET_TECH),
];
