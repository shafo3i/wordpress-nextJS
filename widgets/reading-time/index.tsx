"use client";

import React from "react";
import { Clock } from "lucide-react";
import manifest from "./widget.json";
import type { WidgetModule, WidgetAdminFormProps, WidgetRenderProps } from "../types";

export function ReadingTimeAdminForm({ item, onChange, dict }: WidgetAdminFormProps) {
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
          Reading Time Description
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

export function ReadingTimeRender({ item }: WidgetRenderProps) {
  return (
    <div className="rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/30 p-4 shadow-sm">
      <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 mb-1">
        <Clock className="size-3.5" />
        <span className="text-[10px] font-bold uppercase tracking-wider">Reading Velocity</span>
      </div>
      <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-1">{item.title}</h4>
      <p className="text-[11px] text-slate-600 dark:text-slate-300 mb-2 leading-relaxed">
        {item.content || "Average editorial story read pace: ~200 words/min (3-5 min reads)."}
      </p>
      <div className="rounded bg-blue-100/70 dark:bg-blue-900/40 p-2 text-[10px] text-blue-900 dark:text-blue-200 flex justify-between font-mono">
        <span>Standard: 200 WPM</span>
        <span>Fast: 320 WPM</span>
      </div>
    </div>
  );
}

export const readingTimeWidgetModule: WidgetModule = {
  manifest: manifest as any,
  AdminForm: ReadingTimeAdminForm,
  render: ReadingTimeRender,
};

export default readingTimeWidgetModule;
