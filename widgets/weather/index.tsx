"use client";

import React from "react";
import { CloudSun, Wind, Droplets } from "lucide-react";
import manifest from "./widget.json";
import type { WidgetModule, WidgetAdminFormProps, WidgetRenderProps } from "../types";

export function WeatherAdminForm({ item, onChange, dict }: WidgetAdminFormProps) {
  const city = item.config?.city || "London";
  const temp = item.config?.temp || "18";
  const condition = item.config?.condition || "Sunny";

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-[12px] font-medium text-[#50575e] mb-1">
          {dict?.["admin.widgets.widget_title"] || "Widget Title"}
        </label>
        <input
          type="text"
          value={item.title}
          onChange={(e) => onChange({ title: e.target.value })}
          className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[11px] font-medium text-[#50575e] mb-1">City</label>
          <input
            type="text"
            value={city}
            onChange={(e) =>
              onChange({
                config: { ...item.config, city: e.target.value },
              })
            }
            className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-xs text-[#2c3338]"
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-[#50575e] mb-1">Temperature (°C)</label>
          <input
            type="text"
            value={temp}
            onChange={(e) =>
              onChange({
                config: { ...item.config, temp: e.target.value },
              })
            }
            className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-xs text-[#2c3338]"
          />
        </div>
      </div>

      <div>
        <label className="block text-[11px] font-medium text-[#50575e] mb-1">Condition</label>
        <select
          value={condition}
          onChange={(e) =>
            onChange({
              config: { ...item.config, condition: e.target.value },
            })
          }
          className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-xs text-[#2c3338]"
        >
          <option value="Sunny">Sunny ☀️</option>
          <option value="Partly Cloudy">Partly Cloudy ⛅</option>
          <option value="Rainy">Rainy 🌧️</option>
          <option value="Clear Night">Clear Night 🌙</option>
        </select>
      </div>
    </div>
  );
}

export function WeatherRender({ item, theme }: WidgetRenderProps) {
  const city = item.config?.city || "London";
  const temp = item.config?.temp || "18";
  const condition = item.config?.condition || "Sunny";

  return (
    <div className="theme-widget rounded-xl border border-sky-100 dark:border-sky-950 bg-gradient-to-br from-sky-50 via-white to-blue-50 dark:from-slate-900 dark:to-sky-950/40 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h4 className="theme-widget-title text-xs font-bold uppercase tracking-wider text-sky-800 dark:text-sky-300">
          {item.title}
        </h4>
        <span className="text-[10px] font-semibold text-sky-600 dark:text-sky-400 bg-sky-100 dark:bg-sky-900/60 px-1.5 py-0.5 rounded">
          {city}
        </span>
      </div>

      <div className="flex items-center justify-between my-3">
        <div className="flex items-center gap-3">
          <CloudSun className="size-9 text-amber-500 animate-pulse" />
          <div>
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white leading-none">
              {temp}°C
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium mt-0.5">
              {condition}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-sky-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1">
          <Wind className="size-3 text-sky-500" /> 14 km/h NW
        </span>
        <span className="flex items-center gap-1">
          <Droplets className="size-3 text-sky-500" /> 62% Humidity
        </span>
      </div>
    </div>
  );
}

export const weatherWidgetModule: WidgetModule = {
  manifest: manifest as any,
  AdminForm: WeatherAdminForm,
  render: WeatherRender,
};

export default weatherWidgetModule;
