"use client";

import type { SettingValue } from "@/lib/customizer/types";
import type { ControlProps } from "./types";
import { Field } from "./field";
import { INPUT_CLASS, HINT_CLASS, optionClass } from "./styles";

/** Option values are strings in the UI; numeric settings are converted back on change. */
const toStored = (raw: string, numeric?: boolean): SettingValue => (numeric ? Number(raw) : raw);

export function SelectControl({ setting, label, resolved, onChange }: ControlProps) {
  return (
    <Field label={label} description={setting.description}>
      <select
        value={String(resolved ?? "")}
        onChange={(e) => onChange(toStored(e.target.value, setting.numeric))}
        className={`${INPUT_CLASS} h-[32px]`}
      >
        {setting.options?.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function ButtonGroupControl({ setting, label, resolved, onChange }: ControlProps) {
  const columns = setting.columns ?? setting.options?.length ?? 3;

  return (
    <Field label={label} description={setting.description}>
      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {setting.options?.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(toStored(option.value, setting.numeric))}
            className={`${optionClass(String(resolved) === option.value)} p-1.5 text-[11px]`}
          >
            {option.radius !== undefined && (
              <div
                className="size-4 mx-auto mb-1 border-2 border-slate-400"
                style={{ borderRadius: option.radius }}
              />
            )}
            {option.label}
            {option.note && <span className={`${HINT_CLASS} block font-normal`}>{option.note}</span>}
          </button>
        ))}
      </div>
    </Field>
  );
}

export function RadioCardsControl({ setting, label, resolved, onChange }: ControlProps) {
  const columns = setting.columns ?? 1;

  return (
    <Field label={label} description={setting.description}>
      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {setting.options?.map((option) => {
          const active = String(resolved) === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(option.value)}
              className={`${optionClass(active)} p-2 text-start flex items-start gap-2`}
            >
              {option.icon && <span className="text-base leading-none">{option.icon}</span>}
              <span className="min-w-0 flex-1">
                <span
                  className={`text-[12px] font-semibold block ${
                    option.fontKind === "serif" ? "font-serif" : option.fontKind === "sans" ? "font-sans" : ""
                  }`}
                >
                  {option.label}
                </span>
                {option.note && <span className={`${HINT_CLASS} block font-normal`}>{option.note}</span>}
              </span>
            </button>
          );
        })}
      </div>
    </Field>
  );
}
