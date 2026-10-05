import type { CustomizerSection, Palette, SettingDef } from "./types";
import { CORE_SECTIONS } from "./core-sections";
import { CORE_PALETTES } from "./palettes";
import { getThemeModule } from "@/themes/registry";
import { PLUGIN_CUSTOMIZER_SECTIONS } from "@/plugins/customizer-sections";

export function flattenSettings(sections: CustomizerSection[]): SettingDef[] {
  return sections.flatMap((section) => section.groups.flatMap((group) => group.settings));
}

export function indexSettings(settings: SettingDef[]): Map<string, SettingDef> {
  return new Map(settings.map((setting) => [setting.id, setting]));
}

const PLUGIN_SECTIONS = Object.values(PLUGIN_CUSTOMIZER_SECTIONS).flat();

/** Settings known without theme context: core plus every plugin (active or not), so defaults and CSS stay stable. */
export const DEFAULT_SETTINGS: SettingDef[] = flattenSettings([...CORE_SECTIONS, ...PLUGIN_SECTIONS]);
export const DEFAULT_SETTINGS_BY_ID = indexSettings(DEFAULT_SETTINGS);

/** Sections contributed by the given active plugins. */
export function getPluginSections(activePluginSlugs: string[]): CustomizerSection[] {
  return activePluginSlugs.flatMap((slug) => PLUGIN_CUSTOMIZER_SECTIONS[slug] ?? []);
}

/** Sections without the settings a theme opted out of. Extra sections come from plugins. */
export function buildSections(
  themeSlug: string,
  extraSections: CustomizerSection[] = []
): CustomizerSection[] {
  const theme = getThemeModule(themeSlug);
  const hidden = new Set(theme.hiddenSettings ?? []);
  const supports = theme.supports;

  const restrictOptions = (setting: SettingDef): SettingDef => {
    const allowed =
      setting.id === "headerLayout"
        ? supports?.headerLayouts
        : setting.id === "singleLayout"
          ? supports?.singleLayouts
          : undefined;
    if (!allowed || !setting.options) return setting;
    return { ...setting, options: setting.options.filter((o) => (allowed as string[]).includes(o.value)) };
  };

  return [...CORE_SECTIONS, ...(theme.sections ?? []), ...extraSections]
    .map((section) => ({
      ...section,
      groups: section.groups
        .map((group) => ({
          ...group,
          settings: group.settings.filter((s) => !hidden.has(s.id)).map(restrictOptions),
        }))
        .filter((group) => group.settings.length > 0),
    }))
    .filter((section) => section.groups.length > 0)
    .sort((a, b) => a.priority - b.priority);
}

/** Every setting that affects output for a theme, including those hidden in the UI. */
export function getThemeSettings(themeSlug: string): SettingDef[] {
  const theme = getThemeModule(themeSlug);
  return flattenSettings([...CORE_SECTIONS, ...PLUGIN_SECTIONS, ...(theme.sections ?? [])]);
}

export function getPalettes(themeSlug: string): Palette[] {
  return getThemeModule(themeSlug).palettes ?? CORE_PALETTES;
}
