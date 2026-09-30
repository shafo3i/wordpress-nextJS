"use client";

import { useState, useTransition } from "react";
import { saveSettingsAction } from "../action";
import type { SettingsMap } from "@/services/settings.service";
import { Globe, Search, Share2, BarChart2, CheckCircle2, AlertCircle } from "lucide-react";

export function SettingsForm({
  initialSettings,
  dict = {},
  direction = "ltr",
}: {
  initialSettings: SettingsMap;
  dict?: Record<string, string>;
  direction?: "rtl" | "ltr";
}) {
  const [activeTab, setActiveTab] = useState<"general" | "seo" | "social" | "analytics">("general");
  const [settings, setSettings] = useState<SettingsMap>(initialSettings);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleCheckboxToggle = (key: string, checkedValue = "1", uncheckedValue = "0") => {
    setSettings((prev) => ({
      ...prev,
      [key]: prev[key] === checkedValue ? uncheckedValue : checkedValue,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);

    startTransition(async () => {
      const res = await saveSettingsAction(settings);
      if (res.success) {
        setNotice({
          type: "success",
          message: dict["admin.settings.saved_notice"] || res.message || "Settings saved successfully.",
        });
      } else {
        setNotice({
          type: "error",
          message: res.error || "Failed to save settings.",
        });
      }
    });
  };

  const tabs = [
    {
      id: "general" as const,
      label: dict["admin.settings.tab_general"] || "General",
      icon: Globe,
    },
    {
      id: "seo" as const,
      label: dict["admin.settings.tab_seo"] || "SEO & Indexing",
      icon: Search,
    },
    {
      id: "social" as const,
      label: dict["admin.settings.tab_social"] || "Social & Open Graph",
      icon: Share2,
    },
    {
      id: "analytics" as const,
      label: dict["admin.settings.tab_analytics"] || "Analytics & Scripts",
      icon: BarChart2,
    },
  ];

  return (
    <div className="space-y-4 text-start" dir={direction}>
      {notice && (
        <div
          className={`flex items-center justify-between rounded-[3px] border-s-4 p-3 text-[13px] ${
            notice.type === "success"
              ? "border-[#00a32a] bg-[#f0f6fc] text-[#1d2327]"
              : "border-[#d63638] bg-[#fcf0f1] text-[#1d2327]"
          }`}
        >
          <div className="flex items-center gap-2">
            {notice.type === "success" ? (
              <CheckCircle2 className="size-4 text-[#00a32a]" />
            ) : (
              <AlertCircle className="size-4 text-[#d63638]" />
            )}
            <span>{notice.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-[16px] leading-none text-[#787c82] hover:text-[#d63638]"
          >
            ×
          </button>
        </div>
      )}

      {/* Tabs Header */}
      <div className="flex border-b border-[#c3c4c7] text-[13px]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 font-medium transition-colors ${
                isActive
                  ? "-mb-[1px] border-x border-t border-[#c3c4c7] bg-white text-[#1d2327]"
                  : "text-[#2271b1] hover:bg-[#f6f7f7] hover:text-[#135e96]"
              }`}
            >
              <Icon className="size-4 text-[#50575e]" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="rounded-[3px] border border-[#c3c4c7] bg-white p-6 shadow-[0_1px_1px_rgba(0,0,0,0.04)]">
        {/* ========================================================================= */}
        {/* TAB 1: GENERAL */}
        {/* ========================================================================= */}
        {activeTab === "general" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-[16px] font-semibold text-[#1d2327]">
                {dict["admin.settings.general_heading"] || "General Site Settings"}
              </h2>
              <p className="text-[12px] text-[#646970]">
                {dict["admin.settings.general_desc"] || "Core site identity and localization configurations."}
              </p>
            </div>

            <div className="space-y-4">
              {/* Site Title */}
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[220px_1fr]">
                <label htmlFor="blogname" className="text-[13px] font-semibold text-[#1d2327]">
                  {dict["admin.settings.site_title"] || "Site Title"}
                </label>
                <div>
                  <input
                    id="blogname"
                    type="text"
                    value={settings.blogname ?? ""}
                    onChange={(e) => handleChange("blogname", e.target.value)}
                    className="h-[32px] w-full max-w-md rounded-[3px] border border-[#8c8f94] bg-white px-2.5 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
                  />
                  <p className="mt-1 text-[11px] text-[#646970]">
                    {dict["admin.settings.site_title_desc"] || "Synchronized with Appearance > Customize > Site Identity."}
                  </p>
                </div>
              </div>

              {/* Tagline */}
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[220px_1fr]">
                <label htmlFor="blogdescription" className="text-[13px] font-semibold text-[#1d2327]">
                  {dict["admin.settings.tagline"] || "Tagline"}
                </label>
                <div>
                  <input
                    id="blogdescription"
                    type="text"
                    value={settings.blogdescription ?? ""}
                    onChange={(e) => handleChange("blogdescription", e.target.value)}
                    className="h-[32px] w-full max-w-md rounded-[3px] border border-[#8c8f94] bg-white px-2.5 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
                  />
                  <p className="mt-1 text-[11px] text-[#646970]">
                    {dict["admin.settings.tagline_desc"] || "In a few words, explain what this site is about."}
                  </p>
                </div>
              </div>

              {/* Admin Email */}
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[220px_1fr]">
                <label htmlFor="admin_email" className="text-[13px] font-semibold text-[#1d2327]">
                  {dict["admin.settings.admin_email"] || "Administration Email Address"}
                </label>
                <div>
                  <input
                    id="admin_email"
                    type="email"
                    value={settings.admin_email ?? ""}
                    onChange={(e) => handleChange("admin_email", e.target.value)}
                    className="h-[32px] w-full max-w-md rounded-[3px] border border-[#8c8f94] bg-white px-2.5 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
                  />
                  <p className="mt-1 text-[11px] text-[#646970]">
                    {dict["admin.settings.admin_email_desc"] || "This address is used for admin notifications."}
                  </p>
                </div>
              </div>

              {/* Site URL */}
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[220px_1fr]">
                <label htmlFor="siteurl" className="text-[13px] font-semibold text-[#1d2327]">
                  {dict["admin.settings.site_url"] || "Site Address (URL)"}
                </label>
                <div>
                  <input
                    id="siteurl"
                    type="url"
                    value={settings.siteurl ?? ""}
                    onChange={(e) => handleChange("siteurl", e.target.value)}
                    className="h-[32px] w-full max-w-md rounded-[3px] border border-[#8c8f94] bg-white px-2.5 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
                  />
                </div>
              </div>

              {/* Timezone */}
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[220px_1fr]">
                <label htmlFor="timezone_string" className="text-[13px] font-semibold text-[#1d2327]">
                  {dict["admin.settings.timezone"] || "Timezone"}
                </label>
                <div>
                  <select
                    id="timezone_string"
                    value={settings.timezone_string ?? "UTC"}
                    onChange={(e) => handleChange("timezone_string", e.target.value)}
                    className="h-[32px] w-full max-w-xs rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
                  >
                    <option value="UTC">UTC (Coordinated Universal Time)</option>
                    <option value="Africa/Cairo">Africa/Cairo (UTC+2)</option>
                    <option value="Asia/Riyadh">Asia/Riyadh (UTC+3)</option>
                    <option value="Asia/Dubai">Asia/Dubai (UTC+4)</option>
                    <option value="Europe/London">Europe/London (UTC+0 / BST)</option>
                    <option value="America/New_York">America/New_York (UTC-5)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: SEO & INDEXING */}
        {/* ========================================================================= */}
        {activeTab === "seo" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-[16px] font-semibold text-[#1d2327]">
                {dict["admin.settings.seo_heading"] || "Search Engine Optimization (SEO)"}
              </h2>
              <p className="text-[12px] text-[#646970]">
                {dict["admin.settings.seo_desc"] || "Control indexing visibility, title formats, and crawler meta tags."}
              </p>
            </div>

            <div className="space-y-5">
              {/* Search Engine Visibility (blog_public) */}
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[220px_1fr]">
                <span className="text-[13px] font-semibold text-[#1d2327]">
                  {dict["admin.settings.visibility"] || "Search Engine Visibility"}
                </span>
                <div>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.blog_public === "0"}
                      onChange={() => handleCheckboxToggle("blog_public", "0", "1")}
                      className="mt-0.5 h-4 w-4 rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
                    />
                    <div>
                      <span className="text-[13px] font-medium text-[#1d2327]">
                        {dict["admin.settings.discourage_search_engines"] || "Discourage search engines from indexing this site"}
                      </span>
                      <p className="text-[11px] text-[#646970]">
                        {dict["admin.settings.discourage_help"] || "When checked, sends a 'noindex, nofollow' header & meta tag to search engines. Essential while developing or testing."}
                      </p>
                    </div>
                  </label>
                  {settings.blog_public === "0" && (
                    <div className="mt-2 inline-block rounded bg-[#fcf0f1] px-2.5 py-1 text-[11px] font-semibold text-[#d63638] border border-[#d63638]/20">
                      ⚠️ {dict["admin.settings.indexing_blocked_warning"] || "Site is currently hidden from search engines (noindex mode active)."}
                    </div>
                  )}
                </div>
              </div>

              {/* Title Template */}
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[220px_1fr]">
                <label htmlFor="seo_meta_title_template" className="text-[13px] font-semibold text-[#1d2327]">
                  {dict["admin.settings.title_template"] || "SEO Title Format"}
                </label>
                <div>
                  <input
                    id="seo_meta_title_template"
                    type="text"
                    value={settings.seo_meta_title_template ?? "%title% — %sitename%"}
                    onChange={(e) => handleChange("seo_meta_title_template", e.target.value)}
                    className="h-[32px] w-full max-w-md rounded-[3px] border border-[#8c8f94] bg-white px-2.5 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
                  />
                  <p className="mt-1 text-[11px] text-[#646970]">
                    {dict["admin.settings.title_template_desc"] || "Available variables: %title%, %sitename%, %tagline%."}
                  </p>
                </div>
              </div>

              {/* Default Meta Description */}
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[220px_1fr]">
                <label htmlFor="seo_default_meta_description" className="text-[13px] font-semibold text-[#1d2327]">
                  {dict["admin.settings.default_meta_desc"] || "Default Meta Description"}
                </label>
                <div>
                  <textarea
                    id="seo_default_meta_description"
                    rows={3}
                    value={settings.seo_default_meta_description ?? ""}
                    onChange={(e) => handleChange("seo_default_meta_description", e.target.value)}
                    className="w-full max-w-xl rounded-[3px] border border-[#8c8f94] bg-white p-2.5 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
                    placeholder="Enter default snippet description for homepage and archives..."
                  />
                  <p className="mt-1 text-[11px] text-[#646970]">
                    {dict["admin.settings.default_meta_desc_help"] || "Used as the search snippet for the homepage and any posts that do not provide an excerpt."}
                  </p>
                </div>
              </div>

              {/* Canonical URLs */}
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[220px_1fr]">
                <span className="text-[13px] font-semibold text-[#1d2327]">
                  {dict["admin.settings.canonical"] || "Canonical URLs"}
                </span>
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.seo_canonical_enabled === "1"}
                      onChange={() => handleCheckboxToggle("seo_canonical_enabled", "1", "0")}
                      className="h-4 w-4 rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
                    />
                    <span className="text-[13px] text-[#1d2327]">
                      {dict["admin.settings.canonical_enable"] || "Automatically generate <link rel='canonical'> tags on all pages"}
                    </span>
                  </label>
                </div>
              </div>

              {/* Robots Directives */}
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[220px_1fr]">
                <label htmlFor="seo_robots_extra" className="text-[13px] font-semibold text-[#1d2327]">
                  {dict["admin.settings.robots_directives"] || "Advanced Robots Directives"}
                </label>
                <div>
                  <input
                    id="seo_robots_extra"
                    type="text"
                    value={settings.seo_robots_extra ?? "max-image-preview:large"}
                    onChange={(e) => handleChange("seo_robots_extra", e.target.value)}
                    className="h-[32px] w-full max-w-md rounded-[3px] border border-[#8c8f94] bg-white px-2.5 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
                  />
                  <p className="mt-1 text-[11px] text-[#646970]">
                    {dict["admin.settings.robots_directives_desc"] || "Standard for Google Discover: max-image-preview:large, max-snippet:-1"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: SOCIAL & OPEN GRAPH */}
        {/* ========================================================================= */}
        {activeTab === "social" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-[16px] font-semibold text-[#1d2327]">
                {dict["admin.settings.social_heading"] || "Social Sharing & Open Graph"}
              </h2>
              <p className="text-[12px] text-[#646970]">
                {dict["admin.settings.social_desc"] || "Customize how links look when shared on WhatsApp, Facebook, X (Twitter), and LinkedIn."}
              </p>
            </div>

            <div className="space-y-4">
              {/* Default OG Image */}
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[220px_1fr]">
                <label htmlFor="og_default_image" className="text-[13px] font-semibold text-[#1d2327]">
                  {dict["admin.settings.og_image"] || "Default Share Image (OG)"}
                </label>
                <div>
                  <input
                    id="og_default_image"
                    type="text"
                    value={settings.og_default_image ?? ""}
                    onChange={(e) => handleChange("og_default_image", e.target.value)}
                    className="h-[32px] w-full max-w-md rounded-[3px] border border-[#8c8f94] bg-white px-2.5 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
                    placeholder="https://yourdomain.com/images/default-og.jpg or /images/..."
                  />
                  <p className="mt-1 text-[11px] text-[#646970]">
                    {dict["admin.settings.og_image_desc"] || "Recommended resolution: 1200x630 pixels. Used when an article or page has no featured image."}
                  </p>
                </div>
              </div>

              {/* OG Site Name */}
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[220px_1fr]">
                <label htmlFor="og_site_name" className="text-[13px] font-semibold text-[#1d2327]">
                  {dict["admin.settings.og_site_name"] || "Open Graph Site Name"}
                </label>
                <div>
                  <input
                    id="og_site_name"
                    type="text"
                    value={settings.og_site_name ?? ""}
                    onChange={(e) => handleChange("og_site_name", e.target.value)}
                    className="h-[32px] w-full max-w-md rounded-[3px] border border-[#8c8f94] bg-white px-2.5 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
                  />
                </div>
              </div>

              {/* Twitter Card Type */}
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[220px_1fr]">
                <label htmlFor="twitter_card_type" className="text-[13px] font-semibold text-[#1d2327]">
                  {dict["admin.settings.twitter_card"] || "Twitter / X Card Type"}
                </label>
                <div>
                  <select
                    id="twitter_card_type"
                    value={settings.twitter_card_type ?? "summary_large_image"}
                    onChange={(e) => handleChange("twitter_card_type", e.target.value)}
                    className="h-[32px] w-full max-w-xs rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
                  >
                    <option value="summary_large_image">Summary with Large Image (Standard for news)</option>
                    <option value="summary">Summary (Small thumbnail)</option>
                  </select>
                </div>
              </div>

              {/* Twitter Site Handle */}
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[220px_1fr]">
                <label htmlFor="twitter_site_handle" className="text-[13px] font-semibold text-[#1d2327]">
                  {dict["admin.settings.twitter_handle"] || "Twitter / X @Handle"}
                </label>
                <div>
                  <input
                    id="twitter_site_handle"
                    type="text"
                    value={settings.twitter_site_handle ?? ""}
                    onChange={(e) => handleChange("twitter_site_handle", e.target.value)}
                    className="h-[32px] w-full max-w-md rounded-[3px] border border-[#8c8f94] bg-white px-2.5 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
                    placeholder="@YourAccount"
                  />
                </div>
              </div>

              {/* Facebook App ID */}
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[220px_1fr]">
                <label htmlFor="facebook_app_id" className="text-[13px] font-semibold text-[#1d2327]">
                  {dict["admin.settings.fb_app_id"] || "Facebook App ID"}
                </label>
                <div>
                  <input
                    id="facebook_app_id"
                    type="text"
                    value={settings.facebook_app_id ?? ""}
                    onChange={(e) => handleChange("facebook_app_id", e.target.value)}
                    className="h-[32px] w-full max-w-md rounded-[3px] border border-[#8c8f94] bg-white px-2.5 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
                    placeholder="Optional: for Facebook Insights"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: ANALYTICS & SCRIPTS */}
        {/* ========================================================================= */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-[16px] font-semibold text-[#1d2327]">
                {dict["admin.settings.analytics_heading"] || "Analytics & Webmaster Verification"}
              </h2>
              <p className="text-[12px] text-[#646970]">
                {dict["admin.settings.analytics_desc"] || "Connect search consoles, traffic metrics, and custom scripts."}
              </p>
            </div>

            <div className="space-y-4">
              {/* Google Search Console */}
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[220px_1fr]">
                <label htmlFor="google_site_verification" className="text-[13px] font-semibold text-[#1d2327]">
                  {dict["admin.settings.gsc"] || "Google Search Console"}
                </label>
                <div>
                  <input
                    id="google_site_verification"
                    type="text"
                    value={settings.google_site_verification ?? ""}
                    onChange={(e) => handleChange("google_site_verification", e.target.value)}
                    className="h-[32px] w-full max-w-md rounded-[3px] border border-[#8c8f94] bg-white px-2.5 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
                    placeholder="Verification code content string"
                  />
                  <p className="mt-1 text-[11px] text-[#646970]">
                    {dict["admin.settings.gsc_desc"] || "Value from <meta name='google-site-verification' content='...' />"}
                  </p>
                </div>
              </div>

              {/* Bing Webmaster */}
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[220px_1fr]">
                <label htmlFor="bing_site_verification" className="text-[13px] font-semibold text-[#1d2327]">
                  {dict["admin.settings.bing"] || "Bing Webmaster Tools"}
                </label>
                <div>
                  <input
                    id="bing_site_verification"
                    type="text"
                    value={settings.bing_site_verification ?? ""}
                    onChange={(e) => handleChange("bing_site_verification", e.target.value)}
                    className="h-[32px] w-full max-w-md rounded-[3px] border border-[#8c8f94] bg-white px-2.5 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
                  />
                </div>
              </div>

              {/* Google Analytics 4 */}
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[220px_1fr]">
                <label htmlFor="google_analytics_id" className="text-[13px] font-semibold text-[#1d2327]">
                  {dict["admin.settings.ga4"] || "Google Analytics 4 (GA4)"}
                </label>
                <div>
                  <input
                    id="google_analytics_id"
                    type="text"
                    value={settings.google_analytics_id ?? ""}
                    onChange={(e) => handleChange("google_analytics_id", e.target.value)}
                    className="h-[32px] w-full max-w-xs rounded-[3px] border border-[#8c8f94] bg-white px-2.5 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
                    placeholder="G-XXXXXXXXXX"
                  />
                  <p className="mt-1 text-[11px] text-[#646970]">
                    {dict["admin.settings.ga4_desc"] || "Your GA4 Measurement ID."}
                  </p>
                </div>
              </div>

              {/* Custom Header Scripts */}
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[220px_1fr]">
                <label htmlFor="custom_header_scripts" className="text-[13px] font-semibold text-[#1d2327]">
                  {dict["admin.settings.header_scripts"] || "Header Scripts (<head>)"}
                </label>
                <div>
                  <textarea
                    id="custom_header_scripts"
                    rows={4}
                    value={settings.custom_header_scripts ?? ""}
                    onChange={(e) => handleChange("custom_header_scripts", e.target.value)}
                    className="w-full max-w-xl font-mono text-[12px] rounded-[3px] border border-[#8c8f94] bg-white p-2.5 text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
                    placeholder="<script>...</script>"
                  />
                  <p className="mt-1 text-[11px] text-[#646970]">
                    {dict["admin.settings.header_scripts_desc"] || "Injected right before </head>. Useful for Google Tag Manager, custom CSS, or meta tags."}
                  </p>
                </div>
              </div>

              {/* Custom Footer Scripts */}
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[220px_1fr]">
                <label htmlFor="custom_footer_scripts" className="text-[13px] font-semibold text-[#1d2327]">
                  {dict["admin.settings.footer_scripts"] || "Footer Scripts (</body>)"}
                </label>
                <div>
                  <textarea
                    id="custom_footer_scripts"
                    rows={4}
                    value={settings.custom_footer_scripts ?? ""}
                    onChange={(e) => handleChange("custom_footer_scripts", e.target.value)}
                    className="w-full max-w-xl font-mono text-[12px] rounded-[3px] border border-[#8c8f94] bg-white p-2.5 text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
                    placeholder="<script>...</script>"
                  />
                  <p className="mt-1 text-[11px] text-[#646970]">
                    {dict["admin.settings.footer_scripts_desc"] || "Injected right before </body>. Useful for tracking pixels and analytics."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Save Changes Button Footer */}
        <div className="mt-8 border-t border-[#dcdcde] pt-5">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-[3px] border border-[#2271b1] bg-[#2271b1] px-4 py-1.5 text-[13px] font-medium text-white shadow-sm hover:border-[#135e96] hover:bg-[#135e96] focus:outline-none disabled:opacity-50"
          >
            {isPending
              ? (dict["admin.common.saving"] || "Saving Changes...")
              : (dict["admin.settings.save_changes"] || "Save Changes")}
          </button>
        </div>
      </form>
    </div>
  );
}
