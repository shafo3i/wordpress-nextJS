"use client";

import React from "react";
import Link from "next/link";
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle, ArrowUpRight } from "lucide-react";
import manifest from "./widget.json";
import type { WidgetModule, WidgetAdminFormProps, WidgetRenderProps } from "../types";
import { t } from "@/components/site/utils";

export function FactCheckAdminForm({ item, onChange, dict, direction }: WidgetAdminFormProps) {
  const isRtl = direction === "rtl";
  const claim = item.config?.claim || (isRtl ? "تراجع معدلات التضخم بنسبة 50% خلال الربع الأخير" : "Inflation dropped 50% in the last quarter");
  const claimant = item.config?.claimant || (isRtl ? "تصريح متداول على منصات التواصل" : "Viral social post");
  const verdict = item.config?.verdict || "misleading";
  const explanation = item.content || item.config?.explanation || (isRtl ? "البيانات الرسمية توضح تباطؤ وتيرة التضخم وليس انخفاض الأسعار بنسبة 50%." : "Official metrics show growth slowed, not an absolute 50% deflation.");
  const reportUrl = item.config?.reportUrl || "";

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
            {isRtl ? "حكم التحقق (النتيجة)" : "Verdict Rating"}
          </label>
          <select
            value={verdict}
            onChange={(e) => onChange({ config: { ...item.config, verdict: e.target.value } })}
            className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-xs text-[#2c3338]"
          >
            <option value="true">{isRtl ? "صحيح ومؤكد (أخضر)" : "True / Verified (Green)"}</option>
            <option value="mostly_true">{isRtl ? "صحيح جزئياً (أزرق)" : "Mostly True (Blue)"}</option>
            <option value="misleading">{isRtl ? "مضلل / غير دقيق (برتقالي)" : "Misleading (Amber)"}</option>
            <option value="false">{isRtl ? "زائف / غير صحيح (أحمر)" : "False / Inaccurate (Red)"}</option>
          </select>
        </div>
        <div>
          <label className="block text-[0.6875rem] font-medium text-[#50575e] mb-1">
            {isRtl ? "مصدر الادعاء / القائل" : "Claimant / Speaker"}
          </label>
          <input
            type="text"
            value={claimant}
            placeholder={isRtl ? "مثال: تصريح تلفزيوني" : "e.g. Press conference"}
            onChange={(e) => onChange({ config: { ...item.config, claimant: e.target.value } })}
            className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-xs text-[#2c3338]"
          />
        </div>
      </div>

      <div>
        <label className="block text-[0.6875rem] font-medium text-[#50575e] mb-1">
          {isRtl ? "نص الادعاء المرصود (Claim)" : "Claim Statement"}
        </label>
        <textarea
          rows={2}
          value={claim}
          onChange={(e) => onChange({ config: { ...item.config, claim: e.target.value } })}
          className="w-full rounded-[3px] border border-[#8c8f94] bg-white p-2 text-[0.75rem] text-[#2c3338]"
        />
      </div>

      <div>
        <label className="block text-[0.6875rem] font-medium text-[#50575e] mb-1">
          {isRtl ? "خلاصة نتيجة التحقق والحقائق" : "Verdict Explanation & Facts"}
        </label>
        <textarea
          rows={3}
          value={explanation}
          onChange={(e) => {
            onChange({
              content: e.target.value,
              config: { ...item.config, explanation: e.target.value },
            });
          }}
          className="w-full rounded-[3px] border border-[#8c8f94] bg-white p-2 text-[0.75rem] text-[#2c3338]"
        />
      </div>

      <div>
        <label className="block text-[0.6875rem] font-medium text-[#50575e] mb-1">
          {isRtl ? "رابط تقرير التحقق الكامل (اختياري)" : "Full Fact-Check Report URL"}
        </label>
        <input
          type="text"
          value={reportUrl}
          placeholder="/fact-checks/..."
          onChange={(e) => onChange({ config: { ...item.config, reportUrl: e.target.value } })}
          className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-xs text-[#2c3338]"
        />
      </div>
    </div>
  );
}

export function FactCheckRender({ item, theme }: WidgetRenderProps) {
  const isRtl = theme?.direction === "rtl";
  const claim = item.config?.claim || (isRtl ? "تراجع معدلات التضخم بنسبة 50% خلال الربع الأخير" : "Inflation dropped 50% in the last quarter");
  const claimant = item.config?.claimant || (isRtl ? "تصريح متداول" : "Viral claim");
  const verdict = item.config?.verdict || "misleading";
  const explanation = item.content || item.config?.explanation || (isRtl ? "البيانات الرسمية توضح تباطؤ وتيرة التضخم وليس انخفاض الأسعار بنسبة 50%." : "Official metrics show growth slowed, not an absolute 50% deflation.");
  const reportUrl = item.config?.reportUrl;

  const verdictMeta = {
    true: {
      label: isRtl ? "صحيح" : "TRUE",
      color: "bg-theme-success text-white",
      icon: CheckCircle2,
    },
    mostly_true: {
      label: isRtl ? "صحيح جزئياً" : "MOSTLY TRUE",
      color: "bg-theme-primary text-theme-on-primary",
      icon: HelpCircle,
    },
    misleading: {
      label: isRtl ? "مضلل" : "MISLEADING",
      color: "bg-theme-warning text-white",
      icon: AlertTriangle,
    },
    false: {
      label: isRtl ? "غير صحيح / زائف" : "FALSE",
      color: "bg-theme-danger text-white",
      icon: XCircle,
    },
  }[verdict as "true" | "mostly_true" | "misleading" | "false"] || {
    label: isRtl ? "مضلل" : "MISLEADING",
    color: "bg-theme-warning text-white",
    icon: AlertTriangle,
  };

  const VerdictIcon = verdictMeta.icon;

  return (
    <div className="theme-widget rounded-xl border border-[var(--theme-widget-border,var(--theme-border))] bg-[var(--theme-widget-bg,var(--theme-surface))] text-[var(--theme-widget-text,var(--theme-text))] p-4 shadow-sm text-start">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--theme-border)]">
        <span className="theme-widget-title text-[0.625rem] font-bold uppercase tracking-wider text-[var(--theme-widget-title-color,var(--theme-heading))]">
          {item.title || t("site.fact_check", theme, "Fact Check Desk")}
        </span>
        <span className={`rounded ${verdictMeta.color} font-black text-[0.5625rem] px-2 py-0.5 flex items-center gap-1`}>
          <VerdictIcon className="size-3" />
          {verdictMeta.label}
        </span>
      </div>

      <div className="bg-[var(--theme-bg)] rounded-lg p-2.5 border border-[var(--theme-border)] mb-2">
        <span className="text-[0.625rem] text-[var(--theme-muted)] block font-medium">
          {isRtl ? `الادعاء (${claimant}):` : `Claim (${claimant}):`}
        </span>
        <p className="text-xs font-serif font-bold text-[var(--theme-heading)] mt-0.5 line-clamp-2">
          &ldquo;{claim}&rdquo;
        </p>
      </div>

      <p className="text-[0.6875rem] text-[var(--theme-muted)] leading-relaxed mb-2">
        {explanation}
      </p>

      {reportUrl && (
        <div className="pt-2 border-t border-[var(--theme-border)] flex justify-end">
          <Link
            href={reportUrl}
            className="text-[0.6875rem] font-bold text-[var(--theme-primary)] hover:underline inline-flex items-center gap-1"
          >
            <span>{isRtl ? "قراءة التحقيق الكامل" : "Read investigation"}</span>
            <ArrowUpRight className="size-3" />
          </Link>
        </div>
      )}
    </div>
  );
}

export const factCheckWidgetModule: WidgetModule = {
  manifest: manifest as any,
  AdminForm: FactCheckAdminForm,
  render: FactCheckRender,
};

export default factCheckWidgetModule;
