"use client";

import type { Palette } from "@/lib/customizer/types";
import type { Mods } from "@/lib/customizer/types";
import { keys } from "@/lib/customizer/i18n";

export function PalettePicker({
  palettes,
  mods,
  onApply,
  label = "Signature Palettes",
  translate,
}: {
  palettes: Palette[];
  mods: Mods;
  onApply: (palette: Palette) => void;
  label?: string;
  translate: (key: string, fallback: string) => string;
}) {
  if (palettes.length === 0) return null;

  return (
    <div>
      <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {palettes.map((palette) => {
          const active = mods.primaryColor === palette.colors.primaryColor;
          return (
            <button
              key={palette.id}
              type="button"
              onClick={() => onApply(palette)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded text-[11px] border transition-all ${
                active
                  ? "border-[#2271b1] bg-[#f0f6fc] font-bold text-[#2271b1]"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              }`}
            >
              <span
                className="size-3 rounded-full border border-black/10"
                style={{ backgroundColor: palette.accent }}
              />
              {translate(keys.palette(palette), palette.name)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
