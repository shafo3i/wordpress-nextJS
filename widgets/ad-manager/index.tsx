"use client";

import React from "react";
import manifest from "./widget.json";
import type { WidgetModule, WidgetAdminFormProps, WidgetRenderProps } from "../types";

export function AdManagerAdminForm({ item, onChange, dict }: WidgetAdminFormProps) {
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

      <div>
        <label className="block text-[12px] font-medium text-[#50575e] mb-1">
          Sponsor Tagline / Banner HTML
        </label>
        <textarea
          rows={3}
          value={item.content || ""}
          onChange={(e) => onChange({ content: e.target.value })}
          className="w-full rounded-[3px] border border-[#8c8f94] bg-white p-2 text-[12px] text-[#2c3338]"
        />
      </div>
    </div>
  );
}

export function AdManagerRender({ item }: WidgetRenderProps) {
  return (
    <div className="theme-widget rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4 shadow-sm text-center">
      <span className="text-[9px] uppercase tracking-widest text-slate-400 font-mono block mb-1.5">
        Advertisement
      </span>
      <div
        className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed"
        dangerouslySetInnerHTML={{
          __html:
            item.content ||
            '<div class="p-3 bg-white dark:bg-slate-800 rounded border border-dashed border-slate-300 dark:border-slate-700">Digital Infrastructure Partner 2026</div>',
        }}
      />
    </div>
  );
}

export const adManagerWidgetModule: WidgetModule = {
  manifest: manifest as any,
  AdminForm: AdManagerAdminForm,
  render: AdManagerRender,
};

export default adManagerWidgetModule;
