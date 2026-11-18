export type FontKind = "serif" | "sans";

export interface FontDef {
  id: string;
  label: string;
  note: string;
  kind: FontKind;
  /** CSS font-family stack. */
  stack: string;
  /** Bundled WOFF2 family; omitted for system fonts. */
  local?: boolean;
  heading: boolean;
  body: boolean;
  /** Writing system the font is designed for. Latin fonts are used for LTR, Arabic fonts for RTL. */
  script: "latin" | "arabic";
}

export const FONTS: FontDef[] = [
  {
    id: "playfair",
    label: "Playfair Display",
    note: "Classic Broadsheet Serif",
    kind: "serif",
    stack: "'Playfair Display', Georgia, serif",
    local: true,
    heading: true,
    body: false,
    script: "latin",
  },
  {
    id: "merriweather",
    label: "Merriweather",
    note: "Warm Literary Editorial Serif",
    kind: "serif",
    stack: "'Merriweather', Georgia, serif",
    local: true,
    heading: true,
    body: false,
    script: "latin",
  },
  {
    id: "georgia",
    label: "Georgia",
    note: "Traditional Newspaper Serif",
    kind: "serif",
    stack: "Georgia, Cambria, 'Times New Roman', Times, serif",
    heading: true,
    body: false,
    script: "latin",
  },
  {
    id: "source_serif",
    label: "Source Serif 4",
    note: "Longform Editorial",
    kind: "serif",
    stack: "'Source Serif 4', Georgia, serif",
    local: true,
    heading: false,
    body: true,
    script: "latin",
  },
  {
    id: "lora",
    label: "Lora",
    note: "Literary Serif",
    kind: "serif",
    stack: "'Lora', Georgia, serif",
    local: true,
    heading: false,
    body: true,
    script: "latin",
  },
  {
    id: "inter",
    label: "Inter",
    note: "Clean High-Legibility Sans",
    kind: "sans",
    stack: "'Inter', -apple-system, sans-serif",
    local: true,
    heading: true,
    body: true,
    script: "latin",
  },
  {
    id: "roboto",
    label: "Roboto",
    note: "Dynamic Digital News Sans",
    kind: "sans",
    stack: "'Roboto', -apple-system, sans-serif",
    local: true,
    heading: true,
    body: true,
    script: "latin",
  },
  {
    id: "montserrat",
    label: "Montserrat",
    note: "Bold Magazine Display Sans",
    kind: "sans",
    stack: "'Montserrat', -apple-system, sans-serif",
    local: true,
    heading: true,
    body: false,
    script: "latin",
  },
  {
    id: "oswald",
    label: "Oswald",
    note: "Condensed Impact Wire Sans",
    kind: "sans",
    stack: "'Oswald', sans-serif",
    local: true,
    heading: true,
    body: false,
    script: "latin",
  },
  {
    id: "open_sans",
    label: "Open Sans",
    note: "Neutral Sans",
    kind: "sans",
    stack: "'Open Sans', -apple-system, sans-serif",
    local: true,
    heading: false,
    body: true,
    script: "latin",
  },
  { id: "cairo", label: "Cairo", note: "Modern geometric Arabic sans", kind: "sans", stack: "'Cairo', 'Segoe UI', Tahoma, sans-serif", local: true, heading: true, body: true, script: "arabic" },
  { id: "tajawal", label: "Tajawal", note: "Clean Arabic UI sans", kind: "sans", stack: "'Tajawal', 'Segoe UI', Tahoma, sans-serif", local: true, heading: true, body: true, script: "arabic" },
  { id: "almarai", label: "Almarai", note: "Rounded readable Arabic sans", kind: "sans", stack: "'Almarai', 'Segoe UI', Tahoma, sans-serif", local: true, heading: true, body: true, script: "arabic" },
  { id: "noto_kufi_arabic", label: "Noto Kufi Arabic", note: "Bold Kufi display", kind: "sans", stack: "'Noto Kufi Arabic', 'Segoe UI', Tahoma, sans-serif", local: true, heading: true, body: true, script: "arabic" },
  { id: "ibm_plex_arabic", label: "IBM Plex Sans Arabic", note: "Neutral technical Arabic sans", kind: "sans", stack: "'IBM Plex Sans Arabic', 'Segoe UI', Tahoma, sans-serif", local: true, heading: true, body: true, script: "arabic" },
  { id: "noto_naskh_arabic", label: "Noto Naskh Arabic", note: "Traditional Naskh serif for long reading", kind: "serif", stack: "'Noto Naskh Arabic', 'Traditional Arabic', serif", local: true, heading: true, body: true, script: "arabic" },
  { id: "amiri", label: "Amiri", note: "Classical Arabic book serif", kind: "serif", stack: "'Amiri', 'Traditional Arabic', serif", local: true, heading: true, body: true, script: "arabic" },
  { id: "el_messiri", label: "El Messiri", note: "Distinctive Arabic display", kind: "sans", stack: "'El Messiri', 'Segoe UI', Tahoma, sans-serif", local: true, heading: true, body: false, script: "arabic" },
];

const FONT_BY_ID = new Map(FONTS.map((f) => [f.id, f]));

const GENERIC_STACK: Record<FontKind, string> = {
  serif: "Georgia, serif",
  sans: "-apple-system, sans-serif",
};

export const LATIN_FONTS = FONTS.filter((f) => f.script === "latin");
export const ARABIC_FONTS = FONTS.filter((f) => f.script === "arabic");
export const HEADING_FONTS = LATIN_FONTS.filter((f) => f.heading);
export const BODY_FONTS = LATIN_FONTS.filter((f) => f.body);

/** Default Arabic font when a theme doesn't choose one. */
export const DEFAULT_ARABIC_FONT = "cairo";

/** Base UI families share their assets with the theme font catalog. */
export const BASE_FONT_STYLESHEETS = ["/fonts/inter/font.css", "/fonts/geist_mono/font.css"] as const;

/** Resolve known font ids only; never turn arbitrary settings into asset paths. */
export function getLocalFontStylesheets(ids: Array<string | undefined>): string[] {
  return Array.from(new Set(ids.filter((id): id is string => Boolean(getFont(id)?.local))))
    .map(id => "/fonts/" + id + "/font.css");
}
export function getFont(id?: string): FontDef | undefined {
  return id ? FONT_BY_ID.get(id) : undefined;
}

export function getFontFamilyCss(family?: string, fallback: FontKind = "serif"): string {
  return getFont(family)?.stack ?? GENERIC_STACK[fallback];
}

/** Whether a font id is a serif or sans face (replaces the legacy `headingFont` mod). */
export function getFontKind(family?: string, fallback: FontKind = "serif"): FontKind {
  return getFont(family)?.kind ?? fallback;
}
