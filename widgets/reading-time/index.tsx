"use client";

import React from "react";
import { Clock } from "lucide-react";
import manifest from "./widget.json";
import type { WidgetModule, WidgetAdminFormProps, WidgetRenderProps } from "../types";

export function ReadingTimeAdminForm({ item, onChange, dict, direction }: WidgetAdminFormProps) {
  const isRtl = direction === "rtl";
  const wpm = item.config?.wpm || 200;
  const description = item.content || item.config?.description || (isRtl ? "معدل القراءة المعياري: ~200 كلمة/دقيقة (متوسط قراءة 3-5 دقائق)." : "Average editorial read pace: ~200 words/min (3-5 min reads).");
  const showMilestones = item.config?.showMilestones !== false;

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

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[11px] font-medium text-[#50575e] mb-1">
            {isRtl ? "معدل الكلمات في الدقيقة (WPM)" : "Words Per Minute (WPM)"}
          </label>
          <input
            type="number"
            min="100"
            max="600"
            value={wpm}
            onChange={(e) => onChange({ config: { ...item.config, wpm: Number(e.target.value) || 200 } })}
            className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-xs text-[#2c3338]"
          />
        </div>
        <div className="flex items-end pb-1.5">
          <label className="flex items-center gap-1.5 text-xs text-[#2c3338] cursor-pointer">
            <input
              type="checkbox"
              checked={showMilestones}
              onChange={(e) => onChange({ config: { ...item.config, showMilestones: e.target.checked } })}
              className="rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
            />
            <span>{isRtl ? "عرض مؤشرات السرعة" : "Show speed milestones"}</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-[11px] font-medium text-[#50575e] mb-1">
          {isRtl ? "النص الإرشادي / الوصف" : "Guide Note / Description"}
        </label>
        <textarea
          rows={2}
          value={description}
          onChange={(e) => {
            onChange({
              content: e.target.value,
              config: { ...item.config, description: e.target.value },
            });
          }}
          className="w-full rounded-[3px] border border-[#8c8f94] bg-white p-2 text-[12px] text-[#2c3338]"
        />
      </div>
    </div>
  );
}

export function ReadingTimeRender({ item, theme }: WidgetRenderProps) {
  const isRtl = theme?.direction === "rtl";
  const wpm = item.config?.wpm || 200;
  const description = item.content || item.config?.description || (isRtl ? "معدل القراءة المعياري: ~200 كلمة/دقيقة (متوسط قراءة 3-5 دقائق)." : "Average editorial read pace: ~200 words/min (3-5 min reads).");
  const showMilestones = item.config?.showMilestones !== false;

  return (
    <div className="theme-widget rounded-xl border border-[var(--theme-widget-border,var(--theme-border,#e2e8f0))] bg-[var(--theme-widget-bg,var(--theme-surface,#ffffff))] text-[var(--theme-widget-text,var(--theme-text,#1d2327))] p-4 shadow-sm text-start">
      <div className="flex items-center gap-1.5 text-[var(--theme-primary,#2271b1)] mb-1">
        <Clock className="size-3.5" />
        <span className="text-[10px] font-bold uppercase tracking-wider">
          {isRtl ? "مؤشر سرعة القراءة" : "Reading Velocity"}
        </span>
      </div>
      <h4 className="theme-widget-title text-xs font-bold text-[var(--theme-widget-title-color,var(--theme-heading,#0f172a))] mb-1">
        {item.title || (isRtl ? "وقت القراءة" : "Reading Time")}
      </h4>
      <p className="text-[11px] text-[var(--theme-muted,#64748b)] mb-2.5 leading-relaxed">
        {description}
      </p>

      {showMilestones && (
        <div className="rounded-lg bg-[var(--theme-bg,#f8f7f4)] border border-[var(--theme-border,#e2e8f0)] p-2 text-[10px] text-[var(--theme-text,#1d2327)] flex justify-between font-mono">
          <span>{isRtl ? `معياري: ${wpm} ك/د` : `Standard: ${wpm} WPM`}</span>
          <span>{isRtl ? `سريع: ${Math.round(wpm * 1.5)} ك/د` : `Fast: ${Math.round(wpm * 1.5)} WPM`}</span>
        </div>
      )}
    </div>
  );
}

export const readingTimeWidgetModule: WidgetModule = {
  manifest: manifest as any,
  AdminForm: ReadingTimeAdminForm,
  render: ReadingTimeRender,
};

export default readingTimeWidgetModule;
