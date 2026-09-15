"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  Laptop,
  Palette,
  Smartphone,
  Tablet,
  X,
  RotateCcw,
  Type,
  Layout,
  Menu,
  FileText,
  Sliders,
  Footprints,
  Code2,
  Check,
  Search,
  Share2,
  Clock,
  ArrowRight,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { CustomizerPayload, DEFAULT_MODS, ThemeMods } from "@/lib/themes/types";
import { saveCustomizerAction } from "@/app/(admin)/admincp/customize/actions";
import { getFontFamilyCss } from "@/components/site/theme-dynamic-styles";
import { SiteHeader } from "@/components/site/header/site-header";
import { SiteFooter } from "@/components/site/footer/site-footer";
import type { FrontEndThemeContext } from "@/lib/site-theme";

type CustomizerSection =
  | "identity"
  | "colors"
  | "typography"
  | "header"
  | "navigation"
  | "layout"
  | "single"
  | "footer"
  | "css";

export function CustomizerShell({ initialData }: { initialData: CustomizerPayload }) {
  const [selectedThemeSlug, setSelectedThemeSlug] = useState(initialData.themeSlug);
  const [siteTitle, setSiteTitle] = useState(initialData.siteTitle);
  const [siteTagline, setSiteTagline] = useState(initialData.siteTagline);
  const [mods, setMods] = useState<ThemeMods>(initialData.mods);

  const [activeSection, setActiveSection] = useState<CustomizerSection | null>("colors");
  const [deviceMode, setDeviceMode] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [isDirty, setIsDirty] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const currentTheme =
    initialData.allThemes.find((t) => t.slug === selectedThemeSlug) || initialData.allThemes[0];
  const isSelectedActive = selectedThemeSlug === initialData.activeThemeSlug;

  const updateMods = (updates: Partial<ThemeMods>) => {
    setMods((curr) => ({ ...curr, ...updates }));
    setIsDirty(true);
  };

  const handleResetDefaults = () => {
    const defaultMods = DEFAULT_MODS[selectedThemeSlug] || DEFAULT_MODS["ledger-classic"];
    setMods({ ...defaultMods });
    setIsDirty(true);
    setNotice("Reset to theme defaults (Click Publish to save).");
    setTimeout(() => setNotice(null), 3500);
  };

  const handleSwitchTheme = (slug: string) => {
    setSelectedThemeSlug(slug);
    const themeDefaultMods = DEFAULT_MODS[slug] || DEFAULT_MODS["ledger-classic"];
    setMods({ ...themeDefaultMods });
    setIsDirty(false);
    router.push(`/admincp/customize?theme=${slug}`);
  };

  const handlePublish = (activate = false) => {
    startTransition(async () => {
      const res = await saveCustomizerAction(
        selectedThemeSlug,
        mods,
        {
          siteTitle,
          siteTagline,
        },
        activate
      );

      if (res.error) {
        alert(res.error);
      } else {
        setIsDirty(false);
        setNotice(activate ? "Theme activated and published!" : "Customizations published successfully!");
        setTimeout(() => setNotice(null), 3500);
        router.refresh();
      }
    });
  };

  // Color Presets for Quick Picking
  const QUICK_PALETTES = [
    { name: "Broadsheet Blue", hex: "#2271b1" },
    { name: "Crimson Magazine", hex: "#e11d48" },
    { name: "Cyber Emerald", hex: "#10b981" },
    { name: "Financial Amber", hex: "#d97706" },
    { name: "Editorial Stone", hex: "#292524" },
    { name: "Oxford Navy", hex: "#1e3a8a" },
    { name: "Violet Tech", hex: "#7c3aed" },
  ];

  // Font Family Options
  const HEADLINE_FONTS = [
    { id: "playfair", label: "Playfair Display", note: "Classic Broadsheet Serif", class: "font-serif" },
    { id: "merriweather", label: "Merriweather", note: "Warm Literary Editorial Serif", class: "font-serif" },
    { id: "georgia", label: "Georgia", note: "Traditional Newspaper Serif", class: "font-serif" },
    { id: "inter", label: "Inter", note: "Clean High-Legibility Sans", class: "font-sans" },
    { id: "roboto", label: "Roboto", note: "Dynamic Digital News Sans", class: "font-sans" },
    { id: "montserrat", label: "Montserrat", note: "Bold Magazine Display Sans", class: "font-sans" },
    { id: "oswald", label: "Oswald", note: "Condensed Impact Wire Sans", class: "font-sans" },
  ];

  const BODY_FONTS = [
    { id: "inter", label: "Inter (Modern Sans)" },
    { id: "roboto", label: "Roboto (Digital Sans)" },
    { id: "source_serif", label: "Source Serif 4 (Longform Editorial)" },
    { id: "lora", label: "Lora (Literary Serif)" },
    { id: "open_sans", label: "Open Sans (Neutral Sans)" },
  ];

  // Computed Dynamic Styles for Live Preview
  const previewHeadingFont = getFontFamilyCss(
    mods.headingFontFamily,
    mods.headingFont === "sans" ? "sans" : "serif"
  );
  const previewBodyFont = getFontFamilyCss(mods.bodyFontFamily, "sans");

  const previewPrimary = mods.primaryColor || "#2271b1";
  const previewBg = mods.backgroundColor || (mods.darkMode ? "#0a0f1d" : "#f8f7f4");
  const previewSurface = mods.surfaceColor || (mods.darkMode ? "#111827" : "#ffffff");
  const previewText = mods.textColor || (mods.darkMode ? "#e2e8f0" : "#1d2327");
  const previewHeading = mods.headingColor || (mods.darkMode ? "#f8fafc" : "#0f172a");
  const previewMuted = mods.mutedTextColor || (mods.darkMode ? "#94a3b8" : "#64748b");
  const previewBorder = mods.borderColor || (mods.darkMode ? "#1f2937" : "#e2e8f0");
  const previewRadius = mods.borderRadius ? `${mods.borderRadius}px` : "4px";
  const previewHeaderBg = mods.headerBg || (mods.darkMode ? "#0a0f1d" : "#ffffff");
  const previewHeaderColor = mods.headerTextColor || (mods.darkMode ? "#f8fafc" : "#0f172a");
  const previewNavBarBg = mods.navBarBg || (mods.darkMode ? "#0f172a" : "#ffffff");
  const previewNavLink = mods.navLinkColor || (mods.darkMode ? "#e2e8f0" : "#1d2327");
  const previewTopBarBg = mods.topBarBg || (mods.darkMode ? "#030712" : "#0f172a");
  const previewTopBarText = mods.topBarTextColor || "#f8fafc";
  const previewFooterBg = mods.footerBg || (mods.darkMode ? "#030712" : "#0f172a");
  const previewFooterText = mods.footerTextColor || "#94a3b8";

  const liveThemeContext: FrontEndThemeContext = {
    themeSlug: selectedThemeSlug,
    siteTitle: siteTitle || "Signal News",
    siteTagline: siteTagline || "The Independent News Journal",
    primaryColor: previewPrimary,
    headerLayout: mods.headerLayout || "classic",
    headingFont: mods.headingFont || "serif",
    darkMode: Boolean(mods.darkMode),
    footerCopyright: mods.footerCopyright || "© 2026 Signal News. All rights reserved.",
    primaryNav: initialData.primaryNav || [],
    footerNav: initialData.footerNav || [],
    mods,
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#f0f0f1] text-[13px] font-sans">
      {/* External Google Fonts for Real-time Typography Preview */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400..700;1,400..700&family=Merriweather:ital,wght@0,300;0,400;0,700;0,900;1,300;1,400;1,700&family=Montserrat:ital,wght@0,400..900;1,400..900&family=Open+Sans:ital,wght@0,300..800;1,300..800&family=Oswald:wght@300..700&family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Roboto:ital,wght@0,300..900;1,300..900&family=Source+Serif+4:ital,opsz,wght@0,8..60,400..900;1,8..60,400..900&display=swap"
      />

      {/* Top Customizer Header */}
      <header className="flex h-12 items-center justify-between border-b border-[#c3c4c7] bg-[#1d2327] px-4 text-white">
        <div className="flex items-center gap-3">
          <Link
            href="/admincp/themes"
            className="flex size-7 items-center justify-center rounded text-white/70 hover:bg-white/10 hover:text-white transition-colors"
            title="Close Customizer"
          >
            <X className="size-5" />
          </Link>

          {/* Theme Switcher Selector */}
          <div className="flex items-center gap-2 border-l border-white/20 pl-3">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-slate-400">
                Customizing Theme:
              </span>
              <select
                value={selectedThemeSlug}
                onChange={(e) => handleSwitchTheme(e.target.value)}
                className="bg-slate-800 text-white font-semibold text-xs rounded px-2 py-0.5 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-[#2271b1] cursor-pointer"
              >
                {initialData.allThemes.map((theme) => (
                  <option key={theme.slug} value={theme.slug}>
                    {theme.name} {theme.slug === initialData.activeThemeSlug ? "(Active)" : ""}
                  </option>
                ))}
              </select>
            </div>
            {isSelectedActive ? (
              <span className="rounded bg-emerald-600/80 px-1.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider hidden sm:inline">
                Active
              </span>
            ) : (
              <span className="rounded bg-amber-600/80 px-1.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider hidden sm:inline">
                Previewing
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {notice && (
            <span className="text-[12px] font-medium text-emerald-400 animate-fade-in flex items-center gap-1">
              <Check className="size-3.5" /> {notice}
            </span>
          )}

          {/* Device Preview Icons */}
          <div className="hidden sm:flex items-center gap-1 rounded bg-slate-800 p-1">
            <button
              type="button"
              onClick={() => setDeviceMode("desktop")}
              className={`p-1 rounded ${
                deviceMode === "desktop" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"
              }`}
              title="Desktop Preview"
            >
              <Laptop className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setDeviceMode("tablet")}
              className={`p-1 rounded ${
                deviceMode === "tablet" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"
              }`}
              title="Tablet Preview"
            >
              <Tablet className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setDeviceMode("mobile")}
              className={`p-1 rounded ${
                deviceMode === "mobile" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"
              }`}
              title="Mobile Preview"
            >
              <Smartphone className="size-4" />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="rounded-[3px] border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-300 hover:text-white hover:bg-slate-700 transition-colors flex items-center gap-1"
              title="Reset this theme to signature default styling"
            >
              <RotateCcw className="size-3" /> Reset Defaults
            </button>

            {!isSelectedActive && (
              <button
                type="button"
                disabled={isPending}
                onClick={() => handlePublish(true)}
                className="rounded-[3px] border border-emerald-600 bg-emerald-600 px-3 py-1 font-semibold text-white shadow hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {isPending ? "Activating..." : "Activate & Publish"}
              </button>
            )}

            <button
              type="button"
              disabled={isPending || (!isDirty && isSelectedActive)}
              onClick={() => handlePublish(false)}
              className="rounded-[3px] border border-[#2271b1] bg-[#2271b1] px-4 py-1 font-semibold text-white shadow hover:bg-[#135e96] transition-colors disabled:opacity-50"
            >
              {isPending ? "Publishing..." : isDirty ? "Publish" : "Published"}
            </button>
          </div>
        </div>
      </header>

      {/* Split-Screen Workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Controls Sidebar */}
        <aside className="w-80 sm:w-[360px] flex-shrink-0 border-r border-[#c3c4c7] bg-[#f0f0f1] overflow-y-auto">
          <div className="p-3 border-b border-[#dcdcde] bg-white">
            <p className="text-[12px] text-[#646970]">
              Customizing <strong className="text-[#1d2327]">{currentTheme.name}</strong>. Adjust styling below and see live changes in the preview pane.
            </p>
          </div>

          <div className="divide-y divide-[#c3c4c7]">
            {/* 1. SITE IDENTITY */}
            <div>
              <button
                type="button"
                onClick={() => setActiveSection(activeSection === "identity" ? null : "identity")}
                className="flex w-full items-center justify-between bg-white px-4 py-3 font-semibold text-[#2c3338] hover:bg-[#f6f7f7] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-[#2271b1]" />
                  <span>Site Identity & Branding</span>
                </div>
                {activeSection === "identity" ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
              </button>

              {activeSection === "identity" && (
                <div className="p-4 space-y-4 bg-[#f6f7f7]">
                  <div>
                    <label className="block text-[12px] font-medium text-[#50575e] mb-1">
                      Site Title
                    </label>
                    <input
                      type="text"
                      value={siteTitle}
                      onChange={(e) => {
                        setSiteTitle(e.target.value);
                        setIsDirty(true);
                      }}
                      className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px] text-[#2c3338] focus:border-[#2271b1] focus:outline-none focus:ring-1 focus:ring-[#2271b1]"
                    />
                    <label className="flex items-center gap-2 mt-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={mods.showSiteTitle !== false}
                        onChange={(e) => updateMods({ showSiteTitle: e.target.checked })}
                        className="rounded border-[#8c8f94] text-[#2271b1]"
                      />
                      <span className="text-[11px] text-[#646970]">Display Site Title in Header</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-[12px] font-medium text-[#50575e] mb-1">
                      Tagline / Publication Motto
                    </label>
                    <input
                      type="text"
                      value={siteTagline}
                      onChange={(e) => {
                        setSiteTagline(e.target.value);
                        setIsDirty(true);
                      }}
                      className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px] text-[#2c3338] focus:border-[#2271b1] focus:outline-none focus:ring-1 focus:ring-[#2271b1]"
                    />
                    <label className="flex items-center gap-2 mt-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={mods.showTagline !== false}
                        onChange={(e) => updateMods({ showTagline: e.target.checked })}
                        className="rounded border-[#8c8f94] text-[#2271b1]"
                      />
                      <span className="text-[11px] text-[#646970]">Display Tagline in Header</span>
                    </label>
                  </div>

                  <div className="border-t border-[#dcdcde] pt-3">
                    <label className="block text-[12px] font-medium text-[#50575e] mb-1">
                      Custom Logo Image URL (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="https://.../logo.png"
                      value={mods.logoUrl || ""}
                      onChange={(e) => updateMods({ logoUrl: e.target.value })}
                      className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px] text-[#2c3338] font-mono text-[11px] focus:border-[#2271b1] focus:outline-none focus:ring-1 focus:ring-[#2271b1]"
                    />
                    {mods.logoUrl && (
                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between text-[11px] text-[#646970]">
                          <span>Logo Width:</span>
                          <span className="font-semibold">{mods.logoWidth || 180}px</span>
                        </div>
                        <input
                          type="range"
                          min="80"
                          max="320"
                          step="5"
                          value={mods.logoWidth || 180}
                          onChange={(e) => updateMods({ logoWidth: Number(e.target.value) })}
                          className="w-full cursor-pointer accent-[#2271b1]"
                        />
                      </div>
                    )}
                  </div>

                  <div className="border-t border-[#dcdcde] pt-3">
                    <label className="block text-[12px] font-medium text-[#50575e] mb-1">
                      Site Icon / Favicon URL
                    </label>
                    <input
                      type="text"
                      placeholder="https://.../favicon.ico"
                      value={mods.faviconUrl || ""}
                      onChange={(e) => updateMods({ faviconUrl: e.target.value })}
                      className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px] text-[#2c3338] font-mono text-[11px] focus:border-[#2271b1] focus:outline-none focus:ring-1 focus:ring-[#2271b1]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 2. COLORS & SCHEME */}
            <div>
              <button
                type="button"
                onClick={() => setActiveSection(activeSection === "colors" ? null : "colors")}
                className="flex w-full items-center justify-between bg-white px-4 py-3 font-semibold text-[#2c3338] hover:bg-[#f6f7f7] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Palette className="size-4 text-[#2271b1]" />
                  <span>Color Palette & Scheme</span>
                </div>
                {activeSection === "colors" ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
              </button>

              {activeSection === "colors" && (
                <div className="p-4 space-y-4 bg-[#f6f7f7]">
                  {/* Quick Preset Chips */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Signature Palettes
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_PALETTES.map((pal) => (
                        <button
                          key={pal.hex}
                          type="button"
                          onClick={() => updateMods({ primaryColor: pal.hex })}
                          className={`flex items-center gap-1.5 px-2 py-1 rounded text-[11px] border transition-all ${
                            mods.primaryColor === pal.hex
                              ? "border-[#2271b1] bg-[#f0f6fc] font-bold text-[#2271b1]"
                              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                          }`}
                        >
                          <span
                            className="size-3 rounded-full border border-black/10"
                            style={{ backgroundColor: pal.hex }}
                          />
                          {pal.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Primary & Secondary Color Pickers */}
                  <div className="space-y-3 border-t border-[#dcdcde] pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-medium text-[#50575e]">Primary Brand Accent</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={mods.primaryColor || "#2271b1"}
                          onChange={(e) => updateMods({ primaryColor: e.target.value })}
                          className="size-7 cursor-pointer rounded border border-[#8c8f94] p-0.5 bg-white"
                        />
                        <input
                          type="text"
                          value={mods.primaryColor || "#2271b1"}
                          onChange={(e) => updateMods({ primaryColor: e.target.value })}
                          className="h-[28px] w-24 rounded border border-[#8c8f94] bg-white px-2 font-mono text-[11px] text-[#2c3338]"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-medium text-[#50575e]">Secondary Accent / Hover</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={mods.secondaryColor || "#135e96"}
                          onChange={(e) => updateMods({ secondaryColor: e.target.value })}
                          className="size-7 cursor-pointer rounded border border-[#8c8f94] p-0.5 bg-white"
                        />
                        <input
                          type="text"
                          value={mods.secondaryColor || "#135e96"}
                          onChange={(e) => updateMods({ secondaryColor: e.target.value })}
                          className="h-[28px] w-24 rounded border border-[#8c8f94] bg-white px-2 font-mono text-[11px] text-[#2c3338]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Page Canvas & Card Surfaces */}
                  <div className="space-y-3 border-t border-[#dcdcde] pt-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      Surfaces & Backgrounds
                    </span>

                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-medium text-[#50575e]">Canvas Background</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={mods.backgroundColor || "#f8f7f4"}
                          onChange={(e) => updateMods({ backgroundColor: e.target.value })}
                          className="size-7 cursor-pointer rounded border border-[#8c8f94] p-0.5 bg-white"
                        />
                        <input
                          type="text"
                          value={mods.backgroundColor || "#f8f7f4"}
                          onChange={(e) => updateMods({ backgroundColor: e.target.value })}
                          className="h-[28px] w-24 rounded border border-[#8c8f94] bg-white px-2 font-mono text-[11px] text-[#2c3338]"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-medium text-[#50575e]">Card Surface Background</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={mods.surfaceColor || "#ffffff"}
                          onChange={(e) => updateMods({ surfaceColor: e.target.value })}
                          className="size-7 cursor-pointer rounded border border-[#8c8f94] p-0.5 bg-white"
                        />
                        <input
                          type="text"
                          value={mods.surfaceColor || "#ffffff"}
                          onChange={(e) => updateMods({ surfaceColor: e.target.value })}
                          className="h-[28px] w-24 rounded border border-[#8c8f94] bg-white px-2 font-mono text-[11px] text-[#2c3338]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Text & Headlines Colors */}
                  <div className="space-y-3 border-t border-[#dcdcde] pt-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      Text & Typography Colors
                    </span>

                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-medium text-[#50575e]">Headlines / Title Color</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={mods.headingColor || "#0f172a"}
                          onChange={(e) => updateMods({ headingColor: e.target.value })}
                          className="size-7 cursor-pointer rounded border border-[#8c8f94] p-0.5 bg-white"
                        />
                        <input
                          type="text"
                          value={mods.headingColor || "#0f172a"}
                          onChange={(e) => updateMods({ headingColor: e.target.value })}
                          className="h-[28px] w-24 rounded border border-[#8c8f94] bg-white px-2 font-mono text-[11px] text-[#2c3338]"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-medium text-[#50575e]">Body Paragraph Color</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={mods.textColor || "#1d2327"}
                          onChange={(e) => updateMods({ textColor: e.target.value })}
                          className="size-7 cursor-pointer rounded border border-[#8c8f94] p-0.5 bg-white"
                        />
                        <input
                          type="text"
                          value={mods.textColor || "#1d2327"}
                          onChange={(e) => updateMods({ textColor: e.target.value })}
                          className="h-[28px] w-24 rounded border border-[#8c8f94] bg-white px-2 font-mono text-[11px] text-[#2c3338]"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-medium text-[#50575e]">Borders & Rules Color</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={mods.borderColor || "#e2e8f0"}
                          onChange={(e) => updateMods({ borderColor: e.target.value })}
                          className="size-7 cursor-pointer rounded border border-[#8c8f94] p-0.5 bg-white"
                        />
                        <input
                          type="text"
                          value={mods.borderColor || "#e2e8f0"}
                          onChange={(e) => updateMods({ borderColor: e.target.value })}
                          className="h-[28px] w-24 rounded border border-[#8c8f94] bg-white px-2 font-mono text-[11px] text-[#2c3338]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dark Mode Switcher */}
                  <div className="border-t border-[#dcdcde] pt-3">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-[12px] font-medium text-[#50575e]">
                        Dark Mode Overrides
                      </span>
                      <input
                        type="checkbox"
                        checked={Boolean(mods.darkMode)}
                        onChange={(e) => updateMods({ darkMode: e.target.checked })}
                        className="h-4 w-4 rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* 3. TYPOGRAPHY ENGINE */}
            <div>
              <button
                type="button"
                onClick={() => setActiveSection(activeSection === "typography" ? null : "typography")}
                className="flex w-full items-center justify-between bg-white px-4 py-3 font-semibold text-[#2c3338] hover:bg-[#f6f7f7] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Type className="size-4 text-[#2271b1]" />
                  <span>Typography Engine</span>
                </div>
                {activeSection === "typography" ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
              </button>

              {activeSection === "typography" && (
                <div className="p-4 space-y-4 bg-[#f6f7f7]">
                  {/* Headline Font Selection */}
                  <div>
                    <label className="block text-[12px] font-medium text-[#50575e] mb-1.5">
                      Headline Font Family
                    </label>
                    <div className="space-y-1.5">
                      {HEADLINE_FONTS.map((font) => {
                        const isSelected =
                          (mods.headingFontFamily || (mods.headingFont === "sans" ? "inter" : "playfair")) ===
                          font.id;
                        return (
                          <label
                            key={font.id}
                            className={`flex items-center justify-between p-2 rounded border cursor-pointer transition-colors ${
                              isSelected
                                ? "border-[#2271b1] bg-[#f0f6fc] ring-1 ring-[#2271b1]"
                                : "border-[#dcdcde] bg-white hover:bg-slate-50"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="radio"
                                name="headingFontFamily"
                                value={font.id}
                                checked={isSelected}
                                onChange={() =>
                                  updateMods({
                                    headingFontFamily: font.id as any,
                                    headingFont: font.class === "font-serif" ? "serif" : "sans",
                                  })
                                }
                                className="text-[#2271b1]"
                              />
                              <span className={`text-[13px] font-semibold text-[#2c3338] ${font.class}`}>
                                {font.label}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400">{font.note}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Body Font Selection */}
                  <div className="border-t border-[#dcdcde] pt-3">
                    <label className="block text-[12px] font-medium text-[#50575e] mb-1.5">
                      Body & Story Font Family
                    </label>
                    <select
                      value={mods.bodyFontFamily || "inter"}
                      onChange={(e) => updateMods({ bodyFontFamily: e.target.value as any })}
                      className="w-full h-[32px] rounded border border-[#8c8f94] bg-white px-2 text-[12px] text-[#2c3338] focus:border-[#2271b1] focus:outline-none"
                    >
                      {BODY_FONTS.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Base Font Size Slider */}
                  <div className="border-t border-[#dcdcde] pt-3 space-y-1">
                    <div className="flex justify-between text-[12px] text-[#50575e]">
                      <span>Base Font Size</span>
                      <span className="font-semibold text-[#1d2327]">{mods.baseFontSize || 16}px</span>
                    </div>
                    <input
                      type="range"
                      min="14"
                      max="18"
                      step="1"
                      value={mods.baseFontSize || 16}
                      onChange={(e) => updateMods({ baseFontSize: Number(e.target.value) })}
                      className="w-full cursor-pointer accent-[#2271b1]"
                    />
                  </div>

                  {/* Headline Transform & Weight */}
                  <div className="border-t border-[#dcdcde] pt-3 grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-[#50575e] mb-1">
                        Headline Weight
                      </label>
                      <select
                        value={mods.headingFontWeight || "700"}
                        onChange={(e) => updateMods({ headingFontWeight: e.target.value as any })}
                        className="w-full h-[30px] rounded border border-[#8c8f94] bg-white px-2 text-[11px] text-[#2c3338]"
                      >
                        <option value="400">Regular 400</option>
                        <option value="600">Semi-Bold 600</option>
                        <option value="700">Bold 700</option>
                        <option value="800">Extra Bold 800</option>
                        <option value="900">Black 900</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-[#50575e] mb-1">
                        Text Transform
                      </label>
                      <select
                        value={mods.headingTransform || "none"}
                        onChange={(e) => updateMods({ headingTransform: e.target.value as any })}
                        className="w-full h-[30px] rounded border border-[#8c8f94] bg-white px-2 text-[11px] text-[#2c3338]"
                      >
                        <option value="none">Normal Case</option>
                        <option value="uppercase">UPPERCASE</option>
                        <option value="capitalize">Capitalize</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 4. HEADER & MASTHEAD */}
            <div>
              <button
                type="button"
                onClick={() => setActiveSection(activeSection === "header" ? null : "header")}
                className="flex w-full items-center justify-between bg-white px-4 py-3 font-semibold text-[#2c3338] hover:bg-[#f6f7f7] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Layout className="size-4 text-[#2271b1]" />
                  <span>Header & Masthead</span>
                </div>
                {activeSection === "header" ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
              </button>

              {activeSection === "header" && (
                <div className="p-4 space-y-4 bg-[#f6f7f7]">
                  {/* Masthead Layout Modes */}
                  <div>
                    <label className="block text-[12px] font-medium text-[#50575e] mb-1.5">
                      Masthead Architectural Style
                    </label>
                    <div className="space-y-1.5">
                      {[
                        { key: "classic", label: "Classic Newspaper Broadsheet", desc: "Centered nameplate, dateline, double rules" },
                        { key: "magazine", label: "Magazine Multi-tier", desc: "Top ticker bar, brand row, full-bleed navbar" },
                        { key: "minimal", label: "Clean Minimalist Navbar", desc: "Left logo, inline navigation, right action" },
                        { key: "centered", label: "Centered Editorial", desc: "Symmetric masthead with balanced side elements" },
                      ].map((h) => (
                        <label
                          key={h.key}
                          className={`flex items-start gap-2.5 p-2 rounded border cursor-pointer transition-colors ${
                            mods.headerLayout === h.key
                              ? "border-[#2271b1] bg-[#f0f6fc] ring-1 ring-[#2271b1]"
                              : "border-[#dcdcde] bg-white hover:bg-slate-50"
                          }`}
                        >
                          <input
                            type="radio"
                            name="headerLayout"
                            value={h.key}
                            checked={mods.headerLayout === h.key}
                            onChange={() => updateMods({ headerLayout: h.key as any })}
                            className="mt-0.5 text-[#2271b1]"
                          />
                          <div>
                            <span className="text-[12px] font-semibold text-[#2c3338] block">{h.label}</span>
                            <span className="text-[10px] text-slate-500 block leading-tight">{h.desc}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Top Bar Ticker & Controls */}
                  <div className="border-t border-[#dcdcde] pt-3 space-y-2.5">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-[12px] font-medium text-[#50575e]">Show Top Utility / Breaking Bar</span>
                      <input
                        type="checkbox"
                        checked={mods.showTopBar !== false}
                        onChange={(e) => updateMods({ showTopBar: e.target.checked })}
                        className="rounded border-[#8c8f94] text-[#2271b1]"
                      />
                    </label>

                    {mods.showTopBar !== false && (
                      <div>
                        <label className="block text-[11px] font-medium text-[#646970] mb-1">
                          Breaking News Ticker Banner Text
                        </label>
                        <input
                          type="text"
                          value={mods.topBarTickerText || ""}
                          placeholder="MARKETS CLOSE UP: TECH LEADS BULLISH RALLY"
                          onChange={(e) => updateMods({ topBarTickerText: e.target.value })}
                          className="h-[28px] w-full rounded border border-[#8c8f94] bg-white px-2 text-[12px] text-[#2c3338]"
                        />
                      </div>
                    )}
                  </div>

                  {/* Additional Header Toggles */}
                  <div className="border-t border-[#dcdcde] pt-3 space-y-2">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-[12px] font-medium text-[#50575e]">Sticky Header on Scroll</span>
                      <input
                        type="checkbox"
                        checked={Boolean(mods.stickyHeader)}
                        onChange={(e) => updateMods({ stickyHeader: e.target.checked })}
                        className="rounded border-[#8c8f94] text-[#2271b1]"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-[12px] font-medium text-[#50575e]">Show Date Line in Masthead</span>
                      <input
                        type="checkbox"
                        checked={mods.showDateInHeader !== false}
                        onChange={(e) => updateMods({ showDateInHeader: e.target.checked })}
                        className="rounded border-[#8c8f94] text-[#2271b1]"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-[12px] font-medium text-[#50575e]">Show Social Icons in Header</span>
                      <input
                        type="checkbox"
                        checked={mods.showSocialIconsInHeader !== false}
                        onChange={(e) => updateMods({ showSocialIconsInHeader: e.target.checked })}
                        className="rounded border-[#8c8f94] text-[#2271b1]"
                      />
                    </label>
                  </div>

                  {/* Header Border Style */}
                  <div className="border-t border-[#dcdcde] pt-3">
                    <label className="block text-[12px] font-medium text-[#50575e] mb-1">
                      Header Bottom Rule Style
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "double", label: "Classic Double" },
                        { id: "solid", label: "Single Thin" },
                        { id: "none", label: "Borderless" },
                      ].map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => updateMods({ headerBorderStyle: b.id as any })}
                          className={`p-1.5 rounded text-[11px] font-medium border text-center transition-colors ${
                            (mods.headerBorderStyle || "double") === b.id
                              ? "border-[#2271b1] bg-[#f0f6fc] text-[#2271b1] font-bold"
                              : "border-[#dcdcde] bg-white text-slate-700"
                          }`}
                        >
                          {b.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 5. NAVIGATION BAR */}
            <div>
              <button
                type="button"
                onClick={() => setActiveSection(activeSection === "navigation" ? null : "navigation")}
                className="flex w-full items-center justify-between bg-white px-4 py-3 font-semibold text-[#2c3338] hover:bg-[#f6f7f7] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Menu className="size-4 text-[#2271b1]" />
                  <span>Navigation Bar</span>
                </div>
                {activeSection === "navigation" ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
              </button>

              {activeSection === "navigation" && (
                <div className="p-4 space-y-4 bg-[#f6f7f7]">
                  {/* Menu Alignment */}
                  <div>
                    <label className="block text-[12px] font-medium text-[#50575e] mb-1">
                      Menu Item Alignment
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { id: "left", label: "Left" },
                        { id: "center", label: "Center" },
                        { id: "right", label: "Right" },
                        { id: "between", label: "Justify" },
                      ].map((align) => (
                        <button
                          key={align.id}
                          type="button"
                          onClick={() => updateMods({ navAlignment: align.id as any })}
                          className={`py-1.5 rounded text-[11px] border text-center transition-colors ${
                            (mods.navAlignment || "left") === align.id
                              ? "border-[#2271b1] bg-[#f0f6fc] font-bold text-[#2271b1]"
                              : "border-[#dcdcde] bg-white text-slate-700"
                          }`}
                        >
                          {align.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Link Visual Style */}
                  <div className="border-t border-[#dcdcde] pt-3">
                    <label className="block text-[12px] font-medium text-[#50575e] mb-1">
                      Link Item Styling
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: "classic-text", label: "Classic Text" },
                        { id: "underlined", label: "Underlined" },
                        { id: "pill-badge", label: "Pill Badges" },
                      ].map((styleOpt) => (
                        <button
                          key={styleOpt.id}
                          type="button"
                          onClick={() => updateMods({ navStyle: styleOpt.id as any })}
                          className={`py-1.5 rounded text-[11px] border text-center transition-colors ${
                            (mods.navStyle || "classic-text") === styleOpt.id
                              ? "border-[#2271b1] bg-[#f0f6fc] font-bold text-[#2271b1]"
                              : "border-[#dcdcde] bg-white text-slate-700"
                          }`}
                        >
                          {styleOpt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Uppercase & Search Toggles */}
                  <div className="border-t border-[#dcdcde] pt-3 space-y-2">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-[12px] font-medium text-[#50575e]">UPPERCASE Menu Links</span>
                      <input
                        type="checkbox"
                        checked={Boolean(mods.navUppercase)}
                        onChange={(e) => updateMods({ navUppercase: e.target.checked })}
                        className="rounded border-[#8c8f94] text-[#2271b1]"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-[12px] font-medium text-[#50575e]">Show Search Icon in Nav</span>
                      <input
                        type="checkbox"
                        checked={mods.showSearchInNav !== false}
                        onChange={(e) => updateMods({ showSearchInNav: e.target.checked })}
                        className="rounded border-[#8c8f94] text-[#2271b1]"
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* 6. LAYOUT & CONTAINER GEOMETRY */}
            <div>
              <button
                type="button"
                onClick={() => setActiveSection(activeSection === "layout" ? null : "layout")}
                className="flex w-full items-center justify-between bg-white px-4 py-3 font-semibold text-[#2c3338] hover:bg-[#f6f7f7] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Sliders className="size-4 text-[#2271b1]" />
                  <span>Layout & Container Geometry</span>
                </div>
                {activeSection === "layout" ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
              </button>

              {activeSection === "layout" && (
                <div className="p-4 space-y-4 bg-[#f6f7f7]">
                  {/* Container Max Width */}
                  <div>
                    <label className="block text-[12px] font-medium text-[#50575e] mb-1">
                      Container Maximum Width
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "1140", label: "Standard (1140px)" },
                        { id: "1280", label: "Wide (1280px)" },
                        { id: "1440", label: "Maxi (1440px)" },
                      ].map((w) => (
                        <button
                          key={w.id}
                          type="button"
                          onClick={() => updateMods({ containerWidth: w.id as any })}
                          className={`p-2 rounded border text-[11px] text-center transition-colors ${
                            (mods.containerWidth || "1280") === w.id
                              ? "border-[#2271b1] bg-[#f0f6fc] font-bold text-[#2271b1]"
                              : "border-[#dcdcde] bg-white text-slate-700"
                          }`}
                        >
                          {w.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Corner Radius */}
                  <div className="border-t border-[#dcdcde] pt-3">
                    <label className="block text-[12px] font-medium text-[#50575e] mb-1">
                      Corner Radius (Cards & Badges)
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { id: "0", label: "Sharp 0px", radius: "rounded-none" },
                        { id: "4", label: "Classic 4px", radius: "rounded-sm" },
                        { id: "8", label: "Modern 8px", radius: "rounded-md" },
                        { id: "16", label: "Soft 16px", radius: "rounded-xl" },
                      ].map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => updateMods({ borderRadius: r.id as any })}
                          className={`p-2 rounded border text-[11px] text-center transition-colors ${
                            (mods.borderRadius || "4") === r.id
                              ? "border-[#2271b1] bg-[#f0f6fc] font-bold text-[#2271b1]"
                              : "border-[#dcdcde] bg-white text-slate-700"
                          }`}
                        >
                          <div className={`size-4 mx-auto mb-1 border-2 border-slate-400 ${r.radius}`} />
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Card Border & Shadow Style */}
                  <div className="border-t border-[#dcdcde] pt-3">
                    <label className="block text-[12px] font-medium text-[#50575e] mb-1">
                      Card Container Elevation
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "flat-bordered", label: "Flat Bordered" },
                        { id: "lifted-shadow", label: "Hover Lift Shadow" },
                        { id: "clean-minimal", label: "Clean Borderless" },
                      ].map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => updateMods({ cardStyle: c.id as any })}
                          className={`p-2 rounded border text-[11px] text-center transition-colors ${
                            (mods.cardStyle || "flat-bordered") === c.id
                              ? "border-[#2271b1] bg-[#f0f6fc] font-bold text-[#2271b1]"
                              : "border-[#dcdcde] bg-white text-slate-700"
                          }`}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 7. SINGLE POST & ARTICLE META */}
            <div>
              <button
                type="button"
                onClick={() => setActiveSection(activeSection === "single" ? null : "single")}
                className="flex w-full items-center justify-between bg-white px-4 py-3 font-semibold text-[#2c3338] hover:bg-[#f6f7f7] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <FileText className="size-4 text-[#2271b1]" />
                  <span>Single Post & Article Meta</span>
                </div>
                {activeSection === "single" ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
              </button>

              {activeSection === "single" && (
                <div className="p-4 space-y-3 bg-[#f6f7f7]">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-[12px] font-medium text-[#50575e]">Show Featured Header Image</span>
                    <input
                      type="checkbox"
                      checked={mods.singleShowFeaturedImage !== false}
                      onChange={(e) => updateMods({ singleShowFeaturedImage: e.target.checked })}
                      className="rounded border-[#8c8f94] text-[#2271b1]"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-[12px] font-medium text-[#50575e]">Show Author Avatar & Byline</span>
                    <input
                      type="checkbox"
                      checked={mods.singleShowAuthorAvatar !== false}
                      onChange={(e) => updateMods({ singleShowAuthorAvatar: e.target.checked })}
                      className="rounded border-[#8c8f94] text-[#2271b1]"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-[12px] font-medium text-[#50575e]">Show Publication Date</span>
                    <input
                      type="checkbox"
                      checked={mods.singleShowDate !== false}
                      onChange={(e) => updateMods({ singleShowDate: e.target.checked })}
                      className="rounded border-[#8c8f94] text-[#2271b1]"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-[12px] font-medium text-[#50575e]">Show Reading Time Badge</span>
                    <input
                      type="checkbox"
                      checked={mods.singleShowReadingTime !== false}
                      onChange={(e) => updateMods({ singleShowReadingTime: e.target.checked })}
                      className="rounded border-[#8c8f94] text-[#2271b1]"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-[12px] font-medium text-[#50575e]">Show Social Share Bar</span>
                    <input
                      type="checkbox"
                      checked={mods.singleShowShareButtons !== false}
                      onChange={(e) => updateMods({ singleShowShareButtons: e.target.checked })}
                      className="rounded border-[#8c8f94] text-[#2271b1]"
                    />
                  </label>

                  <div className="border-t border-[#dcdcde] pt-3">
                    <label className="block text-[12px] font-medium text-[#50575e] mb-1">
                      Reading Column Width
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "narrow", label: "Narrow (680px)" },
                        { id: "standard", label: "Standard (760px)" },
                        { id: "wide", label: "Wide (880px)" },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => updateMods({ singleContentWidth: opt.id as any })}
                          className={`p-1.5 rounded border text-[11px] text-center transition-colors ${
                            (mods.singleContentWidth || "standard") === opt.id
                              ? "border-[#2271b1] bg-[#f0f6fc] font-bold text-[#2271b1]"
                              : "border-[#dcdcde] bg-white text-slate-700"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 8. FOOTER & COPYRIGHT */}
            <div>
              <button
                type="button"
                onClick={() => setActiveSection(activeSection === "footer" ? null : "footer")}
                className="flex w-full items-center justify-between bg-white px-4 py-3 font-semibold text-[#2c3338] hover:bg-[#f6f7f7] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Footprints className="size-4 text-[#2271b1]" />
                  <span>Footer & Copyright</span>
                </div>
                {activeSection === "footer" ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
              </button>

              {activeSection === "footer" && (
                <div className="p-4 space-y-4 bg-[#f6f7f7]">
                  <div>
                    <label className="block text-[12px] font-medium text-[#50575e] mb-1">
                      Footer Column Layout
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[1, 2, 3, 4].map((col) => (
                        <button
                          key={col}
                          type="button"
                          onClick={() => updateMods({ footerColumns: col as any })}
                          className={`py-1.5 rounded text-[11px] border text-center transition-colors ${
                            (mods.footerColumns || 4) === col
                              ? "border-[#2271b1] bg-[#f0f6fc] font-bold text-[#2271b1]"
                              : "border-[#dcdcde] bg-white text-slate-700"
                          }`}
                        >
                          {col} Col
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-[#dcdcde] pt-3">
                    <label className="block text-[12px] font-medium text-[#50575e] mb-1">
                      Copyright Notice
                    </label>
                    <textarea
                      rows={3}
                      value={mods.footerCopyright || ""}
                      onChange={(e) => updateMods({ footerCopyright: e.target.value })}
                      className="w-full rounded-[3px] border border-[#8c8f94] bg-white p-2 text-[12px] text-[#2c3338] focus:border-[#2271b1] focus:outline-none"
                    />
                  </div>

                  <div className="border-t border-[#dcdcde] pt-3 space-y-2">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-[12px] font-medium text-[#50575e]">Show Back to Top Button</span>
                      <input
                        type="checkbox"
                        checked={mods.showBackToTop !== false}
                        onChange={(e) => updateMods({ showBackToTop: e.target.checked })}
                        className="rounded border-[#8c8f94] text-[#2271b1]"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-[12px] font-medium text-[#50575e]">Show Footer Social Links</span>
                      <input
                        type="checkbox"
                        checked={mods.showFooterSocials !== false}
                        onChange={(e) => updateMods({ showFooterSocials: e.target.checked })}
                        className="rounded border-[#8c8f94] text-[#2271b1]"
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* 9. ADDITIONAL CSS */}
            <div>
              <button
                type="button"
                onClick={() => setActiveSection(activeSection === "css" ? null : "css")}
                className="flex w-full items-center justify-between bg-white px-4 py-3 font-semibold text-[#2c3338] hover:bg-[#f6f7f7] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Code2 className="size-4 text-[#2271b1]" />
                  <span>Additional CSS</span>
                </div>
                {activeSection === "css" ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
              </button>

              {activeSection === "css" && (
                <div className="p-4 space-y-3 bg-[#f6f7f7]">
                  <p className="text-[11px] text-[#646970]">
                    Inject custom CSS declarations directly into the theme. You can override any selector or use CSS variables like <code className="bg-slate-200 px-1 py-0.5 rounded text-[10px]">var(--theme-primary)</code>.
                  </p>
                  <textarea
                    rows={8}
                    value={mods.customCss || ""}
                    placeholder={`/* Add custom CSS rules here */\n.site-nameplate {\n  letter-spacing: 0.05em;\n}`}
                    onChange={(e) => updateMods({ customCss: e.target.value })}
                    className="w-full rounded border border-[#8c8f94] bg-[#1e293b] p-2.5 font-mono text-[12px] text-emerald-300 focus:border-[#2271b1] focus:outline-none"
                  />
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Right Live Preview Viewport */}
        <main className="flex-1 overflow-y-auto bg-slate-400/80 p-4 sm:p-6 flex flex-col items-center">
          <div
            className={`transition-all duration-300 shadow-2xl overflow-hidden rounded border border-slate-500/40 ${
              deviceMode === "mobile"
                ? "w-[375px] min-h-[667px]"
                : deviceMode === "tablet"
                ? "w-[768px] min-h-[900px]"
                : "w-full max-w-5xl min-h-[850px]"
            }`}
            style={{
              backgroundColor: previewBg,
              color: previewText,
              fontFamily: `${previewBodyFont}, sans-serif`,
              fontSize: `${mods.baseFontSize || 16}px`,
            }}
          >
            {/* Embedded Live Custom CSS */}
            {mods.customCss && <style dangerouslySetInnerHTML={{ __html: mods.customCss }} />}

            {/* 1. LIVE SITE HEADER & MASTHEAD (Modular SiteHeader) */}
            <SiteHeader theme={liveThemeContext} />


            {/* 4. LIVE CONTENT SAMPLE PREVIEW */}
            <div
              className="p-4 sm:p-8 space-y-8"
              style={{
                maxWidth: mods.containerWidth ? `${mods.containerWidth}px` : "1280px",
                margin: "0 auto",
              }}
            >
              {/* Lead Article Card */}
              <div
                style={{
                  backgroundColor: previewSurface,
                  borderColor: previewBorder,
                  borderRadius: previewRadius,
                }}
                className={`p-6 border transition-all ${
                  mods.cardStyle === "lifted-shadow"
                    ? "shadow-md hover:shadow-lg"
                    : mods.cardStyle === "clean-minimal"
                    ? "border-none shadow-none"
                    : "shadow-sm"
                }`}
              >
                <div className="flex items-center gap-2 mb-2 text-[11px] font-mono text-slate-500">
                  <span
                    style={{ backgroundColor: previewPrimary, borderRadius: previewRadius }}
                    className="text-white px-2 py-0.5 font-bold uppercase text-[10px]"
                  >
                    Breaking Lead
                  </span>
                  <span>Financial Intelligence Desk</span>
                  <span>• 15 mins ago</span>
                </div>

                <h2
                  style={{
                    fontFamily: `${previewHeadingFont}, serif`,
                    color: previewHeading,
                    textTransform: mods.headingTransform || "none",
                    fontWeight: mods.headingFontWeight || "700",
                  }}
                  className="text-2xl sm:text-4xl font-bold tracking-tight mb-3"
                >
                  Global Central Banks Synchronize Policy Measures Amid Resilient Digital Market Expansion
                </h2>

                <p
                  style={{ color: previewText }}
                  className="text-sm leading-relaxed mb-4"
                >
                  Monetary authorities outlined coordinated fiscal benchmarks during today’s opening briefing, signaling stability in regional bond volumes and accelerating commercial investments across infrastructure projects.
                </p>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t" style={{ borderColor: previewBorder }}>
                  <div className="flex items-center gap-2">
                    <div className="size-6 rounded-full bg-slate-300 dark:bg-slate-700 flex items-center justify-center font-bold text-[10px]">
                      ED
                    </div>
                    <span>By Editorial Staff</span>
                  </div>
                  <span style={{ color: previewPrimary }} className="font-semibold flex items-center gap-1">
                    Read Full Story <ArrowRight className="size-3" />
                  </span>
                </div>
              </div>

              {/* 3-Column Story Wire Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    cat: "Technology",
                    title: "Next-Generation Silicon Processors Enter High-Volume Commercial Runs",
                    desc: "Semiconductor foundries report 25% efficiency gains in low-latency mobile inference platforms.",
                  },
                  {
                    cat: "Markets",
                    title: "Energy Transition Commodities Surge as Renewable Deployment Accelerates",
                    desc: "Critical minerals see sustained institutional inflows following quarterly production reports.",
                  },
                  {
                    cat: "Opinion",
                    title: "The Editorial Board on Navigating the New Era of Autonomous Cloud Systems",
                    desc: "Why modern architectural discipline and database integrity will define the decade.",
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: previewSurface,
                      borderColor: previewBorder,
                      borderRadius: previewRadius,
                    }}
                    className="p-5 border shadow-sm space-y-2"
                  >
                    <span
                      style={{ color: previewPrimary }}
                      className="text-[10px] font-bold uppercase tracking-wider block"
                    >
                      {item.cat}
                    </span>
                    <h3
                      style={{
                        fontFamily: `${previewHeadingFont}, serif`,
                        color: previewHeading,
                        fontWeight: mods.headingFontWeight || "700",
                      }}
                      className="text-base font-bold leading-snug"
                    >
                      {item.title}
                    </h3>
                    <p style={{ color: previewMuted }} className="text-xs line-clamp-3">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. LIVE SITE FOOTER (Modular SiteFooter) */}
            <SiteFooter theme={liveThemeContext} />
          </div>
        </main>
      </div>
    </div>
  );
}
