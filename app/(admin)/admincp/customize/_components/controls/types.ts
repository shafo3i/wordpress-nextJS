import type { SettingDef, SettingValue } from "@/lib/customizer/types";

export interface ControlProps {
  setting: SettingDef;
  /** Localised label. */
  label: string;
  /** Value stored in the mods (may be empty for inherited settings). */
  value: SettingValue;
  /** Effective value after following the fallback chain. */
  resolved: SettingValue;
  /** Value "reset" restores (theme default, or empty to inherit). */
  resetValue: SettingValue;
  onChange: (value: SettingValue) => void;
  /** Translate a UI string, falling back to the given English text. */
  t: (key: string, fallback: string) => string;
}
