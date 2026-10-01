"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Download,
  Loader2,
  Save,
  Trash2,
  Mail,
  AlertTriangle,
  Volume2,
  Megaphone,
  Sparkles,
  Clock,
  Share2,
  FileCheck,
  ListTree,
  Sliders,
} from "lucide-react";
import type { PluginManifest } from "@/lib/plugins/types";
import type { NewsletterSubscriber } from "@/lib/newsletter/db";
import {
  savePluginConfigAction,
  deleteSubscriberAction,
  clearSubscribersAction,
} from "../actions";

interface PluginConfigFormProps {
  slug: string;
  manifest: PluginManifest;
  config: Record<string, any>;
  subscribers?: NewsletterSubscriber[];
  dict: Record<string, string>;
  direction?: "rtl" | "ltr";
}

export function PluginConfigForm({
  slug,
  manifest,
  config: initialConfig,
  subscribers: initialSubscribers = [],
  dict,
  direction = "ltr",
}: PluginConfigFormProps) {
  const isRtl = direction === "rtl";
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [formData, setFormData] = useState<Record<string, any>>(initialConfig);
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>(initialSubscribers);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const t = (key: string, enFallback: string, arFallback: string) => {
    if (isRtl) return dict[key] || arFallback;
    return dict[key] || enFallback;
  };

  const pluginName = dict[`admin.plugins.catalog.${slug}.name`] || manifest.name;
  const pluginDesc = dict[`admin.plugins.catalog.${slug}.desc`] || manifest.description;

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    startTransition(async () => {
      const res = await savePluginConfigAction(slug, formData);
      if (res.success) {
        setNotice({
          type: "success",
          message: t(
            "admin.plugins.save_success",
            `${pluginName} settings saved successfully!`,
            `تم حفظ إعدادات ${pluginName} بنجاح!`
          ),
        });
        setTimeout(() => setNotice(null), 3500);
      } else {
        setNotice({
          type: "error",
          message: res.error || t("admin.plugins.save_failed", "Failed to save settings.", "فشل حفظ الإعدادات."),
        });
      }
    });
  };

  const handleDeleteSubscriber = (email: string) => {
    startTransition(async () => {
      const res = await deleteSubscriberAction(email);
      if (res.success) {
        setSubscribers((prev) => prev.filter((s) => s.email !== email));
      }
    });
  };

  const handleExportCSV = () => {
    if (!subscribers.length) return;
    const headers = "ID,Email,Name,SubscribedAt,Source,Status\n";
    const rows = subscribers
      .map((s) => `"${s.id}","${s.email}","${s.name || ""}","${s.subscribedAt}","${s.source || ""}","${s.status}"`)
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `subscribers-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderIcon = () => {
    const iconClass = "size-5 text-[#2271b1]";
    switch (slug) {
      case "newsletter":
        return <Mail className={iconClass} />;
      case "breaking-news":
        return <AlertTriangle className={iconClass} />;
      case "article-audio":
        return <Volume2 className={iconClass} />;
      case "ad-manager":
        return <Megaphone className={iconClass} />;
      case "related-posts":
        return <Sparkles className={iconClass} />;
      case "reading-time":
        return <Clock className={iconClass} />;
      case "social-share":
        return <Share2 className={iconClass} />;
      case "fact-check":
        return <FileCheck className={iconClass} />;
      case "table-of-contents":
        return <ListTree className={iconClass} />;
      default:
        return <Sliders className={iconClass} />;
    }
  };

  return (
    <div dir={direction} className="space-y-6 max-w-5xl mx-auto pb-16 text-start">
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#c3c4c7] pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admincp/plugins"
            className="flex items-center gap-1.5 text-xs font-semibold text-[#2271b1] hover:underline"
          >
            {isRtl ? <ArrowRight className="size-4" /> : <ArrowLeft className="size-4" />}
            <span>{t("admin.plugins.back_to_list", "All Plugins", "جميع الإضافات")}</span>
          </Link>
          <span className="text-[#8c8f94]">/</span>
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded border border-[#c3c4c7] bg-[#f6f7f7]">
              {renderIcon()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#1d2327] leading-tight">
                {pluginName}
              </h1>
              <p className="text-xs text-[#50575e]">
                {pluginDesc}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-[3px] border border-[#2271b1] bg-[#2271b1] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#135e96] disabled:opacity-50 transition-colors cursor-pointer"
          >
            {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
            <span>{t("admin.plugins.save_settings", "Save Changes", "حفظ الإعدادات")}</span>
          </button>
        </div>
      </div>

      {/* Notice Banner (Standard WP Admin Notice) */}
      {notice && (
        <div
          className={`flex items-center gap-2 p-3 text-xs font-medium bg-white shadow-xs ${
            notice.type === "success"
              ? isRtl ? "border-r-4 border-r-[#00a32a] text-[#1d2327]" : "border-l-4 border-l-[#00a32a] text-[#1d2327]"
              : isRtl ? "border-r-4 border-r-[#d63638] text-[#1d2327]" : "border-l-4 border-l-[#d63638] text-[#1d2327]"
          }`}
        >
          <CheckCircle2 className={`size-4 flex-shrink-0 ${notice.type === "success" ? "text-[#00a32a]" : "text-[#d63638]"}`} />
          <span>{notice.message}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. NEWSLETTER CONFIGURATION                              */}
      {/* ======================================================== */}
      {slug === "newsletter" && (
        <div className="space-y-6">
          <div className="rounded-sm border border-[#c3c4c7] bg-white p-5 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-[#1d2327] border-b border-[#f0f0f1] pb-2">
              {t("admin.plugins.newsletter.branding", "Editorial Brand & Subscription Pitch", "هوية النشرة ودعوة الاشتراك")}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#1d2327] mb-1">
                  {t("admin.plugins.newsletter.brand_name", "Newsletter Name", "اسم النشرة")}
                </label>
                <input
                  type="text"
                  value={formData.brandName !== undefined ? formData.brandName : (dict["admin.plugins.newsletter.default_brand"] || "")}
                  onChange={(e) => updateField("brandName", e.target.value)}
                  className="w-full rounded-[3px] border border-[#8c8f94] bg-white px-3 py-1.5 text-xs text-[#2c3338] focus:border-[#2271b1] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1d2327] mb-1">
                  {t("admin.plugins.newsletter.button_text", "Button Callout", "نص زر الاشتراك")}
                </label>
                <input
                  type="text"
                  value={formData.buttonText !== undefined ? formData.buttonText : (dict["admin.plugins.newsletter.default_button"] || "")}
                  onChange={(e) => updateField("buttonText", e.target.value)}
                  className="w-full rounded-[3px] border border-[#8c8f94] bg-white px-3 py-1.5 text-xs text-[#2c3338] focus:border-[#2271b1] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1d2327] mb-1">
                {t("admin.plugins.newsletter.pitch", "Value Proposition / Pitch Note", "الوصف الترويجي للنشرة")}
              </label>
              <textarea
                rows={2}
                value={formData.pitch !== undefined ? formData.pitch : (dict["admin.plugins.newsletter.default_pitch"] || "")}
                onChange={(e) => updateField("pitch", e.target.value)}
                className="w-full rounded-[3px] border border-[#8c8f94] bg-white p-2.5 text-xs text-[#2c3338] focus:border-[#2271b1] focus:outline-none"
              />
            </div>
          </div>

          <div className="rounded-sm border border-[#c3c4c7] bg-white p-5 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-[#1d2327] border-b border-[#f0f0f1] pb-2">
              {t("admin.plugins.newsletter.email_dispatch", "Automated Welcome Email (SMTP)", "البريد الترحيبي التلقائي (SMTP)")}
            </h2>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.sendWelcomeEmail !== false}
                onChange={(e) => updateField("sendWelcomeEmail", e.target.checked)}
                className="rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
              />
              <span className="text-xs font-semibold text-[#1d2327]">
                {t("admin.plugins.newsletter.send_welcome", "Send automatic transactional welcome email on subscription", "إرسال بريد ترحيبي تلقائي عند الاشتراك عبر SMTP")}
              </span>
            </label>

            <div>
              <label className="block text-xs font-semibold text-[#1d2327] mb-1">
                {t("admin.plugins.newsletter.welcome_subject", "Welcome Email Subject", "عنوان رسالة الترحيب")}
              </label>
              <input
                type="text"
                value={formData.welcomeSubject !== undefined ? formData.welcomeSubject : (dict["admin.plugins.newsletter.default_subject"] || "")}
                onChange={(e) => updateField("welcomeSubject", e.target.value)}
                className="w-full rounded-[3px] border border-[#8c8f94] bg-white px-3 py-1.5 text-xs text-[#2c3338]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1d2327] mb-1">
                {t("admin.plugins.newsletter.welcome_body", "Welcome Email Message", "نص الرسالة الترحيبية")}
              </label>
              <textarea
                rows={3}
                value={formData.welcomeMessage !== undefined ? formData.welcomeMessage : (dict["admin.plugins.newsletter.default_message"] || "")}
                onChange={(e) => updateField("welcomeMessage", e.target.value)}
                className="w-full rounded-[3px] border border-[#8c8f94] bg-white p-2.5 text-xs text-[#2c3338]"
              />
            </div>
          </div>

          {/* Subscribers Table */}
          <div className="rounded-sm border border-[#c3c4c7] bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#f0f0f1] pb-3">
              <div>
                <h2 className="text-sm font-bold text-[#1d2327]">
                  {t("admin.plugins.newsletter.subscribers_title", "Registered Subscribers", "المشتركون المسجلون في قاعدة البيانات")}
                </h2>
                <p className="text-xs text-[#50575e]">
                  {subscribers.length} {t("admin.plugins.newsletter.total_subs", "verified active reader subscriptions.", "قارئ مسجل.")}
                </p>
              </div>

              {subscribers.length > 0 && (
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="inline-flex items-center gap-1.5 rounded-[3px] border border-[#8c8f94] bg-[#f6f7f7] px-3 py-1 text-xs font-medium text-[#2c3338] hover:bg-[#f0f0f1] cursor-pointer"
                >
                  <Download className="size-3.5 text-[#50575e]" />
                  <span>{t("admin.plugins.newsletter.export_csv", "Export CSV", "تصدير ملف CSV")}</span>
                </button>
              )}
            </div>

            {subscribers.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#646970]">
                {t("admin.plugins.newsletter.no_subscribers", "No subscribers recorded yet. Form submissions will automatically appear here.", "لا يوجد مشتركون مسجلون بعد. ستظهر الاشتراكات الجديدة هنا تلقائياً.")}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-start border-collapse">
                  <thead>
                    <tr className="border-b border-[#dcdcde] bg-[#f6f7f7] text-[#50575e]">
                      <th className="p-2.5 text-start font-semibold">Email</th>
                      <th className="p-2.5 text-start font-semibold">Subscribed Date</th>
                      <th className="p-2.5 text-start font-semibold">Channel Source</th>
                      <th className="p-2.5 text-start font-semibold">Status</th>
                      <th className="p-2.5 text-end font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscribers.map((sub) => (
                      <tr key={sub.id} className="border-b border-[#f0f0f1] hover:bg-[#f6f7f7]">
                        <td className="p-2.5 font-medium text-[#1d2327]">{sub.email}</td>
                        <td className="p-2.5 text-[#50575e] font-mono text-[11px]">
                          {new Date(sub.subscribedAt).toLocaleString()}
                        </td>
                        <td className="p-2.5 text-[#50575e]">
                          <span className="rounded bg-[#f0f0f1] px-2 py-0.5 text-[10px] font-mono text-[#2c3338]">
                            {sub.source || "web"}
                          </span>
                        </td>
                        <td className="p-2.5">
                          <span className="inline-flex items-center rounded-full bg-[#f0f9eb] border border-[#b4e3a8] px-2 py-0.5 text-[10px] font-bold text-[#2e7d32]">
                            Active
                          </span>
                        </td>
                        <td className="p-2.5 text-end">
                          <button
                            type="button"
                            onClick={() => handleDeleteSubscriber(sub.email)}
                            className="text-[#d63638] hover:text-[#b32d2e] cursor-pointer"
                          >
                            <Trash2 className="size-3.5 inline" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. BREAKING NEWS CONFIGURATION                           */}
      {/* ======================================================== */}
      {slug === "breaking-news" && (
        <div className="rounded-sm border border-[#c3c4c7] bg-white p-5 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-[#1d2327] border-b border-[#f0f0f1] pb-2">
            {t("admin.plugins.breaking.alert_settings", "Live Emergency / Breaking Dispatch Alert", "شريط الأخبار العاجلة التحريري")}
          </h2>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(formData.enabled)}
              onChange={(e) => updateField("enabled", e.target.checked)}
              className="rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
            />
            <span className="text-xs font-semibold text-[#1d2327]">
              {t("admin.plugins.breaking.enable_alert", "Activate sitewide breaking news flash alert banner", "تفعيل شريط الأخبار العاجلة على كامل الموقع")}
            </span>
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1d2327] mb-1">
                {t("admin.plugins.breaking.urgency", "Urgency Level", "مستوى الخطورة والأهمية")}
              </label>
              <select
                value={formData.urgency || "urgent"}
                onChange={(e) => updateField("urgency", e.target.value)}
                className="w-full rounded-[3px] border border-[#8c8f94] bg-white px-3 py-1.5 text-xs text-[#2c3338]"
              >
                <option value="urgent">{isRtl ? "عاجل جداً" : "Critical Urgent"}</option>
                <option value="developing">{isRtl ? "تطورات مستمرة" : "Developing Story"}</option>
                <option value="alert">{isRtl ? "تنبيه تحريري" : "Editorial Flash"}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1d2327] mb-1">
                {t("admin.plugins.breaking.badge", "Badge Label", "نص الشارة العاجلة")}
              </label>
              <input
                type="text"
                value={formData.badgeText !== undefined ? formData.badgeText : (dict["admin.plugins.breaking.default_badge"] || "")}
                onChange={(e) => updateField("badgeText", e.target.value)}
                className="w-full rounded-[3px] border border-[#8c8f94] bg-white px-3 py-1.5 text-xs text-[#2c3338]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1d2327] mb-1">
              {t("admin.plugins.breaking.headline", "Breaking Alert Headline / Dispatch", "نص التطور العاجل")}
            </label>
            <textarea
              rows={3}
              value={formData.headline !== undefined ? formData.headline : (dict["admin.plugins.breaking.default_headline"] || "")}
              onChange={(e) => updateField("headline", e.target.value)}
              className="w-full rounded-[3px] border border-[#8c8f94] bg-white p-2.5 text-xs text-[#2c3338]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1d2327] mb-1">
              {t("admin.plugins.breaking.target_url", "Target Story Link (Optional)", "رابط تغطية الخبر أو المقال (اختياري)")}
            </label>
            <input
              type="text"
              placeholder="/posts/..."
              value={formData.targetUrl || ""}
              onChange={(e) => updateField("targetUrl", e.target.value)}
              className="w-full rounded-[3px] border border-[#8c8f94] bg-white px-3 py-1.5 text-xs text-[#2c3338]"
            />
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. ARTICLE AUDIO CONFIGURATION                           */}
      {/* ======================================================== */}
      {slug === "article-audio" && (
        <div className="rounded-sm border border-[#c3c4c7] bg-white p-5 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-[#1d2327] border-b border-[#f0f0f1] pb-2">
            {t("admin.plugins.audio.settings", "Audio Studio & Narration Stream", "إعدادات البث الصوتي وقراءة المقالات")}
          </h2>

          <div>
            <label className="block text-xs font-semibold text-[#1d2327] mb-1">
              {t("admin.plugins.audio.stream_url", "Default Audio Stream or Podcast Feed URL (MP3 / Live)", "رابط ملف الصوت أو البث الإذاعي (MP3 / Stream URL)")}
            </label>
            <input
              type="url"
              placeholder="https://example.com/audio/live-feed.mp3"
              value={formData.audioUrl || ""}
              onChange={(e) => updateField("audioUrl", e.target.value)}
              className="w-full rounded-[3px] border border-[#8c8f94] bg-white px-3 py-1.5 text-xs text-[#2c3338]"
            />
            <p className="text-[11px] text-[#646970] mt-1">
              {isRtl
                ? "إذا تم تركه فارغاً، سيقوم النظام تلقائياً بتفعيل القراءة الصوتية الذكية المدمجة عبر Web Speech API لنطق نص المقال."
                : "If left blank, the player will automatically use the browser's native Web Speech synthesis engine to narrate the article content aloud."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1d2327] mb-1">
                {t("admin.plugins.audio.station", "Station / Show Name", "اسم البرنامج أو المحطة")}
              </label>
              <input
                type="text"
                value={formData.stationName !== undefined ? formData.stationName : (dict["admin.plugins.audio.default_station"] || "")}
                onChange={(e) => updateField("stationName", e.target.value)}
                className="w-full rounded-[3px] border border-[#8c8f94] bg-white px-3 py-1.5 text-xs text-[#2c3338]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1d2327] mb-1">
                {t("admin.plugins.audio.host", "Host / Desk", "اسم المذيع أو القسم")}
              </label>
              <input
                type="text"
                value={formData.host !== undefined ? formData.host : (dict["admin.plugins.audio.default_host"] || "")}
                onChange={(e) => updateField("host", e.target.value)}
                className="w-full rounded-[3px] border border-[#8c8f94] bg-white px-3 py-1.5 text-xs text-[#2c3338]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1d2327] mb-1">
                {t("admin.plugins.audio.duration", "Estimated Duration", "المدة التقديرية")}
              </label>
              <input
                type="text"
                value={formData.duration || "03:45"}
                onChange={(e) => updateField("duration", e.target.value)}
                className="w-full rounded-[3px] border border-[#8c8f94] bg-white px-3 py-1.5 text-xs text-[#2c3338]"
              />
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. AD MANAGER CONFIGURATION                              */}
      {/* ======================================================== */}
      {slug === "ad-manager" && (
        <div className="rounded-sm border border-[#c3c4c7] bg-white p-5 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-[#1d2327] border-b border-[#f0f0f1] pb-2">
            {t("admin.plugins.ad.settings", "Commercial Sponsor & Display Ad Manager", "إدارة الإعلانات والشراكات التجارية")}
          </h2>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.enabled !== false}
              onChange={(e) => updateField("enabled", e.target.checked)}
              className="rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
            />
            <span className="text-xs font-semibold text-[#1d2327]">
              {t("admin.plugins.ad.enable", "Enable active advertising banners inside articles", "تفعيل ظهور الإعلانات داخل المقالات")}
            </span>
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1d2327] mb-1">
                {t("admin.plugins.ad.sponsor", "Sponsor / Client Name", "اسم المعلن أو الشريك")}
              </label>
              <input
                type="text"
                value={formData.sponsorName !== undefined ? formData.sponsorName : (dict["admin.plugins.ad.default_sponsor"] || "")}
                onChange={(e) => updateField("sponsorName", e.target.value)}
                className="w-full rounded-[3px] border border-[#8c8f94] bg-white px-3 py-1.5 text-xs text-[#2c3338]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1d2327] mb-1">
                {t("admin.plugins.ad.target", "Click Target URL", "رابط الوجهة عند النقر")}
              </label>
              <input
                type="url"
                placeholder="https://..."
                value={formData.targetUrl || ""}
                onChange={(e) => updateField("targetUrl", e.target.value)}
                className="w-full rounded-[3px] border border-[#8c8f94] bg-white px-3 py-1.5 text-xs text-[#2c3338]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1d2327] mb-1">
              {t("admin.plugins.ad.image", "Banner Graphic Image URL", "رابط صورة الإعلان (Banner Image URL)")}
            </label>
            <input
              type="url"
              placeholder="https://example.com/banner.jpg"
              value={formData.imageUrl || ""}
              onChange={(e) => updateField("imageUrl", e.target.value)}
              className="w-full rounded-[3px] border border-[#8c8f94] bg-white px-3 py-1.5 text-xs text-[#2c3338]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1d2327] mb-1">
              {t("admin.plugins.ad.custom_html", "Custom Ad Network Embed Code (Google AdSense / HTML Script)", "كود التضمين الإعلاني المخصص (HTML / Google AdSense)")}
            </label>
            <textarea
              rows={4}
              placeholder="<script async src='...'></script>"
              value={formData.customHtml || ""}
              onChange={(e) => updateField("customHtml", e.target.value)}
              className="w-full font-mono rounded-[3px] border border-[#8c8f94] bg-white p-2 text-xs text-[#2c3338]"
            />
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. RELATED POSTS CONFIGURATION                           */}
      {/* ======================================================== */}
      {slug === "related-posts" && (
        <div className="rounded-sm border border-[#c3c4c7] bg-white p-5 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-[#1d2327] border-b border-[#f0f0f1] pb-2">
            {t("admin.plugins.related.settings", "Related Stories & Next Reads Discovery", "إعدادات المقالات ذات الصلة")}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1d2327] mb-1">
                {t("admin.plugins.related.count", "Number of Stories to Suggest", "عدد المقالات المقترحة")}
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={formData.count || 3}
                onChange={(e) => updateField("count", Number(e.target.value) || 3)}
                className="w-full rounded-[3px] border border-[#8c8f94] bg-white px-3 py-1.5 text-xs text-[#2c3338]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1d2327] mb-1">
                {t("admin.plugins.related.match", "Match Strategy", "معيار التوصية")}
              </label>
              <select
                value={formData.matchStrategy || "categories"}
                onChange={(e) => updateField("matchStrategy", e.target.value)}
                className="w-full rounded-[3px] border border-[#8c8f94] bg-white px-3 py-1.5 text-xs text-[#2c3338]"
              >
                <option value="categories">{isRtl ? "مطابقة الأقسام والتصنيفات المشتركة" : "Shared Categories"}</option>
                <option value="recent">{isRtl ? "أحدث الأخبار المنشورة" : "Latest Published Stories"}</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. READING TIME CONFIGURATION                            */}
      {/* ======================================================== */}
      {slug === "reading-time" && (
        <div className="rounded-sm border border-[#c3c4c7] bg-white p-5 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-[#1d2327] border-b border-[#f0f0f1] pb-2">
            {t("admin.plugins.reading.settings", "Reading Speed & Pace Indicator", "إعدادات مؤشر سرعة ووقت القراءة")}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1d2327] mb-1">
                {t("admin.plugins.reading.wpm", "Words Per Minute (WPM)", "معدل الكلمات في الدقيقة (WPM)")}
              </label>
              <input
                type="number"
                min={100}
                max={500}
                value={formData.wpm || 200}
                onChange={(e) => updateField("wpm", Number(e.target.value) || 200)}
                className="w-full rounded-[3px] border border-[#8c8f94] bg-white px-3 py-1.5 text-xs text-[#2c3338]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1d2327] mb-1">
                {t("admin.plugins.reading.label", "Badge Label", "نص المؤشر")}
              </label>
              <input
                type="text"
                value={formData.label !== undefined ? formData.label : (dict["admin.plugins.reading.default_label"] || "")}
                onChange={(e) => updateField("label", e.target.value)}
                className="w-full rounded-[3px] border border-[#8c8f94] bg-white px-3 py-1.5 text-xs text-[#2c3338]"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.showMilestones !== false}
              onChange={(e) => updateField("showMilestones", e.target.checked)}
              className="rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
            />
            <span className="text-xs font-semibold text-[#1d2327]">
              {t("admin.plugins.reading.milestones", "Display read speed breakdown milestones (standard vs fast reader)", "عرض مقارنة السرعة المعيارية والسريعة")}
            </span>
          </label>
        </div>
      )}

      {/* ======================================================== */}
      {/* 7. SOCIAL SHARE CONFIGURATION                            */}
      {/* ======================================================== */}
      {slug === "social-share" && (
        <div className="rounded-sm border border-[#c3c4c7] bg-white p-5 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-[#1d2327] border-b border-[#f0f0f1] pb-2">
            {t("admin.plugins.social.settings", "Social Distribution & Share Actions", "إعدادات أزرار المشاركة الاجتماعية")}
          </h2>

          <div>
            <label className="block text-xs font-semibold text-[#1d2327] mb-1">
              {t("admin.plugins.social.prompt", "Share Callout Prompt", "نص دعوة المشاركة")}
            </label>
            <input
              type="text"
              value={formData.sharePrompt !== undefined ? formData.sharePrompt : (dict["admin.plugins.social.default_prompt"] || "")}
              onChange={(e) => updateField("sharePrompt", e.target.value)}
              className="w-full rounded-[3px] border border-[#8c8f94] bg-white px-3 py-1.5 text-xs text-[#2c3338]"
            />
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 8. TABLE OF CONTENTS / FACT CHECK / FALLBACK             */}
      {/* ======================================================== */}
      {["table-of-contents", "fact-check"].includes(slug) && (
        <div className="rounded-sm border border-[#c3c4c7] bg-white p-5 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-[#1d2327] border-b border-[#f0f0f1] pb-2">
            {pluginName}
          </h2>

          <div>
            <label className="block text-xs font-semibold text-[#1d2327] mb-1">
              {t("admin.plugins.title_header", "Header Title", "عنوان الترويسة")}
            </label>
            <input
              type="text"
              value={formData.title || formData.organization || ""}
              onChange={(e) => updateField(slug === "fact-check" ? "organization" : "title", e.target.value)}
              className="w-full rounded-[3px] border border-[#8c8f94] bg-white px-3 py-1.5 text-xs text-[#2c3338]"
            />
          </div>
        </div>
      )}
    </div>
  );
}
