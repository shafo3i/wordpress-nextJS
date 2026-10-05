import type { ThemeMods } from "@/lib/themes/types";

export type Mods = ThemeMods;

export type ControlType =
  | "color"
  | "toggle"
  | "select"
  | "button-group"
  | "radio-cards"
  | "range"
  | "text"
  | "textarea"
  | "code"
  | "image";

export type SettingValue = string | number | boolean | undefined;

export interface SettingOption {
  value: string;
  label: string;
  note?: string;
  icon?: string;
  /** Visual hint for `radio-cards`, e.g. renders the label in a serif/sans face. */
  fontKind?: "serif" | "sans";
  /** Visual hint for `button-group`, previews the corner radius in px. */
  radius?: number;
}

/** Declarative visibility rule. Plain data so sections can cross the server/client boundary. */
export interface ShowIf {
  id: string;
  equals?: SettingValue;
  notEquals?: SettingValue;
}

export interface SettingDef {
  /** Key inside the stored `theme_mods_<slug>` JSON. */
  id: string;
  type: ControlType;
  label: string;
  /** Admin dictionary key, `label` is the English fallback. */
  labelKey?: string;
  description?: string;
  placeholder?: string;
  /** Hard default. Omit for settings that should inherit through `fallback`. */
  default?: SettingValue;
  options?: SettingOption[];
  /** Stores option values as numbers (e.g. footer columns). */
  numeric?: boolean;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  rows?: number;
  /** Emit this setting as a CSS custom property. */
  cssVar?: string;
  /** Appended to numeric values when emitted as CSS, e.g. "px". */
  cssUnit?: string;
  /** Multiplies numeric values before emitting them as CSS (e.g. 0.01 turns percent into a ratio). */
  cssFactor?: number;
  /** Another setting id used when this one is empty. */
  fallback?: string;
  showIf?: ShowIf;
  /** `site` settings live in wp_options (blogname/blogdescription), not in theme mods. */
  store?: "mods" | "site";
  /** Grid columns for option based controls. */
  columns?: number;
}

export interface SettingGroup {
  id: string;
  title?: string;
  titleKey?: string;
  description?: string;
  settings: SettingDef[];
}

export interface CustomizerSection {
  id: string;
  title: string;
  titleKey?: string;
  /** lucide-react icon name, resolved by the admin UI. */
  icon?: string;
  priority: number;
  /** Render the palette picker at the top of the section. */
  palettes?: boolean;
  /** Switches the preview to the single article page while open. */
  previewPage?: "home" | "single";
  groups: SettingGroup[];
}

export interface Palette {
  id: string;
  name: string;
  /** Swatch colour shown on the preset chip. */
  accent: string;
  colors: Partial<Mods>;
}

export type HeaderLayout = NonNullable<Mods["headerLayout"]>;
export type SingleLayout = NonNullable<Mods["singleLayout"]>;
