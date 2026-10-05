"use client";

import type { ControlProps } from "./types";
import { HINT_CLASS } from "./styles";

export function ToggleControl({ setting, label, resolved, onChange }: ControlProps) {
  return (
    <label className="flex items-center justify-between gap-3 cursor-pointer py-0.5">
      <div className="min-w-0">
        <span className="text-[12px] font-medium text-[#50575e] block">{label}</span>
        {setting.description && <span className={`${HINT_CLASS} block`}>{setting.description}</span>}
      </div>
      <input
        type="checkbox"
        checked={resolved !== false}
        onChange={(e) => onChange(e.target.checked)}
        className="rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
      />
    </label>
  );
}
