"use client";

import React from "react";
import manifest from "./widget.json";
import type { WidgetModule, WidgetAdminFormProps, WidgetRenderProps } from "../types";

export function CustomHtmlAdminForm({ item, onChange, dict, direction }: WidgetAdminFormProps) {
  const isRtl = direction === "rtl";

  return (
    <div className="space-y-3 text-start">
      <div>
        <label className="block text-[12px] font-medium text-[#50575e] mb-1">
          {dict?.["admin.widgets.widget_title"] || (isRtl ? "عنوان الأداة" : "Widget Title")}
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
          {isRtl ? "كود HTML مخصص / تضمين أو برمجيات" : "HTML Code / Content"}
        </label>
        <textarea
          rows={5}
          value={item.content || ""}
          onChange={(e) => onChange({ content: e.target.value })}
          placeholder="<div>Custom HTML, embed codes, widgets, scripts...</div>"
          className="w-full font-mono rounded-[3px] border border-[#8c8f94] bg-white p-2 text-[12px] text-[#2c3338]"
        />
      </div>
    </div>
  );
}

export function CustomHtmlRender({ item, theme }: WidgetRenderProps) {
  const isRtl = theme?.direction === "rtl";

  return (
    <div className="theme-widget rounded-xl border border-[var(--theme-widget-border,var(--theme-border,#e2e8f0))] bg-[var(--theme-widget-bg,var(--theme-surface,#ffffff))] text-[var(--theme-widget-text,var(--theme-text,#1d2327))] p-4 shadow-sm text-start">
      {item.title && (
        <h4 className="theme-widget-title text-xs font-bold uppercase tracking-wider text-[var(--theme-widget-title-color,var(--theme-heading,#0f172a))] mb-2">
          {item.title}
        </h4>
      )}
      <div
        className="text-xs text-slate-600 dark:text-slate-300 overflow-hidden"
        dangerouslySetInnerHTML={{
          __html:
            item.content ||
            `<div class="p-3 bg-slate-100 dark:bg-slate-800 text-center rounded text-xs text-slate-500">${
              isRtl ? "كتلة HTML مخصصة" : "Custom HTML Block"
            }</div>`,
        }}
      />
    </div>
  );
}

export const customHtmlWidgetModule: WidgetModule = {
  manifest: manifest as any,
  AdminForm: CustomHtmlAdminForm,
  render: CustomHtmlRender,
};

export default customHtmlWidgetModule;
