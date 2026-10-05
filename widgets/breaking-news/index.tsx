"use client";

import React from "react";
import Link from "next/link";
import { Radio, AlertCircle, ArrowUpRight } from "lucide-react";
import manifest from "./widget.json";
import type { WidgetModule, WidgetAdminFormProps, WidgetRenderProps } from "../types";

export function BreakingNewsAdminForm({ item, onChange, dict, direction }: WidgetAdminFormProps) {
  const isRtl = direction === "rtl";
  const dispatchText = item.content || item.config?.dispatchText || "";
  const targetUrl = item.config?.targetUrl || "";
  const urgency = item.config?.urgency || "urgent";
  const badgeText = item.config?.badgeText || (isRtl ? "عاجل" : "Breaking Alert");
  const enablePulse = item.config?.enablePulse !== false;

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

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[0.6875rem] font-medium text-[#50575e] mb-1">
            {isRtl ? "مستوى الأهمية" : "Urgency Level"}
          </label>
          <select
            value={urgency}
            onChange={(e) => onChange({ config: { ...item.config, urgency: e.target.value } })}
            className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-xs text-[#2c3338]"
          >
            <option value="urgent">{isRtl ? "عاجل جداً (أحمر)" : "Critical Urgent (Red)"}</option>
            <option value="developing">{isRtl ? "تطورات مستمرة (برتقالي)" : "Developing Story (Orange)"}</option>
            <option value="alert">{isRtl ? "تنبيه تحريري (أزرق)" : "Editorial Flash (Blue)"}</option>
          </select>
        </div>
        <div>
          <label className="block text-[0.6875rem] font-medium text-[#50575e] mb-1">
            {isRtl ? "نص الشارة العاجلة" : "Badge Text"}
          </label>
          <input
            type="text"
            value={badgeText}
            placeholder={isRtl ? "عاجل" : "Breaking Alert"}
            onChange={(e) => onChange({ config: { ...item.config, badgeText: e.target.value } })}
            className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-xs text-[#2c3338]"
          />
        </div>
      </div>

      <div>
        <label className="block text-[0.6875rem] font-medium text-[#50575e] mb-1">
          {isRtl ? "نص الخبر العاجل" : "Breaking Headline / Dispatch Text"}
        </label>
        <textarea
          rows={3}
          value={dispatchText}
          placeholder={isRtl ? "اكتب تفاصيل التطور العاجل هنا..." : "Enter developing news dispatch details..."}
          onChange={(e) => {
            onChange({
              content: e.target.value,
              config: { ...item.config, dispatchText: e.target.value },
            });
          }}
          className="w-full rounded-[3px] border border-[#8c8f94] bg-white p-2 text-[0.75rem] text-[#2c3338]"
        />
      </div>

      <div>
        <label className="block text-[0.6875rem] font-medium text-[#50575e] mb-1">
          {isRtl ? "رابط المقال أو التغطية (اختياري)" : "Story Coverage URL (Optional)"}
        </label>
        <input
          type="text"
          value={targetUrl}
          placeholder="/posts/..."
          onChange={(e) => onChange({ config: { ...item.config, targetUrl: e.target.value } })}
          className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-xs text-[#2c3338]"
        />
      </div>

      <div>
        <label className="flex items-center gap-2 text-xs text-[#2c3338] cursor-pointer">
          <input
            type="checkbox"
            checked={enablePulse}
            onChange={(e) => onChange({ config: { ...item.config, enablePulse: e.target.checked } })}
            className="rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
          />
          <span>{isRtl ? "تفعيل مؤشر النبض الحي المتحرك" : "Enable animated live radar pulse"}</span>
        </label>
      </div>
    </div>
  );
}

export function BreakingNewsRender({ item, theme }: WidgetRenderProps) {
  const isRtl = theme?.direction === "rtl";
  const dispatchText = item.content || item.config?.dispatchText || (isRtl ? "متابعة مستمرة لآخر التطورات والأخبار العاجلة على مدار الساعة." : "Live breaking dispatch coverage developing across bureaus.");
  const targetUrl = item.config?.targetUrl;
  const urgency = item.config?.urgency || "urgent";
  const badgeText = item.config?.badgeText || (isRtl ? "عاجل" : "Breaking Alert");
  const enablePulse = item.config?.enablePulse !== false;

  const badgeStyles = {
    urgent: "bg-theme-danger text-white",
    developing: "bg-theme-warning text-white",
    alert: "bg-theme-primary text-theme-on-primary",
  }[urgency as "urgent" | "developing" | "alert"] || "bg-theme-danger text-white";

  return (
    <div
      className="theme-widget rounded-xl border border-[var(--theme-widget-border,var(--theme-border))] bg-[var(--theme-widget-bg,var(--theme-surface))] text-[var(--theme-widget-text,var(--theme-text))] p-4 shadow-sm text-start"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className={`flex items-center gap-1 rounded ${badgeStyles} px-2 py-0.5 text-[0.5625rem] font-black uppercase tracking-wider`}>
            {enablePulse ? (
              <Radio className="size-3 animate-pulse" />
            ) : (
              <AlertCircle className="size-3" />
            )}
            {badgeText}
          </span>
          <span className="text-[0.625rem] text-[var(--theme-muted)] font-mono opacity-80">
            {isRtl ? "مباشر من غرفة الأخبار" : "Live Wire"}
          </span>
        </div>
      </div>

      {item.title && (
        <h4 className="theme-widget-title text-xs font-black leading-snug mb-1 text-[var(--theme-widget-title-color,var(--theme-heading))]">
          {item.title}
        </h4>
      )}

      <p className="text-[0.6875rem] text-[var(--theme-muted)] leading-relaxed mb-2">
        {dispatchText}
      </p>

      {targetUrl && (
        <div className="pt-2 border-t border-[var(--theme-border)] flex justify-end">
          <Link
            href={targetUrl}
            className="text-[0.6875rem] font-bold text-[var(--theme-primary)] hover:underline inline-flex items-center gap-1"
          >
            <span>{isRtl ? "التفاصيل الكاملة" : "Read full coverage"}</span>
            <ArrowUpRight className="size-3" />
          </Link>
        </div>
      )}
    </div>
  );
}

export const breakingNewsWidgetModule: WidgetModule = {
  manifest: manifest as any,
  AdminForm: BreakingNewsAdminForm,
  render: BreakingNewsRender,
};

export default breakingNewsWidgetModule;
