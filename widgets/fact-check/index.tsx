"use client";

import React from "react";
import manifest from "./widget.json";
import type { WidgetModule, WidgetAdminFormProps, WidgetRenderProps } from "../types";

export function FactCheckAdminForm({ item, onChange, dict }: WidgetAdminFormProps) {
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
          Claim & Rating Text
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

export function FactCheckRender({ item }: WidgetRenderProps) {
  return (
    <div className="rounded-xl border border-emerald-300 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
          Verified Scorecard
        </span>
        <span className="rounded bg-emerald-600 text-white font-black text-[9px] px-2 py-0.5">
          TRUE
        </span>
      </div>
      <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug mb-1">
        {item.title}
      </h4>
      <p className="text-[11px] text-slate-600 dark:text-slate-300">
        {item.content || "Global shipping rates decline 40% in Q3. Verified by Bureau Desk."}
      </p>
    </div>
  );
}

export const factCheckWidgetModule: WidgetModule = {
  manifest: manifest as any,
  AdminForm: FactCheckAdminForm,
  render: FactCheckRender,
};

export default factCheckWidgetModule;
