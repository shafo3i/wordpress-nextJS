"use client";

import React from "react";
import manifest from "./widget.json";
import type { WidgetModule, WidgetAdminFormProps, WidgetRenderProps } from "../types";

export function AdManagerAdminForm({ item, onChange, dict, direction }: WidgetAdminFormProps) {
  const isRtl = direction === "rtl";
  const adType = item.config?.adType || "banner";
  const imageUrl = item.config?.imageUrl || "";
  const targetUrl = item.config?.targetUrl || "";
  const sponsorName = item.config?.sponsorName || (isRtl ? "شريك المنصة" : "Official Partner");
  const openNewTab = item.config?.openNewTab !== false;
  const relSponsored = item.config?.relSponsored !== false;
  const rawHtml = item.content || "";

  return (
    <div className="space-y-3 text-start">
      <div>
        <label className="block text-[12px] font-medium text-[#50575e] mb-1">
          {dict?.["admin.widgets.widget_title"] || (isRtl ? "عنوان الأداة (اختياري)" : "Widget Title (Optional)")}
        </label>
        <input
          type="text"
          value={item.title}
          placeholder={isRtl ? "مساحة إعلانية" : "Sponsored Placement"}
          onChange={(e) => onChange({ title: e.target.value })}
          className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-[11px] font-medium text-[#50575e] mb-1">
          {isRtl ? "نوع الإعلان" : "Advertisement Format"}
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onChange({ config: { ...item.config, adType: "banner" } })}
            className={`p-2 rounded border text-xs font-semibold text-center transition-all ${
              adType === "banner"
                ? "border-[#2271b1] bg-[#f0f6fc] text-[#2271b1] ring-1 ring-[#2271b1]"
                : "border-[#dcdcde] bg-white text-[#2c3338]"
            }`}
          >
            🖼️ {isRtl ? "بانر صورة ورابط" : "Image Banner & Link"}
          </button>
          <button
            type="button"
            onClick={() => onChange({ config: { ...item.config, adType: "code" } })}
            className={`p-2 rounded border text-xs font-semibold text-center transition-all ${
              adType === "code"
                ? "border-[#2271b1] bg-[#f0f6fc] text-[#2271b1] ring-1 ring-[#2271b1]"
                : "border-[#dcdcde] bg-white text-[#2c3338]"
            }`}
          >
            &lt;/&gt; {isRtl ? "كود AdSense / HTML" : "HTML / AdSense Embed"}
          </button>
        </div>
      </div>

      {adType === "banner" ? (
        <div className="space-y-2 pt-2 border-t border-[#f0f0f1]">
          <div>
            <label className="block text-[11px] font-medium text-[#50575e] mb-1">
              {isRtl ? "رابط صورة البانر (Image URL)" : "Banner Image URL"}
            </label>
            <input
              type="url"
              value={imageUrl}
              placeholder="https://example.com/banners/sponsor-300x250.jpg"
              onChange={(e) => onChange({ config: { ...item.config, imageUrl: e.target.value } })}
              className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-xs text-[#2c3338]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[#50575e] mb-1">
              {isRtl ? "رابط الوجهة المقصودة عند النقر (Target URL)" : "Destination Click URL"}
            </label>
            <input
              type="url"
              value={targetUrl}
              placeholder="https://sponsor.com/landing-page"
              onChange={(e) => onChange({ config: { ...item.config, targetUrl: e.target.value } })}
              className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-xs text-[#2c3338]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[#50575e] mb-1">
              {isRtl ? "اسم المعلن / النص البديل" : "Sponsor Name / Alt Text"}
            </label>
            <input
              type="text"
              value={sponsorName}
              placeholder="e.g. Acme Tech Solutions"
              onChange={(e) => onChange({ config: { ...item.config, sponsorName: e.target.value } })}
              className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-xs text-[#2c3338]"
            />
          </div>

          <div className="flex flex-col gap-1.5 pt-1">
            <label className="flex items-center gap-2 text-xs text-[#2c3338] cursor-pointer">
              <input
                type="checkbox"
                checked={openNewTab}
                onChange={(e) => onChange({ config: { ...item.config, openNewTab: e.target.checked } })}
                className="rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
              />
              <span>{isRtl ? "فتح الرابط في نافذة جديدة (target='_blank')" : "Open link in a new window"}</span>
            </label>
            <label className="flex items-center gap-2 text-xs text-[#2c3338] cursor-pointer">
              <input
                type="checkbox"
                checked={relSponsored}
                onChange={(e) => onChange({ config: { ...item.config, relSponsored: e.target.checked } })}
                className="rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
              />
              <span>{isRtl ? "إضافة وسم SEO الإعلاني (rel='sponsored nofollow')" : "Add SEO rel='sponsored nofollow' tag"}</span>
            </label>
          </div>
        </div>
      ) : (
        <div className="space-y-2 pt-2 border-t border-[#f0f0f1]">
          <div>
            <label className="block text-[11px] font-medium text-[#50575e] mb-1">
              {isRtl ? "كود التضمين أو برمجية الإعلان" : "Ad Code or Embed Script"}
            </label>
            <textarea
              rows={4}
              value={rawHtml}
              placeholder="<!-- Google AdSense or HTML banner code -->"
              onChange={(e) => onChange({ content: e.target.value })}
              className="w-full rounded-[3px] border border-[#8c8f94] bg-white p-2 font-mono text-[11px] text-[#2c3338]"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function AdManagerRender({ item, theme }: WidgetRenderProps) {
  const isRtl = theme?.direction === "rtl";
  const adType = item.config?.adType || "banner";
  const imageUrl = item.config?.imageUrl;
  const targetUrl = item.config?.targetUrl || "#";
  const sponsorName = item.config?.sponsorName || (isRtl ? "شريك إعلاني" : "Official Partner");
  const openNewTab = item.config?.openNewTab !== false;
  const relSponsored = item.config?.relSponsored !== false;
  const rawHtml = item.content;

  const relAttribute = [
    relSponsored ? "sponsored" : null,
    relSponsored ? "nofollow" : null,
    openNewTab ? "noopener noreferrer" : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="theme-widget rounded-xl border border-[var(--theme-widget-border,var(--theme-border,#e2e8f0))] bg-[var(--theme-widget-bg,var(--theme-surface,#ffffff))] text-[var(--theme-widget-text,var(--theme-text,#1d2327))] p-3 shadow-sm text-center overflow-hidden">
      <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-[var(--theme-border,#e2e8f0)]">
        <span className="text-[9px] uppercase tracking-widest text-[var(--theme-muted,#64748b)] font-mono">
          {isRtl ? "إعلان ممول" : "Advertisement"}
        </span>
        <span className="text-[9px] text-[var(--theme-muted,#64748b)] font-medium">
          {sponsorName}
        </span>
      </div>

      {adType === "banner" && imageUrl ? (
        <a
          href={targetUrl}
          target={openNewTab ? "_blank" : "_self"}
          rel={relAttribute}
          className="block group overflow-hidden rounded-lg transition-transform hover:scale-[1.01]"
        >
          <img
            src={imageUrl}
            alt={sponsorName}
            className="w-full h-auto object-cover rounded-lg shadow-sm max-h-[300px]"
            loading="lazy"
          />
        </a>
      ) : adType === "banner" ? (
        <div className="p-6 border border-dashed border-[var(--theme-border,#e2e8f0)] rounded-lg bg-[var(--theme-bg,#f8f7f4)] text-center">
          <span className="text-xl mb-1 block">📢</span>
          <h5 className="theme-widget-title text-xs font-bold text-[var(--theme-widget-title-color,var(--theme-heading,#0f172a))] mb-0.5">
            {item.title || (isRtl ? "مساحة إعلانية شاغرة" : "Sponsor Slot")}
          </h5>
          <p className="text-[10px] text-[var(--theme-muted,#64748b)]">
            {isRtl ? "تواصل معنا لحجز هذا الموقع الإعلاني" : "Contact our sales desk to feature your campaign"}
          </p>
        </div>
      ) : (
        <div
          className="text-xs text-[var(--theme-text,#1d2327)] font-medium leading-relaxed overflow-hidden"
          dangerouslySetInnerHTML={{
            __html: rawHtml || '<div class="p-4 text-xs text-[var(--theme-muted,#64748b)]">No ad code configured.</div>',
          }}
        />
      )}
    </div>
  );
}

export const adManagerWidgetModule: WidgetModule = {
  manifest: manifest as any,
  AdminForm: AdManagerAdminForm,
  render: AdManagerRender,
};

export default adManagerWidgetModule;
