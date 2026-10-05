"use client";

import Link from "next/link";
import { Check, FileText, Home, Laptop, RotateCcw, Smartphone, Tablet, X } from "lucide-react";
import type { Theme } from "@/lib/themes/types";
import type { PreviewPage } from "@/lib/customizer/preview-protocol";

export type DeviceMode = "desktop" | "tablet" | "mobile";
export type { PreviewPage };

export type PreviewLanguage = { code: string; name: string; nativeName?: string | null };


interface ToolbarProps {
  themes: Theme[];
  themeSlug: string;
  activeThemeSlug: string;
  notice: { type: "success" | "error"; message: string } | null;
  previewPage: PreviewPage;
  onPreviewPage: (page: PreviewPage) => void;
  languages: PreviewLanguage[];
  previewLang: string;
  onPreviewLang: (code: string) => void;
  deviceMode: DeviceMode;
  onDeviceMode: (mode: DeviceMode) => void;
  isDirty: boolean;
  isPending: boolean;
  onSwitchTheme: (slug: string) => void;
  onReset: () => void;
  onPublish: (activate: boolean) => void;
  dict?: Record<string, string>;
}

const DEVICES: { mode: DeviceMode; icon: typeof Laptop; key: string; label: string }[] = [
  { mode: "desktop", icon: Laptop, key: "admin.customizer.device_desktop", label: "Desktop Preview" },
  { mode: "tablet", icon: Tablet, key: "admin.customizer.device_tablet", label: "Tablet Preview" },
  { mode: "mobile", icon: Smartphone, key: "admin.customizer.device_mobile", label: "Mobile Preview" },
];

const segment = (active: boolean) =>
  `flex items-center gap-1 px-2.5 py-1 rounded transition-colors ${
    active ? "bg-[#2271b1] text-white shadow-xs" : "text-slate-400 hover:text-white"
  }`;

export function CustomizerToolbar({
  themes,
  themeSlug,
  activeThemeSlug,
  notice,
  previewPage,
  onPreviewPage,
  languages,
  previewLang,
  onPreviewLang,
  deviceMode,
  onDeviceMode,
  isDirty,
  isPending,
  onSwitchTheme,
  onReset,
  onPublish,
  dict,
}: ToolbarProps) {
  const t = (key: string, fallback: string) => dict?.[key] || fallback;
  const isActive = themeSlug === activeThemeSlug;

  return (
    <header className="flex h-12 items-center justify-between border-b border-[#c3c4c7] bg-[#1d2327] px-4 text-white">
      <div className="flex items-center gap-3">
        <Link
          href="/admincp/themes"
          className="flex size-7 items-center justify-center rounded text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          title={t("admin.customizer.close", "Close Customizer")}
        >
          <X className="size-5" />
        </Link>

        <div className="flex items-center gap-2 border-s border-white/20 ps-3">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-slate-400">
              {t("admin.customizer.customizing", "Customizing Theme:")}
            </span>
            <select
              value={themeSlug}
              onChange={(e) => onSwitchTheme(e.target.value)}
              className="bg-slate-800 text-white font-semibold text-xs rounded px-2 py-0.5 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-[#2271b1] cursor-pointer"
            >
              {themes.map((theme) => (
                <option key={theme.slug} value={theme.slug}>
                  {theme.name} {theme.slug === activeThemeSlug ? t("admin.customizer.active_badge", "(Active)") : ""}
                </option>
              ))}
            </select>
          </div>
          <span
            className={`rounded px-1.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider hidden sm:inline ${
              isActive ? "bg-emerald-600/80" : "bg-amber-600/80"
            }`}
          >
            {isActive ? t("admin.customizer.active", "Active") : t("admin.customizer.previewing", "Previewing")}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {notice && (
          <span
            className={`text-[12px] font-medium flex items-center gap-1 ${
              notice.type === "error" ? "text-rose-400" : "text-emerald-400"
            }`}
          >
            {notice.type === "error" ? "⚠ " : <Check className="size-3.5" />} {notice.message}
          </span>
        )}

        <div className="flex items-center rounded bg-slate-800 p-0.5 text-[11px] font-semibold border border-slate-700">
          <button type="button" onClick={() => onPreviewPage("home")} className={segment(previewPage === "home")}>
            <Home className="size-3.5" />
            <span className="hidden md:inline">{t("admin.customizer.view.home", "Homepage")}</span>
          </button>
          <button type="button" onClick={() => onPreviewPage("single")} className={segment(previewPage === "single")}>
            <FileText className="size-3.5" />
            <span className="hidden md:inline">{t("admin.customizer.view.single", "Single Article")}</span>
          </button>
        </div>

        {languages.length > 1 && (
          <select
            value={previewLang}
            onChange={(e) => onPreviewLang(e.target.value)}
            title={t("admin.customizer.preview_language", "Preview language")}
            className="bg-slate-800 text-white text-[11px] font-semibold rounded px-2 py-1 border border-slate-700 focus:outline-none"
          >
            {languages.map((language) => (
              <option key={language.code} value={language.code}>
                {language.nativeName || language.name}
              </option>
            ))}
          </select>
        )}

        <div className="hidden sm:flex items-center gap-1 rounded bg-slate-800 p-1">
          {DEVICES.map(({ mode, icon: Icon, key, label }) => (
            <button
              key={mode}
              type="button"
              onClick={() => onDeviceMode(mode)}
              title={t(key, label)}
              className={`p-1 rounded ${deviceMode === mode ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"}`}
            >
              <Icon className="size-4" />
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onReset}
            className="rounded-[3px] border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-300 hover:text-white hover:bg-slate-700 transition-colors flex items-center gap-1"
            title={t("admin.customizer.reset_title", "Reset this theme to signature default styling")}
          >
            <RotateCcw className="size-3" /> {t("admin.customizer.reset_defaults", "Reset Defaults")}
          </button>

          {!isActive && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => onPublish(true)}
              className="rounded-[3px] border border-emerald-600 bg-emerald-600 px-3 py-1 font-semibold text-white shadow hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {isPending
                ? t("admin.customizer.activating", "Activating...")
                : t("admin.customizer.activate_publish", "Activate & Publish")}
            </button>
          )}

          <button
            type="button"
            disabled={isPending || (!isDirty && isActive)}
            onClick={() => onPublish(false)}
            className="rounded-[3px] border border-[#2271b1] bg-[#2271b1] px-4 py-1 font-semibold text-white shadow hover:bg-[#135e96] transition-colors disabled:opacity-50"
          >
            {isPending
              ? t("admin.customizer.publishing", "Publishing...")
              : isDirty
                ? t("admin.customizer.publish", "Publish")
                : t("admin.customizer.published", "Published")}
          </button>
        </div>
      </div>
    </header>
  );
}
