import type { CustomizerSection, Palette, SettingDef, SettingGroup } from "./types";

export type Dict = Record<string, string> | undefined;

/**
 * Translation keys are derived from ids, so adding a setting only needs its English text
 * in the schema; translators add `admin.customizer.*` keys to the language files.
 */
export const keys = {
  section: (section: Pick<CustomizerSection, "id" | "titleKey">) =>
    section.titleKey ?? `admin.customizer.section.${section.id}`,
  group: (section: Pick<CustomizerSection, "id">, group: Pick<SettingGroup, "id" | "titleKey">) =>
    group.titleKey ?? `admin.customizer.group.${section.id}.${group.id}`,
  setting: (setting: Pick<SettingDef, "id" | "labelKey">) => setting.labelKey ?? `admin.customizer.setting.${setting.id}`,
  description: (setting: Pick<SettingDef, "id" | "labelKey">) =>
    setting.labelKey ? `${setting.labelKey}_desc` : `admin.customizer.setting.${setting.id}_desc`,
  option: (settingId: string, value: string) => `admin.customizer.option.${settingId}.${value}`,
  optionNote: (settingId: string, value: string) => `admin.customizer.option.${settingId}.${value}_note`,
  palette: (palette: Pick<Palette, "id">) => `admin.customizer.palette.${palette.id}`,
};

export const translate = (dict: Dict, key: string, fallback: string): string => dict?.[key] || fallback;

/** Copy of a setting with label, description and option texts taken from the dictionary. */
export function localizeSetting(setting: SettingDef, dict: Dict): SettingDef {
  if (!dict) return setting;
  return {
    ...setting,
    label: translate(dict, keys.setting(setting), setting.label),
    description: setting.description ? translate(dict, keys.description(setting), setting.description) : undefined,
    options: setting.options?.map((option) => ({
      ...option,
      label: translate(dict, keys.option(setting.id, option.value), option.label),
      note: option.note ? translate(dict, keys.optionNote(setting.id, option.value), option.note) : undefined,
    })),
  };
}