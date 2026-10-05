"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import type { ControlProps } from "./types";

const HEX_PICKER = /^#[0-9a-f]{6}$/i;

function isValidColor(value: string): boolean {
  const v = value.trim();
  if (!v) return false;
  if (v === "transparent") return true;
  return typeof CSS !== "undefined" && typeof CSS.supports === "function" && CSS.supports("color", v);
}

export function ColorControl({ setting, label, value, resolved, resetValue, onChange, t }: ControlProps) {
  const effective = String(resolved ?? "");
  // Text typed by the user while it may not be a valid colour yet; null means "show the effective value".
  const [draft, setDraft] = useState<string | null>(null);

  const isInherited = !value;
  const canReset = (value ?? "") !== (resetValue ?? "");
  const pickerValue = HEX_PICKER.test(effective) ? effective : "#ffffff";

  const commit = (next: string) => {
    setDraft(next);
    if (isValidColor(next)) onChange(next.trim());
  };

  return (
    <div className="flex items-center justify-between py-1.5 border-b border-[#e5e5e7] last:border-b-0">
      <div className="pr-2 min-w-0 flex-1">
        <span className="text-[12px] font-medium text-[#2c3338] block">{label}</span>
        {(setting.description || isInherited) && (
          <span className="text-[10px] text-[#646970] block leading-tight mt-0.5 truncate">
            {setting.description ?? t("admin.customizer.inherited", "Inherited automatically")}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {canReset && (
          <button
            type="button"
            onClick={() => {
              setDraft(null);
              onChange(resetValue);
            }}
            title={t("admin.customizer.reset_color", "Reset to theme default")}
            className="size-6 flex items-center justify-center rounded text-[#646970] hover:bg-[#f0f0f1] hover:text-[#2271b1]"
          >
            <RotateCcw className="size-3" />
          </button>
        )}
        <input
          type="color"
          value={pickerValue}
          onChange={(e) => {
            setDraft(null);
            onChange(e.target.value);
          }}
          className="size-7 cursor-pointer rounded border border-[#8c8f94] p-0.5 bg-white shadow-xs"
          title={`${t("admin.customizer.pick_color", "Pick color for")} ${label}`}
        />
        <input
          type="text"
          value={draft ?? effective}
          onChange={(e) => commit(e.target.value)}
          onBlur={() => setDraft(null)}
          className="h-[28px] w-24 rounded border border-[#8c8f94] bg-white px-1.5 font-mono text-[11px] text-[#2c3338] focus:border-[#2271b1] focus:outline-none"
        />
      </div>
    </div>
  );
}
