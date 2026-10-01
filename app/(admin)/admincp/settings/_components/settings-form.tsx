"use client";

import { useState, useTransition } from "react";
import { saveSettingsAction, sendTestEmailAction } from "../action";
import type { SettingsMap } from "@/services/settings.service";
import {
  Globe,
  Search,
  Share2,
  BarChart2,
  Mail,
  Send,
  Eye,
  EyeOff,
  Lock,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

export function SettingsForm({
  initialSettings,
  dict = {},
  direction = "ltr",
}: {
  initialSettings: SettingsMap;
  dict?: Record<string, string>;
  direction?: "rtl" | "ltr";
}) {
  const [activeTab, setActiveTab] = useState<"general" | "seo" | "social" | "analytics" | "email">("general");
  const [settings, setSettings] = useState<SettingsMap>(initialSettings);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  // SMTP Test Email state
  const [testEmail, setTestEmail] = useState("");
  const [testEmailStatus, setTestEmailStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isSendingTest, startTestTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleCheckboxToggle = (key: string, checkedValue = "1", uncheckedValue = "0") => {
    setSettings((prev) => ({
      ...prev,
      [key]: prev[key] === checkedValue ? uncheckedValue : checkedValue,
    }));
  };

  const handleSendTestEmail = () => {
    if (!testEmail || !testEmail.includes("@")) {
      setTestEmailStatus({
        type: "error",
        message: dict["admin.settings.test_email_error"] || "Please enter a valid email address.",
      });
      return;
    }
    setTestEmailStatus(null);
    startTestTransition(async () => {
      const res = await sendTestEmailAction(testEmail);
      if (res.success) {
        setTestEmailStatus({
          type: "success",
          message: dict["admin.settings.test_email_success"] || res.message || "Test email dispatched successfully!",
        });
      } else {
        setTestEmailStatus({
          type: "error",
          message: res.error || dict["admin.settings.test_email_error"] || "Failed to send test email.",
        });
      }
    });
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
    {
      id: "email" as const,
      label: dict["admin.settings.tab_email"] || "Email & Notifications",
      icon: Mail,
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

        {/* ========================================================================= */}
        {/* TAB 5: EMAIL & NOTIFICATIONS                                             */}
        {/* ========================================================================= */}
        {activeTab === "email" && (
          <div className="space-y-8">
            <div>
              <h2 className="text-[16px] font-semibold text-[#1d2327]">
                {dict["admin.settings.email_heading"] || "Email & SMTP Server"}
              </h2>
              <p className="text-[12px] text-[#646970]">
                {dict["admin.settings.email_desc"] || "Configure outbound mail delivery (SMTP), admin alerts, and customize template wording."}
              </p>
            </div>

            {/* Sub-Section 1: SMTP Server Configuration */}
            <div className="border-t border-[#dcdcde] pt-6 space-y-6">
              <h3 className="text-[14px] font-semibold text-[#1d2327]">
                {dict["admin.settings.smtp_section"] || "SMTP Configuration"}
              </h3>

              {/* SMTP Host */}
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[220px_1fr]">
                <label htmlFor="smtp_host" className="text-[13px] font-semibold text-[#1d2327]">
                  {dict["admin.settings.smtp_host"] || "SMTP Host"}
                </label>
                <div>
                  <input
                    id="smtp_host"
                    type="text"
                    value={settings.smtp_host ?? ""}
                    onChange={(e) => handleChange("smtp_host", e.target.value)}
                    className="h-[32px] w-full max-w-md rounded-[3px] border border-[#8c8f94] bg-white px-2.5 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
                    placeholder="smtp.mailgun.org / smtp.gmail.com"
                  />
                  <p className="mt-1 text-[11px] text-[#646970]">
                    {dict["admin.settings.smtp_host_desc"] || "Hostname of your mail server."}
                  </p>
                </div>
              </div>

              {/* SMTP Port & Secure */}
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[220px_1fr]">
                <label htmlFor="smtp_port" className="text-[13px] font-semibold text-[#1d2327]">
                  {dict["admin.settings.smtp_port"] || "SMTP Port"}
                </label>
                <div className="flex flex-wrap items-center gap-4">
                  <div>
                    <input
                      id="smtp_port"
                      type="text"
                      value={settings.smtp_port ?? "587"}
                      onChange={(e) => handleChange("smtp_port", e.target.value)}
                      className="h-[32px] w-28 rounded-[3px] border border-[#8c8f94] bg-white px-2.5 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
                      placeholder="587"
                    />
                    <p className="mt-1 text-[11px] text-[#646970]">
                      {dict["admin.settings.smtp_port_desc"] || "587 (TLS) or 465 (SSL)."}
                    </p>
                  </div>

                  <div>
                    <select
                      id="smtp_secure"
                      value={settings.smtp_secure ?? "tls"}
                      onChange={(e) => handleChange("smtp_secure", e.target.value)}
                      className="h-[32px] rounded-[3px] border border-[#8c8f94] bg-white px-2.5 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
                    >
                      <option value="tls">{dict["admin.settings.smtp_secure_tls"] || "TLS / STARTTLS (Port 587)"}</option>
                      <option value="ssl">{dict["admin.settings.smtp_secure_ssl"] || "SSL (Port 465)"}</option>
                      <option value="none">{dict["admin.settings.smtp_secure_none"] || "None / Plaintext (Port 25)"}</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SMTP User */}
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[220px_1fr]">
                <label htmlFor="smtp_user" className="text-[13px] font-semibold text-[#1d2327]">
                  {dict["admin.settings.smtp_user"] || "SMTP Username / API Key"}
                </label>
                <div>
                  <input
                    id="smtp_user"
                    type="text"
                    value={settings.smtp_user ?? ""}
                    onChange={(e) => handleChange("smtp_user", e.target.value)}
                    className="h-[32px] w-full max-w-md rounded-[3px] border border-[#8c8f94] bg-white px-2.5 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
                    placeholder="postmaster@yourdomain.com"
                  />
                  <p className="mt-1 text-[11px] text-[#646970]">
                    {dict["admin.settings.smtp_user_desc"] || "Username or API key for authenticating with the mail provider."}
                  </p>
                </div>
              </div>

              {/* SMTP Password (Encrypted) */}
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[220px_1fr]">
                <label htmlFor="smtp_pass" className="text-[13px] font-semibold text-[#1d2327] flex items-center gap-1.5">
                  <Lock className="size-3.5 text-[#00a32a]" />
                  <span>{dict["admin.settings.smtp_pass"] || "SMTP Password / Secret"}</span>
                </label>
                <div>
                  <div className="relative max-w-md">
                    <input
                      id="smtp_pass"
                      type={showPassword ? "text" : "password"}
                      value={settings.smtp_pass ?? ""}
                      onChange={(e) => handleChange("smtp_pass", e.target.value)}
                      className="h-[32px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2.5 pe-9 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
                      placeholder={dict["admin.settings.smtp_pass_placeholder"] || "•••••••• (Encrypted in database)"}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 end-0 flex items-center px-2.5 text-[#646970] hover:text-[#1d2327]"
                    >
                      {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                    </button>
                  </div>
                  <p className="mt-1 text-[11px] text-[#646970] flex items-center gap-1">
                    <span className="text-[#00a32a] font-medium">✓ AES-256-GCM</span>
                    <span>{dict["admin.settings.smtp_pass_desc"] || "Encrypted with AES-256-GCM in database before storage."}</span>
                  </p>
                </div>
              </div>

              {/* SMTP From Email */}
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[220px_1fr]">
                <label htmlFor="smtp_from_email" className="text-[13px] font-semibold text-[#1d2327]">
                  {dict["admin.settings.smtp_from_email"] || "From Email Address"}
                </label>
                <div>
                  <input
                    id="smtp_from_email"
                    type="email"
                    value={settings.smtp_from_email ?? ""}
                    onChange={(e) => handleChange("smtp_from_email", e.target.value)}
                    className="h-[32px] w-full max-w-md rounded-[3px] border border-[#8c8f94] bg-white px-2.5 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
                    placeholder="news@yourdomain.com"
                  />
                  <p className="mt-1 text-[11px] text-[#646970]">
                    {dict["admin.settings.smtp_from_email_desc"] || "Sender address that appears in outbound messages."}
                  </p>
                </div>
              </div>

              {/* SMTP From Name */}
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[220px_1fr]">
                <label htmlFor="smtp_from_name" className="text-[13px] font-semibold text-[#1d2327]">
                  {dict["admin.settings.smtp_from_name"] || "From Display Name"}
                </label>
                <div>
                  <input
                    id="smtp_from_name"
                    type="text"
                    value={settings.smtp_from_name ?? ""}
                    onChange={(e) => handleChange("smtp_from_name", e.target.value)}
                    className="h-[32px] w-full max-w-md rounded-[3px] border border-[#8c8f94] bg-white px-2.5 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
                    placeholder="PressForge News"
                  />
                  <p className="mt-1 text-[11px] text-[#646970]">
                    {dict["admin.settings.smtp_from_name_desc"] || "Sender name that appears in inboxes."}
                  </p>
                </div>
              </div>
            </div>

            {/* Sub-Section 2: Notifications Configuration */}
            <div className="border-t border-[#dcdcde] pt-6 space-y-6">
              <h3 className="text-[14px] font-semibold text-[#1d2327]">
                {dict["admin.settings.notifications_section"] || "Admin & Subscriber Notifications"}
              </h3>

              {/* Admin Notification Email */}
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[220px_1fr]">
                <label htmlFor="admin_notification_email" className="text-[13px] font-semibold text-[#1d2327]">
                  {dict["admin.settings.admin_notification_email"] || "Admin Notification Email"}
                </label>
                <div>
                  <input
                    id="admin_notification_email"
                    type="email"
                    value={settings.admin_notification_email ?? ""}
                    onChange={(e) => handleChange("admin_notification_email", e.target.value)}
                    className="h-[32px] w-full max-w-md rounded-[3px] border border-[#8c8f94] bg-white px-2.5 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
                    placeholder="editor@yourdomain.com"
                  />
                  <p className="mt-1 text-[11px] text-[#646970]">
                    {dict["admin.settings.admin_notification_email_desc"] || "Target inbox for administrative and publication alerts."}
                  </p>
                </div>
              </div>

              {/* Notification Toggles */}
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[220px_1fr]">
                <span className="text-[13px] font-semibold text-[#1d2327]">
                  {dict["admin.settings.notifications_section"] || "Automated Events"}
                </span>
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-[13px] text-[#2c3338] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.enable_new_post_notifications === "1"}
                      onChange={() => handleCheckboxToggle("enable_new_post_notifications")}
                      className="size-4 rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
                    />
                    <span>{dict["admin.settings.enable_new_post_notifications"] || "Notify admin when a new post is published"}</span>
                  </label>

                  <label className="flex items-center gap-2 text-[13px] text-[#2c3338] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.enable_newsletter_notifications === "1"}
                      onChange={() => handleCheckboxToggle("enable_newsletter_notifications")}
                      className="size-4 rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
                    />
                    <span>{dict["admin.settings.enable_newsletter_notifications"] || "Send automated welcome email when users subscribe to newsletter"}</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Sub-Section 3: Email Templates Wording (Configurable in UI) */}
            <div className="border-t border-[#dcdcde] pt-6 space-y-6">
              <div>
                <h3 className="text-[14px] font-semibold text-[#1d2327]">
                  {dict["admin.settings.templates_section"] || "Email Templates Wording"}
                </h3>
                <p className="text-[12px] text-[#646970]">
                  {dict["admin.settings.templates_section_desc"] || "Customize text, subjects, headings, and footer disclaimers for automated system emails without altering code."}
                </p>
              </div>

              {/* Template 1: New Post Notification */}
              <div className="rounded-[4px] border border-[#dcdcde] bg-[#f9fafb] p-4 space-y-4">
                <h4 className="text-[13px] font-bold text-[#1d2327]">
                  {dict["admin.settings.tpl_new_post_heading"] || "New Post Alert Template"}
                </h4>

                <div className="grid grid-cols-1 gap-2 md:grid-cols-[180px_1fr]">
                  <label htmlFor="email_new_post_subject" className="text-[12px] font-medium text-[#1d2327]">
                    {dict["admin.settings.tpl_new_post_subject"] || "Subject Line"}
                  </label>
                  <div>
                    <input
                      id="email_new_post_subject"
                      type="text"
                      value={settings.email_new_post_subject ?? ""}
                      onChange={(e) => handleChange("email_new_post_subject", e.target.value)}
                      className="h-[32px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2.5 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
                      placeholder="📰 New Story: {{postTitle}}"
                    />
                    <p className="mt-1 text-[11px] text-[#646970]">
                      {dict["admin.settings.tpl_new_post_subject_desc"] || "Available variables: {{postTitle}}, {{siteName}}, {{authorName}}."}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 md:grid-cols-[180px_1fr]">
                  <label htmlFor="email_new_post_heading" className="text-[12px] font-medium text-[#1d2327]">
                    {dict["admin.settings.tpl_new_post_title"] || "Email Main Heading"}
                  </label>
                  <div>
                    <input
                      id="email_new_post_heading"
                      type="text"
                      value={settings.email_new_post_heading ?? ""}
                      onChange={(e) => handleChange("email_new_post_heading", e.target.value)}
                      className="h-[32px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2.5 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
                      placeholder="New Article Published"
                    />
                  </div>
                </div>
              </div>

              {/* Template 2: Newsletter Welcome Email */}
              <div className="rounded-[4px] border border-[#dcdcde] bg-[#f9fafb] p-4 space-y-4">
                <h4 className="text-[13px] font-bold text-[#1d2327]">
                  {dict["admin.settings.tpl_welcome_heading"] || "Newsletter Welcome Template"}
                </h4>

                <div className="grid grid-cols-1 gap-2 md:grid-cols-[180px_1fr]">
                  <label htmlFor="email_welcome_subject" className="text-[12px] font-medium text-[#1d2327]">
                    {dict["admin.settings.tpl_welcome_subject"] || "Subject Line"}
                  </label>
                  <div>
                    <input
                      id="email_welcome_subject"
                      type="text"
                      value={settings.email_welcome_subject ?? ""}
                      onChange={(e) => handleChange("email_welcome_subject", e.target.value)}
                      className="h-[32px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2.5 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
                      placeholder="🎉 Welcome to {{siteName}}"
                    />
                    <p className="mt-1 text-[11px] text-[#646970]">
                      {dict["admin.settings.tpl_welcome_subject_desc"] || "Available variables: {{siteName}}, {{name}}."}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 md:grid-cols-[180px_1fr]">
                  <label htmlFor="email_welcome_heading" className="text-[12px] font-medium text-[#1d2327]">
                    {dict["admin.settings.tpl_welcome_title"] || "Email Main Heading"}
                  </label>
                  <div>
                    <input
                      id="email_welcome_heading"
                      type="text"
                      value={settings.email_welcome_heading ?? ""}
                      onChange={(e) => handleChange("email_welcome_heading", e.target.value)}
                      className="h-[32px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2.5 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
                      placeholder="Welcome to Our Newsletter"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 md:grid-cols-[180px_1fr]">
                  <label htmlFor="email_welcome_body" className="text-[12px] font-medium text-[#1d2327]">
                    {dict["admin.settings.tpl_welcome_body"] || "Welcome Body Content"}
                  </label>
                  <div>
                    <textarea
                      id="email_welcome_body"
                      rows={3}
                      value={settings.email_welcome_body ?? ""}
                      onChange={(e) => handleChange("email_welcome_body", e.target.value)}
                      className="w-full rounded-[3px] border border-[#8c8f94] bg-white p-2.5 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
                      placeholder="Thank you for subscribing to our newsletter..."
                    />
                    <p className="mt-1 text-[11px] text-[#646970]">
                      {dict["admin.settings.tpl_welcome_body_desc"] || "Main message presented to new newsletter subscribers."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Template 3: Global Footer Disclaimer */}
              <div className="rounded-[4px] border border-[#dcdcde] bg-[#f9fafb] p-4 space-y-4">
                <div className="grid grid-cols-1 gap-2 md:grid-cols-[180px_1fr]">
                  <label htmlFor="email_footer_text" className="text-[12px] font-bold text-[#1d2327]">
                    {dict["admin.settings.tpl_footer_text"] || "Email Footer Disclaimer"}
                  </label>
                  <div>
                    <textarea
                      id="email_footer_text"
                      rows={2}
                      value={settings.email_footer_text ?? ""}
                      onChange={(e) => handleChange("email_footer_text", e.target.value)}
                      className="w-full rounded-[3px] border border-[#8c8f94] bg-white p-2.5 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
                      placeholder="You received this email because you subscribed to updates."
                    />
                    <p className="mt-1 text-[11px] text-[#646970]">
                      {dict["admin.settings.tpl_footer_text_desc"] || "Appears at the bottom of all system emails."}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sub-Section 4: Live SMTP Connection Test */}
            <div className="border-t border-[#dcdcde] pt-6 space-y-4">
              <div>
                <h3 className="text-[14px] font-semibold text-[#1d2327]">
                  {dict["admin.settings.test_email_section"] || "Send Test Email"}
                </h3>
                <p className="text-[12px] text-[#646970]">
                  {dict["admin.settings.test_email_desc"] || "Verify your SMTP credentials and delivery immediately."}
                </p>
              </div>

              {testEmailStatus && (
                <div
                  className={`flex items-center justify-between rounded-[3px] border-s-4 p-3 text-[13px] ${
                    testEmailStatus.type === "success"
                      ? "border-[#00a32a] bg-[#f0f6fc] text-[#1d2327]"
                      : "border-[#d63638] bg-[#fcf0f1] text-[#1d2327]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {testEmailStatus.type === "success" ? (
                      <CheckCircle2 className="size-4 text-[#00a32a]" />
                    ) : (
                      <AlertCircle className="size-4 text-[#d63638]" />
                    )}
                    <span>{testEmailStatus.message}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTestEmailStatus(null)}
                    className="text-[16px] leading-none text-[#787c82] hover:text-[#d63638]"
                  >
                    ×
                  </button>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-xl">
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder={dict["admin.settings.test_email_address"] || "Recipient Email Address"}
                  className="h-[32px] flex-1 rounded-[3px] border border-[#8c8f94] bg-white px-2.5 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
                />
                <button
                  type="button"
                  disabled={isSendingTest}
                  onClick={handleSendTestEmail}
                  className="inline-flex items-center justify-center gap-1.5 h-[32px] px-4 rounded-[3px] border border-[#2271b1] bg-[#2271b1] text-[13px] font-medium text-white shadow-sm hover:border-[#135e96] hover:bg-[#135e96] focus:outline-none disabled:opacity-50"
                >
                  {isSendingTest ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      <span>{dict["admin.settings.test_email_sending"] || "Sending..."}</span>
                    </>
                  ) : (
                    <>
                      <Send className="size-3.5" />
                      <span>{dict["admin.settings.test_email_send"] || "Send Test Email"}</span>
                    </>
                  )}
                </button>
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
