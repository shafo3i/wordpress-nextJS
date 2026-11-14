"use client";
import { sanitizePluginMarkup } from "@/lib/plugins/markup";

import React from "react";
import manifest from "./widget.json";
import type { WidgetModule, WidgetAdminFormProps, WidgetRenderProps, WidgetManifest } from "../types";

export function CustomHtmlAdminForm({ item, onChange, dict }: WidgetAdminFormProps) {


  return (
    <div className="space-y-3 text-start">
      <div>
        <label className="block text-[0.75rem] font-medium text-[#50575e] mb-1">
          {dict?.["admin.widgets.widget_title"] || ""}
        </label>
        <input
          type="text"
          value={item.title}
          onChange={(e) => onChange({ title: e.target.value })}
          className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[0.8125rem] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-[0.75rem] font-medium text-[#50575e] mb-1">
          {dict?.["admin.widgets.content"] || ""}
        </label>
        <textarea
          rows={5}
          value={item.content || ""}
          onChange={(e) => onChange({ content: e.target.value })}
          placeholder={dict?.["admin.widgets.safe_html_placeholder"] || ""}
          className="w-full font-mono rounded-[3px] border border-[#8c8f94] bg-white p-2 text-[0.75rem] text-[#2c3338]"
        />
      </div>
    </div>
  );
}

export function CustomHtmlRender({ item }: WidgetRenderProps) {
  if (!item.content?.trim()) return null;

  return (
    <div className="theme-widget rounded-xl border border-[var(--theme-widget-border,var(--theme-border))] bg-[var(--theme-widget-bg,var(--theme-surface))] text-[var(--theme-widget-text,var(--theme-text))] p-4 shadow-sm text-start">
      {item.title && (
        <h4 className="theme-widget-title text-xs font-bold uppercase tracking-wider text-[var(--theme-widget-title-color,var(--theme-heading))] mb-2">
          {item.title}
        </h4>
      )}
      <div
        className="text-xs text-theme-text overflow-hidden"
        dangerouslySetInnerHTML={{
          __html: sanitizePluginMarkup(item.content),
        }}
      />
    </div>
  );
}

export const customHtmlWidgetModule: WidgetModule = {
  manifest: manifest as WidgetManifest,
  AdminForm: CustomHtmlAdminForm,
  render: CustomHtmlRender,
};

export default customHtmlWidgetModule;
