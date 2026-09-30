"use client";

import React from "react";
import { Search } from "lucide-react";
import manifest from "./widget.json";
import type { WidgetModule, WidgetAdminFormProps, WidgetRenderProps } from "../types";

export function SearchAdminForm({ item, onChange, dict }: WidgetAdminFormProps) {
  return (
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
  );
}

export function SearchRender({ item, theme }: WidgetRenderProps) {
  return (
    <div className="theme-widget rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
      <h4 className="theme-widget-title text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
        {item.title}
      </h4>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const input = form.querySelector<HTMLInputElement>("input[type='text']");
          const q = input?.value?.trim();
          if (q) {
            window.location.href = `/search?q=${encodeURIComponent(q)}`;
          }
        }}
        className="flex gap-1.5"
      >
        <input
          type="text"
          name="q"
          placeholder="Search news..."
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none"
        />
        <button
          type="submit"
          style={{ backgroundColor: theme?.primaryColor || "#2271b1" }}
          className="rounded-lg px-3 py-1.5 text-white hover:opacity-90 transition-opacity"
        >
          <Search className="size-3.5" />
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
