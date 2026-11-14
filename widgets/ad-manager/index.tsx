"use client";
import { safeMediaUrl } from "@/lib/post-media";
import { sanitizePluginMarkup } from "@/lib/plugins/markup";
import { ContentImage } from "@/components/site/content-image";


import React from "react";
import manifest from "./widget.json";
import type { WidgetModule, WidgetAdminFormProps, WidgetRenderProps, WidgetManifest } from "../types";

export function AdManagerAdminForm({ item, onChange, dict }: WidgetAdminFormProps) {

  const adType = item.config?.adType || "banner";
  const imageUrl = item.config?.imageUrl || "";
  const targetUrl = item.config?.targetUrl || "";
  const sponsorName = item.config?.sponsorName || "";
  const openNewTab = item.config?.openNewTab !== false;
  const relSponsored = item.config?.relSponsored !== false;
  const rawHtml = item.content || "";

  return (
    <div className="space-y-3 text-start">
      <div>
        <label className="block text-[0.75rem] font-medium text-[#50575e] mb-1">
          {dict?.["admin.widgets.widget_title"] || (dict?.["admin.widgets.ad.widget_title_optional"] || "")}
        </label>
        <input
          type="text"
          value={item.title}
          placeholder={dict?.["admin.widgets.ad.sponsored_placement"] || ""}
          onChange={(e) => onChange({ title: e.target.value })}
          className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[0.8125rem] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-[0.6875rem] font-medium text-[#50575e] mb-1">
          {dict?.["admin.widgets.ad.advertisement_format"] || ""}
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
            🖼️ {dict?.["admin.widgets.ad.image_banner_link"] || ""}
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
            &lt;/&gt; {dict?.["admin.widgets.ad.html_adsense_embed"] || ""}
          </button>
        </div>
      </div>

      {adType === "banner" ? (
        <div className="space-y-2 pt-2 border-t border-[#f0f0f1]">
          <div>
            <label className="block text-[0.6875rem] font-medium text-[#50575e] mb-1">
              {dict?.["admin.widgets.ad.banner_image_url"] || ""}
            </label>
            <input
              type="url"
              value={imageUrl}
              placeholder={dict?.["admin.widgets.ad.image_placeholder"] || ""}
              onChange={(e) => onChange({ config: { ...item.config, imageUrl: e.target.value } })}
              className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-xs text-[#2c3338]"
            />
          </div>

          <div>
            <label className="block text-[0.6875rem] font-medium text-[#50575e] mb-1">
              {dict?.["admin.widgets.ad.destination_click_url"] || ""}
            </label>
            <input
              type="url"
              value={targetUrl}
              placeholder={dict?.["admin.widgets.ad.target_placeholder"] || ""}
              onChange={(e) => onChange({ config: { ...item.config, targetUrl: e.target.value } })}
              className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-xs text-[#2c3338]"
            />
          </div>

          <div>
            <label className="block text-[0.6875rem] font-medium text-[#50575e] mb-1">
              {dict?.["admin.widgets.ad.sponsor_name_alt_text"] || ""}
            </label>
            <input
              type="text"
              value={sponsorName}
              placeholder={dict?.["admin.widgets.ad.sponsor_placeholder"] || ""}
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
              <span>{dict?.["admin.widgets.ad.open_link_in_a_new_window"] || ""}</span>
            </label>
            <label className="flex items-center gap-2 text-xs text-[#2c3338] cursor-pointer">
              <input
                type="checkbox"
                checked={relSponsored}
                onChange={(e) => onChange({ config: { ...item.config, relSponsored: e.target.checked } })}
                className="rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
              />
              <span>{dict?.["admin.widgets.ad.add_seo_rel_sponsored_nofollow_tag"] || ""}</span>
            </label>
          </div>
        </div>
      ) : (
        <div className="space-y-2 pt-2 border-t border-[#f0f0f1]">
          <div>
            <label className="block text-[0.6875rem] font-medium text-[#50575e] mb-1">
              {dict?.["admin.widgets.ad.ad_code_or_embed_script"] || ""}
            </label>
            <textarea
              rows={4}
              value={rawHtml}
              placeholder={dict?.["admin.widgets.safe_html_placeholder"] || ""}
              onChange={(e) => onChange({ content: e.target.value })}
              className="w-full rounded-[3px] border border-[#8c8f94] bg-white p-2 font-mono text-[0.6875rem] text-[#2c3338]"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function AdManagerRender({ item, theme }: WidgetRenderProps) {

  const adType = item.config?.adType || "banner";
  const imageUrl = typeof item.config?.imageUrl === "string" ? safeMediaUrl(item.config.imageUrl) : null;
  const rawHtml = item.content;

  if (adType === "banner" && !imageUrl) {
    return null;
  }
  if (adType !== "banner" && !rawHtml?.trim()) {
    return null;
  }

  const targetUrl = typeof item.config?.targetUrl === "string" ? safeMediaUrl(item.config.targetUrl) || "#" : "#";
  const sponsorName = item.config?.sponsorName || "";
  const openNewTab = item.config?.openNewTab !== false;
  const relSponsored = item.config?.relSponsored !== false;

  const relAttribute = [
    relSponsored ? "sponsored" : null,
    relSponsored ? "nofollow" : null,
    openNewTab ? "noopener noreferrer" : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="theme-widget rounded-xl border border-[var(--theme-widget-border,var(--theme-border))] bg-[var(--theme-widget-bg,var(--theme-surface))] text-[var(--theme-widget-text,var(--theme-text))] p-3 shadow-sm text-center overflow-hidden">
      <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-[var(--theme-border)]">
        <span className="text-[0.5625rem] uppercase tracking-widest text-[var(--theme-muted)] font-mono">
          {theme?.dict?.["admin.widgets.ad.advertisement"] || ""}
        </span>
        <span className="text-[0.5625rem] text-[var(--theme-muted)] font-medium">
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
          <ContentImage
            src={imageUrl}
            alt={sponsorName}
            className="w-full h-auto object-cover rounded-lg shadow-sm max-h-[300px]"
            loading="lazy"
          />
        </a>
      ) : (
        <div
          className="text-xs text-[var(--theme-text)] font-medium leading-relaxed overflow-hidden"
          dangerouslySetInnerHTML={{
            __html: sanitizePluginMarkup(rawHtml || ""),
          }}
        />
      )}
    </div>
  );
}

export const adManagerWidgetModule: WidgetModule = {
  manifest: manifest as WidgetManifest,
  AdminForm: AdManagerAdminForm,
  render: AdManagerRender,
};

export default adManagerWidgetModule;
