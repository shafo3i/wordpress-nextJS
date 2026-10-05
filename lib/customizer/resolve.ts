import type { Mods, Palette, SettingDef, SettingValue, ShowIf } from "./types";
import { DEFAULT_SETTINGS_BY_ID, getThemeSettings } from "./registry";
import { getThemeModule } from "@/themes/registry";

type ModBag = Record<string, unknown>;

const MAX_FALLBACK_DEPTH = 6;

const isSet = (value: unknown): value is Exclude<SettingValue, undefined> =>
  value !== undefined && value !== null && value !== "";

/**
 * Migrates removed keys. Empty strings are kept on purpose: for colours they mean
 * "inherit" and must mask the theme default.
 */
function normalizeStored(stored: ModBag | null | undefined): ModBag {
  const out: ModBag = {};
  for (const [key, value] of Object.entries(stored ?? {})) {
    if (value !== null && value !== undefined) out[key] = value;
  }

  if (out.headingFontFamily === undefined && out.headingFont) {
    out.headingFontFamily = out.headingFont === "sans" ? "inter" : "playfair";
  }
  delete out.headingFont;
  return out;
}

export function getSettingDefaults(settings: SettingDef[]): ModBag {
  const defaults: ModBag = {};
  for (const setting of settings) {
    if (setting.default !== undefined) defaults[setting.id] = setting.default;
  }
  return defaults;
}

/** core defaults -> theme defaults -> stored values. */
export function resolveMods(themeSlug: string, stored?: ModBag | null): Mods {
  const theme = getThemeModule(themeSlug);
  return {
    ...getSettingDefaults(getThemeSettings(themeSlug)),
    ...theme.defaults,
    ...normalizeStored(stored),
  } as Mods;
}

/** Mods for a clean "reset to theme defaults". */
export function getThemeDefaultMods(themeSlug: string): Mods {
  return resolveMods(themeSlug, null);
}

/** Value of a setting after following its `fallback` chain. */
export function resolveSetting(
  mods: Mods,
  id: string,
  settingsById: Map<string, SettingDef> = DEFAULT_SETTINGS_BY_ID,
  depth = 0
): SettingValue {
  const value = (mods as ModBag)[id];
  if (isSet(value)) return value;

  const def = settingsById.get(id);
  if (!def) return undefined;
  if (def.fallback && depth < MAX_FALLBACK_DEPTH) {
    return resolveSetting(mods, def.fallback, settingsById, depth + 1);
  }
  return def.default;
}

/** Resolved colour string for a colour setting (empty string when unknown). */
export function resolveColor(mods: Mods, id: string): string {
  return String(resolveSetting(mods, id) ?? "");
}

export function isShown(showIf: ShowIf | undefined, mods: Mods): boolean {
  if (!showIf) return true;
  const raw = (mods as ModBag)[showIf.id];
  const current = raw === undefined || raw === null ? "" : raw;
  if (showIf.equals !== undefined && current !== showIf.equals) return false;
  if (showIf.notEquals !== undefined && current === showIf.notEquals) return false;
  return true;
}

/**
 * Applies a palette over a clean slate so values from a previously selected palette
 * (e.g. widget or badge colours) can't leak into the new one. Colours the palette
 * doesn't define are set to "" (inherit) so theme defaults don't come back after saving.
 */
export function applyPalette(mods: Mods, palette: Palette, settings: SettingDef[]): Mods {
  const next = { ...mods } as ModBag;
  for (const setting of settings) {
    if (setting.type === "color") next[setting.id] = "";
  }
  return { ...(next as Mods), ...palette.colors, darkMode: Boolean(palette.colors.darkMode) };
}

const MAX_TEXT_LENGTH = 2000;
const MAX_CODE_LENGTH = 20000;

/** Coerces one submitted value to what the setting accepts, or undefined to drop it. */
function sanitizeValue(setting: SettingDef, value: unknown): SettingValue {
  switch (setting.type) {
    case "toggle":
      return Boolean(value);
    case "range": {
      const n = Number(value);
      if (!Number.isFinite(n)) return undefined;
      return Math.min(setting.max ?? n, Math.max(setting.min ?? n, n));
    }
    case "select":
    case "button-group":
    case "radio-cards": {
      const match = setting.options?.find((option) => option.value === String(value));
      if (!match) return undefined;
      return setting.numeric ? Number(match.value) : match.value;
    }
    default:
      return typeof value === "string" ? value.slice(0, setting.type === "code" ? MAX_CODE_LENGTH : MAX_TEXT_LENGTH) : undefined;
  }
}

/**
 * Validates mods submitted by the browser before they are stored: known settings are coerced to
 * their type and range, other keys are only kept when they are short primitives.
 */
export function sanitizeMods(themeSlug: string, input: ModBag): Mods {
  const byId = new Map(getThemeSettings(themeSlug).map((setting) => [setting.id, setting]));
  const out: ModBag = {};

  for (const [key, value] of Object.entries(input ?? {})) {
    if (!/^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(key) || value === null || value === undefined) continue;

    const setting = byId.get(key);
    if (setting) {
      const clean = sanitizeValue(setting, value);
      if (clean !== undefined) out[key] = clean;
    } else if (typeof value === "boolean" || typeof value === "number" || (typeof value === "string" && value.length <= MAX_TEXT_LENGTH)) {
      out[key] = value;
    }
  }
  return out as Mods;
}