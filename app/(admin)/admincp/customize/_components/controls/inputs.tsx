"use client";

import type { ControlProps } from "./types";
import { Field } from "./field";
import { INPUT_CLASS } from "./styles";

export function RangeControl({ setting, label, resolved, onChange }: ControlProps) {
  const value = Number(resolved ?? setting.min ?? 0);

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[12px] text-[#50575e]">
        <span>{label}</span>
        <span className="font-semibold text-[#1d2327]">
          {value}
          {setting.unit}
        </span>
      </div>
      <input
        type="range"
        min={setting.min}
        max={setting.max}
        step={setting.step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full cursor-pointer accent-[#2271b1]"
      />
    </div>
  );
}

/** Also serves the `image` control: media is referenced by URL. */
export function TextControl({ setting, label, resolved, onChange }: ControlProps) {
  const isUrl = setting.type === "image";

  return (
    <Field label={label} description={setting.description}>
      <input
        type="text"
        value={String(resolved ?? "")}
        placeholder={setting.placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`${INPUT_CLASS} h-[30px] ${isUrl ? "font-mono text-[11px]" : ""}`}
      />
    </Field>
  );
}

/** Also serves the `code` control with a monospace, dark editor look. */
export function TextareaControl({ setting, label, resolved, onChange }: ControlProps) {
  const isCode = setting.type === "code";

  return (
    <Field label={label} description={setting.description}>
      <textarea
        rows={setting.rows ?? 3}
        value={String(resolved ?? "")}
        placeholder={setting.placeholder}
        spellCheck={!isCode}
        onChange={(e) => onChange(e.target.value)}
        className={
          isCode
            ? "w-full rounded border border-[#8c8f94] bg-[#1e293b] p-2.5 font-mono text-[12px] text-emerald-300 focus:border-[#2271b1] focus:outline-none"
            : `${INPUT_CLASS} p-2 text-[12px]`
        }
      />
    </Field>
  );
}
