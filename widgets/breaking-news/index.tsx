"use client";

import React from "react";
import { Radio } from "lucide-react";
import manifest from "./widget.json";
import type { WidgetModule, WidgetAdminFormProps, WidgetRenderProps } from "../types";

export function BreakingNewsAdminForm({ item, onChange, dict }: WidgetAdminFormProps) {
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
          Breaking Dispatch Text
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

export function BreakingNewsRender({ item }: WidgetRenderProps) {
  return (
    <div className="rounded-xl border border-rose-300 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/50 p-4 text-rose-950 dark:text-rose-200 shadow-sm">
      <div className="flex items-center gap-1.5 text-rose-600 mb-1 font-bold text-[10px] uppercase tracking-wider">
        <Radio className="size-3.5 animate-pulse" /> Breaking Alert
      </div>
      <h4 className="text-xs font-bold leading-snug mb-1">{item.title}</h4>
      <p className="text-[11px] leading-relaxed text-rose-900/80 dark:text-rose-300/80">
        {item.content || "Emergency market circuit breaker triggered across secondary commodities."}
      </p>
    </div>
  );
}

export const breakingNewsWidgetModule: WidgetModule = {
  manifest: manifest as any,
  AdminForm: BreakingNewsAdminForm,
  render: BreakingNewsRender,
};

export default breakingNewsWidgetModule;
