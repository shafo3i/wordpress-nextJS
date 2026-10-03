"use client";

import React, { useState } from "react";
import { Mail, CheckCircle2, Sparkles, Loader2 } from "lucide-react";
import manifest from "./widget.json";
import type { WidgetModule, WidgetAdminFormProps, WidgetRenderProps } from "../types";
import { t } from "@/components/site/utils";

export function NewsletterAdminForm({ item, onChange, dict, direction }: WidgetAdminFormProps) {
  const isRtl = direction === "rtl";
  const heading = item.config?.heading || (isRtl ? "نشرة الموجز اليومي" : "Daily Morning Briefing");
  const description = item.content || item.config?.description || (isRtl ? "انضم لأكثر من 50,000 قارئ واحصل على أبرز الأخبار والتحليلات مباشرة في بريدك." : "Join 50,000+ informed readers receiving curated investigative analysis.");
  const buttonText = item.config?.buttonText || (isRtl ? "اشتراك مجاني" : "Subscribe Free");
  const privacyNote = item.config?.privacyNote || (isRtl ? "نحترم خصوصيتك، بدون أي رسائل مزعجة." : "No spam. Unsubscribe anytime with one click.");
  const actionUrl = item.config?.actionUrl || "";

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
        <label className="block text-[11px] font-medium text-[#50575e] mb-1">
          {isRtl ? "العنوان الترويجي الرئيسي" : "Headline Pitch"}
        </label>
        <input
          type="text"
          value={heading}
          placeholder={isRtl ? "نشرة الصباح الإخبارية" : "Morning Intelligence"}
          onChange={(e) => onChange({ config: { ...item.config, heading: e.target.value } })}
          className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-xs text-[#2c3338]"
        />
      </div>

      <div>
        <label className="block text-[11px] font-medium text-[#50575e] mb-1">
          {isRtl ? "الوصف ودعوة الاشتراك" : "Description & Value Proposition"}
        </label>
        <textarea
          rows={3}
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

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[11px] font-medium text-[#50575e] mb-1">
            {isRtl ? "نص زر الإرسال" : "Button Text"}
          </label>
          <input
            type="text"
            value={buttonText}
            placeholder={isRtl ? "اشتراك" : "Subscribe"}
            onChange={(e) => onChange({ config: { ...item.config, buttonText: e.target.value } })}
            className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-xs text-[#2c3338]"
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-[#50575e] mb-1">
            {isRtl ? "رابط نقطة الاشتراك (API / Webhook)" : "Action / Webhook URL"}
          </label>
          <input
            type="text"
            value={actionUrl}
            placeholder="/api/newsletter/subscribe"
            onChange={(e) => onChange({ config: { ...item.config, actionUrl: e.target.value } })}
            className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-xs text-[#2c3338]"
          />
        </div>
      </div>

      <div>
        <label className="block text-[11px] font-medium text-[#50575e] mb-1">
          {isRtl ? "ملاحظة الخصوصية" : "Privacy Note"}
        </label>
        <input
          type="text"
          value={privacyNote}
          onChange={(e) => onChange({ config: { ...item.config, privacyNote: e.target.value } })}
          className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-xs text-[#2c3338]"
        />
      </div>
    </div>
  );
}

export function NewsletterRender({ item, theme }: WidgetRenderProps) {
  const isRtl = theme?.direction === "rtl";
  const heading = item.config?.heading || item.title || (isRtl ? "نشرة الموجز اليومي" : "Daily Morning Briefing");
  const description = item.content || item.config?.description || (isRtl ? "انضم لأكثر من 50,000 قارئ واحصل على أبرز الأخبار والتحليلات مباشرة في بريدك." : "Receive curated investigative reporting directly in your inbox.");
  const buttonText = item.config?.buttonText || t("site.subscribe", theme, "Subscribe");
  const privacyNote = item.config?.privacyNote || (isRtl ? "نحترم خصوصيتك، بدون أي رسائل مزعجة." : "No spam. Unsubscribe anytime.");
  const actionUrl = item.config?.actionUrl || "/api/newsletter/subscribe";

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setError(isRtl ? "يرجى إدخال بريد إلكتروني صالح" : "Please enter a valid email address");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(actionUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "sidebar_widget" }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSubscribed(true);
      } else {
        setError(data.error || (isRtl ? "فشل الاشتراك. يرجى المحاولة لاحقاً." : "Subscription failed. Please try again."));
      }
    } catch (err: any) {
      setError(isRtl ? "حدث خطأ في الاتصال. يرجى المحاولة لاحقاً." : "Network connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="theme-widget rounded-xl border border-[var(--theme-widget-border,var(--theme-border,#e2e8f0))] bg-[var(--theme-widget-bg,var(--theme-surface,#ffffff))] text-[var(--theme-widget-text,var(--theme-text,#1d2327))] p-4 shadow-sm text-start">
      <div className="flex items-center gap-1.5 text-[var(--theme-primary,#2271b1)] text-xs font-bold uppercase tracking-wider mb-1.5">
        <Sparkles className="size-3.5" />
        <span className="theme-widget-title text-[var(--theme-widget-title-color,var(--theme-heading,#0f172a))]">
          {item.title || t("site.newsletter", theme, "Newsletter")}
        </span>
      </div>

      <h4 className="text-sm font-bold font-serif text-[var(--theme-heading,#0f172a)] leading-snug mb-1">
        {heading}
      </h4>

      <p className="text-xs text-[var(--theme-muted,#64748b)] leading-relaxed mb-3">
        {description}
      </p>

      {subscribed ? (
        <div className="flex items-center gap-2 rounded-lg bg-[#00a32a]/10 border border-[#00a32a]/20 p-3 text-xs font-semibold text-[#00a32a]">
          <CheckCircle2 className="size-4 text-[#00a32a] flex-shrink-0" />
          <span>{t("site.subscribe_success", theme, "Subscribed successfully! Check your inbox.")}</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="relative">
            <Mail className="size-4 text-[var(--theme-muted,#64748b)] opacity-60 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={isRtl ? "أدخل بريدك الإلكتروني..." : "Enter your email address..."}
              className="h-9 w-full rounded-lg border border-[var(--theme-border,#e2e8f0)] bg-[var(--theme-surface,#ffffff)] ps-9 pe-3 text-xs text-[var(--theme-text,#1d2327)] placeholder:opacity-60 focus:border-[var(--theme-primary,#2271b1)] focus:outline-none"
            />
          </div>

          {error && <span className="text-[10px] text-[#d63638] block">{error}</span>}

          <button
            type="submit"
            disabled={loading}
            style={{ backgroundColor: theme?.primaryColor || "var(--theme-primary, #2271b1)" }}
            className="w-full h-9 rounded-lg text-white text-xs font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {loading ? <Loader2 className="size-3.5 animate-spin" /> : buttonText}
          </button>

          <span className="text-[10px] text-[var(--theme-muted,#64748b)] opacity-70 block text-center mt-1">
            {privacyNote}
          </span>
        </form>
      )}
    </div>
  );
}

export const newsletterWidgetModule: WidgetModule = {
  manifest: manifest as any,
  AdminForm: NewsletterAdminForm,
  render: NewsletterRender,
};

export default newsletterWidgetModule;
