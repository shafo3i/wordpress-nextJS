"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import type { CustomizerSection, Mods, Palette, SettingDef, SettingValue } from "@/lib/customizer/types";
import { isShown, resolveSetting } from "@/lib/customizer/resolve";
import { keys, localizeSetting, translate } from "@/lib/customizer/i18n";
import { CONTROL_REGISTRY } from "./controls";
import { PalettePicker } from "./palette-picker";
import { FALLBACK_SECTION_ICON, SECTION_ICONS } from "./section-icons";

type Bag = Record<string, unknown>;

export interface SectionPanelProps {
  section: CustomizerSection;
  open: boolean;
  onToggle: () => void;
  /** Resolved mods plus the site identity fields. */
  values: Mods;
  /** Defaults a reset restores, see `getThemeDefaultMods`. */
  defaults: Mods;
  settingsById: Map<string, SettingDef>;
  palettes: Palette[];
  onChange: (setting: SettingDef, value: SettingValue) => void;
  onApplyPalette: (palette: Palette) => void;
  dict?: Record<string, string>;
}

export function SectionPanel({
  section,
  open,
  onToggle,
  values,
  defaults,
  settingsById,
  palettes,
  onChange,
  onApplyPalette,
  dict,
}: SectionPanelProps) {
  const Icon = SECTION_ICONS[section.icon ?? ""] ?? FALLBACK_SECTION_ICON;
  const t = (key: string, fallback: string) => translate(dict, key, fallback);

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between bg-white px-4 py-3 font-semibold text-[#2c3338] hover:bg-[#f6f7f7] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon className="size-4 text-[#2271b1]" />
          <span>{t(keys.section(section), section.title)}</span>
        </div>
        {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
      </button>

      {open && (
        <div className="p-4 space-y-4 bg-[#f6f7f7]">
          {section.palettes && <PalettePicker
              palettes={palettes}
              mods={values}
              onApply={onApplyPalette}
              translate={t}
              label={t("admin.customizer.palettes_title", "Signature Palettes")}
            />}

          {section.groups.map((group, index) => {
            const visible = group.settings.filter((setting) => isShown(setting.showIf, values));
            if (visible.length === 0) return null;

            const boxed = visible.every((setting) => setting.type === "color");
            const controls = visible.map((raw) => {
              const setting = localizeSetting(raw, dict);
              const Control = CONTROL_REGISTRY[setting.type];
              return (
                <Control
                  key={setting.id}
                  setting={setting}
                  label={setting.label}
                  t={t}
                  value={(values as Bag)[setting.id] as SettingValue}
                  resolved={resolveSetting(values, setting.id, settingsById)}
                  resetValue={((defaults as Bag)[setting.id] as SettingValue) ?? ""}
                  onChange={(value) => onChange(raw, value)}
                />
              );
            });

            return (
              <div
                key={group.id}
                className={index > 0 || section.palettes ? "border-t border-[#dcdcde] pt-3" : undefined}
              >
                {group.title && (
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#2271b1] block mb-2">
                    {t(keys.group(section, group), group.title)}
                  </span>
                )}
                {boxed ? (
                  <div className="bg-white rounded border border-[#dcdcde] p-2 space-y-1">{controls}</div>
                ) : (
                  <div className="space-y-3">{controls}</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
