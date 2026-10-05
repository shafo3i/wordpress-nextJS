"use client";

import React, { useState, useEffect } from "react";
import { CloudSun, Sun, CloudRain, CloudSnow, CloudLightning, Wind, Droplets, RefreshCw } from "lucide-react";
import manifest from "./widget.json";
import type { WidgetModule, WidgetAdminFormProps, WidgetRenderProps } from "../types";

export function WeatherAdminForm({ item, onChange, dict, direction }: WidgetAdminFormProps) {
  const isRtl = direction === "rtl";
  const city = item.config?.city || "";
  const unit = item.config?.unit || "C";
  const manualTemp = item.config?.manualTemp ?? "24";
  const manualCondition = item.config?.manualCondition || "Sunny";
  const useLiveApi = item.config?.useLiveApi !== false;

  return (
    <div className="space-y-3 text-start">
      <div>
        <label className="block text-[0.75rem] font-medium text-[#50575e] mb-1">
          {dict?.["admin.widgets.widget_title"] || (isRtl ? "عنوان الأداة" : "Widget Title")}
        </label>
        <input
          type="text"
          value={item.title || ""}
          placeholder={dict?.["admin.widgets.descriptor.weather.name"] || manifest.name}
          onChange={(e) => onChange({ title: e.target.value })}
          className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[0.8125rem] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[0.6875rem] font-medium text-[#50575e] mb-1">
            {isRtl ? "اسم المدينة" : "City Name"}
          </label>
          <input
            type="text"
            value={city}
            placeholder={isRtl ? "الرياض" : "London"}
            onChange={(e) =>
              onChange({
                config: { ...item.config, city: e.target.value },
              })
            }
            className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-xs text-[#2c3338]"
          />
        </div>
        <div>
          <label className="block text-[0.6875rem] font-medium text-[#50575e] mb-1">
            {isRtl ? "وحدة القياس" : "Temperature Unit"}
          </label>
          <select
            value={unit}
            onChange={(e) =>
              onChange({
                config: { ...item.config, unit: e.target.value },
              })
            }
            className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-xs text-[#2c3338]"
          >
            <option value="C">{isRtl ? "مئوية (°C)" : "Celsius (°C)"}</option>
            <option value="F">{isRtl ? "فهرنهايت (°F)" : "Fahrenheit (°F)"}</option>
          </select>
        </div>
      </div>

      <div className="rounded border border-[#e2e4e7] bg-[#f9f9f9] p-2.5 space-y-2">
        <label className="flex items-center gap-2 text-xs text-[#2c3338] font-medium cursor-pointer">
          <input
            type="checkbox"
            checked={useLiveApi}
            onChange={(e) =>
              onChange({
                config: { ...item.config, useLiveApi: e.target.checked },
              })
            }
            className="rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
          />
          <span>{isRtl ? "تفعيل التحديث الحي التلقائي للطقس (Open-Meteo)" : "Enable live automated weather fetching (Open-Meteo)"}</span>
        </label>
        <p className="text-[0.625rem] text-[#646970]">
          {isRtl
            ? "يقوم بجلب درجات الحرارة والرياح والرطوبة مباشرة عبر الأقمار الصناعية لمدينتك المحددة."
            : "Fetches live temperature, wind speed, and humidity automatically for the specified city."}
        </p>
      </div>

      {!useLiveApi && (
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#f0f0f1]">
          <div>
            <label className="block text-[0.6875rem] font-medium text-[#50575e] mb-1">
              {isRtl ? "درجة الحرارة اليدوية" : "Manual Temp"}
            </label>
            <input
              type="text"
              value={manualTemp}
              onChange={(e) =>
                onChange({
                  config: { ...item.config, manualTemp: e.target.value },
                })
              }
              className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-xs text-[#2c3338]"
            />
          </div>
          <div>
            <label className="block text-[0.6875rem] font-medium text-[#50575e] mb-1">
              {isRtl ? "حالة الجو اليدوية" : "Manual Condition"}
            </label>
            <select
              value={manualCondition}
              onChange={(e) =>
                onChange({
                  config: { ...item.config, manualCondition: e.target.value },
                })
              }
              className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-xs text-[#2c3338]"
            >
              <option value="Sunny">{isRtl ? "مشمس ☀️" : "Sunny ☀️"}</option>
              <option value="Partly Cloudy">{isRtl ? "غائم جزئياً ⛅" : "Partly Cloudy ⛅"}</option>
              <option value="Rainy">{isRtl ? "ممطر 🌧️" : "Rainy 🌧️"}</option>
              <option value="Stormy">{isRtl ? "عاصف / رعدي ⛈️" : "Stormy ⛈️"}</option>
              <option value="Snowy">{isRtl ? "ثلجي ❄️" : "Snowy ❄️"}</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

function getWeatherMeta(code: number, isRtl: boolean) {
  if (code === 0) {
    return { label: isRtl ? "صافٍ ومشمس" : "Clear & Sunny", icon: Sun, color: "text-amber-500" };
  }
  if ([1, 2, 3].includes(code)) {
    return { label: isRtl ? "غائم جزئياً" : "Partly Cloudy", icon: CloudSun, color: "text-amber-500" };
  }
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) {
    return { label: isRtl ? "أمطار متفرقة" : "Rain Showers", icon: CloudRain, color: "text-sky-500" };
  }
  if ([71, 73, 75, 77, 85, 86].includes(code)) {
    return { label: isRtl ? "تساقط ثلوج" : "Snowfall", icon: CloudSnow, color: "text-indigo-400" };
  }
  if ([95, 96, 99].includes(code)) {
    return { label: isRtl ? "عواصف رعدية" : "Thunderstorms", icon: CloudLightning, color: "text-purple-500" };
  }
  return { label: isRtl ? "معتدل" : "Fair", icon: CloudSun, color: "text-amber-500" };
}

export function WeatherRender({ item, theme }: WidgetRenderProps) {
  const isRtl = theme?.direction === "rtl";
  const city = item.config?.city || (isRtl ? "الرياض" : "London");
  const unit = item.config?.unit || "C";
  const manualTemp = item.config?.manualTemp ?? "24";
  const manualCondition = item.config?.manualCondition || (isRtl ? "مشمس" : "Sunny");
  const useLiveApi = item.config?.useLiveApi !== false;

  const [liveData, setLiveData] = useState<{
    temp: number;
    weatherCode: number;
    humidity: number;
    windSpeed: number;
    cityName: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!useLiveApi || !city) return;
    let isCancelled = false;

    async function fetchLiveWeather() {
      try {
        setLoading(true);
        // 1. Geocode city name to lat/lon
        const geoRes = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
        );
        if (!geoRes.ok) return;
        const geoJson = await geoRes.json();
        const location = geoJson?.results?.[0];
        if (!location) return;

        // 2. Fetch live forecast
        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&temperature_unit=${
            unit === "F" ? "fahrenheit" : "celsius"
          }`
        );
        if (!weatherRes.ok) return;
        const weatherJson = await weatherRes.json();
        const current = weatherJson?.current;

        if (!isCancelled && current) {
          setLiveData({
            temp: Math.round(current.temperature_2m),
            weatherCode: current.weather_code,
            humidity: current.relative_humidity_2m,
            windSpeed: Math.round(current.wind_speed_10m),
            cityName: location.name || city,
          });
        }
      } catch (err) {
        // Fall back gracefully to manual values without crashing
        console.warn("Weather fetch failed, falling back to defaults", err);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    fetchLiveWeather();
    return () => {
      isCancelled = true;
    };
  }, [city, unit, useLiveApi]);

  const displayTemp = liveData ? liveData.temp : manualTemp;
  const weatherMeta = liveData
    ? getWeatherMeta(liveData.weatherCode, isRtl)
    : { label: manualCondition, icon: CloudSun, color: "text-amber-500" };
  const WeatherIcon = weatherMeta.icon;

  return (
    <div className="theme-widget rounded-xl border border-[var(--theme-widget-border,var(--theme-border))] bg-[var(--theme-widget-bg,var(--theme-surface))] text-[var(--theme-widget-text,var(--theme-text))] p-4 shadow-sm text-start">
      <div className="flex items-center justify-between mb-2">
        <h4 className="theme-widget-title text-xs font-bold uppercase tracking-wider text-[var(--theme-widget-title-color,var(--theme-heading))]">
          {item.title || (isRtl ? "النشرة الجوية" : "Weather Desk")}
        </h4>
        <div className="flex items-center gap-1.5">
          {loading && <RefreshCw className="size-3 text-[var(--theme-primary)] animate-spin" />}
          <span className="text-[0.625rem] font-semibold text-[var(--theme-primary)] border border-theme-border bg-theme-surface px-2 py-0.5 rounded-full">
            {liveData?.cityName || city}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between my-3">
        <div className="flex items-center gap-3">
          <WeatherIcon className={`size-10 ${weatherMeta.color} animate-pulse`} />
          <div>
            <div className="flex items-baseline gap-0.5">
              <span className="text-3xl font-black text-[var(--theme-heading)] leading-none">
                {displayTemp}
              </span>
              <span className="text-sm font-bold text-[var(--theme-primary)]">
                °{unit}
              </span>
            </div>
            <span className="text-xs text-[var(--theme-muted)] block font-medium mt-0.5">
              {weatherMeta.label}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2.5 border-t border-[var(--theme-border)] text-[0.6875rem] text-[var(--theme-muted)]">
        <span className="flex items-center gap-1 font-mono">
          <Wind className="size-3 text-[var(--theme-primary)]" />
          {liveData ? `${liveData.windSpeed} km/h` : "14 km/h"}
        </span>
        <span className="flex items-center gap-1 font-mono">
          <Droplets className="size-3 text-[var(--theme-primary)]" />
          {liveData ? `${liveData.humidity}% ${isRtl ? "رطوبة" : "Humidity"}` : "60%"}
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
