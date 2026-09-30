"use client";

import React from "react";
import manifest from "./widget.json";
import type { WidgetModule, WidgetAdminFormProps, WidgetRenderProps } from "../types";

export function SocialShareAdminForm({ item, onChange, dict }: WidgetAdminFormProps) {
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

export function SocialShareRender({ item }: WidgetRenderProps) {
  return (
    <div className="theme-widget rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
      <h4 className="theme-widget-title text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
        {item.title}
      </h4>
      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <a
          href="#twitter"
          className="rounded-lg border border-slate-200 dark:border-slate-800 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold flex items-center gap-1.5 text-slate-800 dark:text-slate-200"
        >
          <span>𝕏</span> 42.8k Follow
        </a>
        <a
          href="#linkedin"
          className="rounded-lg border border-slate-200 dark:border-slate-800 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold flex items-center gap-1.5 text-slate-800 dark:text-slate-200"
        >
          <span>in</span> 19.4k Follow
        </a>
      </div>
    </div>
  );
}

export const socialShareWidgetModule: WidgetModule = {
  manifest: manifest as any,
  AdminForm: SocialShareAdminForm,
  render: SocialShareRender,
};

export default socialShareWidgetModule;
