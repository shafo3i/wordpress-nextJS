"use client";

import React from "react";
import manifest from "./widget.json";
import type { WidgetModule, WidgetAdminFormProps, WidgetRenderProps } from "../types";

export function AuthorBioAdminForm({ item, onChange, dict }: WidgetAdminFormProps) {
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
          Bio / Newsroom Description
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

export function AuthorBioRender({ item, theme }: WidgetRenderProps) {
  return (
    <div className="theme-widget rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
      <h4 className="theme-widget-title text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
        {item.title}
      </h4>
      <div className="flex items-center gap-3 mb-2">
        <div
          style={{ backgroundColor: theme?.primaryColor || "#2271b1" }}
          className="size-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
        >
          SN
        </div>
        <div>
          <span className="text-xs font-bold block text-slate-900 dark:text-white">
            Signal Bureau
          </span>
          <span className="text-[10px] text-slate-400">Independent Desk</span>
        </div>
      </div>
      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
        {item.content ||
          "Independent investigative reporting and market intelligence operating under strict editorial standards."}
      </p>
    </div>
  );
}

export const authorBioWidgetModule: WidgetModule = {
  manifest: manifest as any,
  AdminForm: AuthorBioAdminForm,
  render: AuthorBioRender,
};

export default authorBioWidgetModule;
