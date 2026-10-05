"use client";

import React from "react";
import { Search } from "lucide-react";
import manifest from "./widget.json";
import type { WidgetModule, WidgetAdminFormProps, WidgetRenderProps } from "../types";

import { t } from "@/components/site/utils";

export function SearchAdminForm({ item, onChange, dict, direction }: WidgetAdminFormProps) {
  const isRtl = direction === "rtl";
  const placeholder = item.config?.placeholder || (isRtl ? "ابحث في الأخبار والتقارير..." : "Search news & reports...");

  return (
    <div className="space-y-3 text-start">
      <div>
        <label className="block text-[0.75rem] font-medium text-[#50575e] mb-1">
          {dict?.["admin.widgets.widget_title"] || (isRtl ? "عنوان الأداة" : "Widget Title")}
        </label>
        <input
          type="text"
          value={item.title}
          onChange={(e) => onChange({ title: e.target.value })}
          className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[0.8125rem] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-[0.6875rem] font-medium text-[#50575e] mb-1">
          {isRtl ? "النص الإرشادي لحقل البحث (Placeholder)" : "Search Input Placeholder"}
        </label>
        <input
          type="text"
          value={placeholder}
          onChange={(e) => onChange({ config: { ...item.config, placeholder: e.target.value } })}
          className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-xs text-[#2c3338]"
        />
      </div>
    </div>
  );
}

export function SearchRender({ item, theme }: WidgetRenderProps) {
  const isRtl = theme?.direction === "rtl";
  const placeholder = item.config?.placeholder || t("site.search_news", theme, "Search news...");

  return (
    <div className="theme-widget rounded-xl border border-[var(--theme-widget-border,var(--theme-border))] bg-[var(--theme-widget-bg,var(--theme-surface))] text-[var(--theme-widget-text,var(--theme-text))] p-4 shadow-sm text-start">
      <h4 className="theme-widget-title text-xs font-bold uppercase tracking-wider text-[var(--theme-widget-title-color,var(--theme-heading))] mb-2.5">
        {item.title || t("site.search", theme, "Search")}
      </h4>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const input = form.querySelector<HTMLInputElement>("input[name='q']");
          const q = input?.value?.trim();
          if (q) {
            window.location.href = `/search?q=${encodeURIComponent(q)}`;
          }
        }}
        className="flex gap-1.5"
      >
        <div className="relative flex-1">
          <input
            type="text"
            name="q"
            placeholder={placeholder}
            className="w-full h-9 rounded-lg theme-input px-3 text-xs text-[var(--theme-text)] placeholder:opacity-60 focus:outline-none focus:border-[var(--theme-primary)]"
          />
        </div>
        <button
          type="submit"
          className="theme-btn h-9 px-3 rounded-lg  hover:opacity-90 transition-opacity flex items-center justify-center flex-shrink-0 cursor-pointer"
          title={t("site.search", theme, "Search")}
        >
          <Search className="size-4" />
        </button>
      </form>
    </div>
  );
}

export const searchWidgetModule: WidgetModule = {
  manifest: manifest as any,
  AdminForm: SearchAdminForm,
  render: SearchRender,
};

export default searchWidgetModule;
