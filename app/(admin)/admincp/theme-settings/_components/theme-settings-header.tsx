"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { Theme } from "@/lib/themes/types";

interface ThemeSettingsHeaderProps {
  themeSlug: string;
  themeName: string;
  allThemes: Theme[];
  isPending: boolean;
  onSave: () => void;
  onReset: () => void;
  dict?: Record<string, string>;
  direction?: "rtl" | "ltr";
}

export function ThemeSettingsHeader({
  themeSlug,
  themeName,
  allThemes,
  isPending,
  onSave,
  onReset,
  dict,
  direction = "ltr",
}: ThemeSettingsHeaderProps) {
  const router = useRouter();
  const [showScreenOptions, setShowScreenOptions] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className="space-y-4">
      {/* WordPress Screen Options & Help tabs */}
      <div className="flex justify-end">
        <div className="flex items-center gap-1 text-[13px]">
          <button
            type="button"
            onClick={() => {
              setShowScreenOptions(!showScreenOptions);
              setShowHelp(false);
            }}
            className={`flex items-center gap-1 rounded-b-[4px] border border-t-0 border-[#c3c4c7] bg-white px-2.5 py-0.5 text-[#50575e] hover:border-[#8c8f94] hover:text-[#1d2327] transition-colors ${
              showScreenOptions ? "border-b-0 bg-[#f0f0f1]" : ""
            }`}
          >
            {dict?.["admin.common.screen_options"] || "Screen Options"} <span className="text-[9px]">{showScreenOptions ? "▲" : "▼"}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setShowHelp(!showHelp);
              setShowScreenOptions(false);
            }}
            className={`flex items-center gap-1 rounded-b-[4px] border border-t-0 border-[#c3c4c7] bg-white px-2.5 py-0.5 text-[#50575e] hover:border-[#8c8f94] hover:text-[#1d2327] transition-colors ${
              showHelp ? "border-b-0 bg-[#f0f0f1]" : ""
            }`}
          >
            {dict?.["admin.common.help"] || "Help"} <span className="text-[9px]">{showHelp ? "▲" : "▼"}</span>
          </button>
        </div>
      </div>

      {showScreenOptions && (
        <div className="border border-[#c3c4c7] bg-white p-4 shadow-[0_1px_1px_rgba(0,0,0,0.04)] text-[13px] text-[#2c3338]">
          <h4 className="font-semibold mb-2">{dict?.["admin.common.screen_options"] || "Screen Options"}</h4>
          <p className="text-[12px] text-[#646970]">
            {direction === "rtl"
              ? "يمكنك سحب وإفلات كتل الأخبار لإعادة ترتيبها في تدفق الصفحة الرئيسية، وتغيير أنماط العرض والتصنيفات."
              : "Drag and drop editorial blocks to reorder your homepage story flow, change display layouts, and filter categories."}
          </p>
        </div>
      )}

      {showHelp && (
        <div className="border border-[#c3c4c7] bg-white p-4 shadow-[0_1px_1px_rgba(0,0,0,0.04)] text-[13px] text-[#2c3338] space-y-2">
          <h4 className="font-semibold">{dict?.["admin.common.help"] || "Help"}</h4>
          <p className="text-[12px] text-[#646970]">
            {direction === "rtl"
              ? "تتيح لك إعدادات القالب تخصيص بنية الصفحة الرئيسية واختيار التخطيط العام (عرض كامل، شريط جانبي، أو شريط مزدوج) وتخصيص كل كتلة إخبارية."
              : "Theme settings allow you to customize your front page architecture, choose sidebar layouts (full width, single sidebar, or dual sidebar), and tune individual magazine blocks."}
          </p>
        </div>
      )}

      {/* Main Header Action Row */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#c3c4c7] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[23px] font-normal leading-[1.3] text-[#1d2327]">
              {dict?.["admin.theme_settings.title"] || "Theme Settings: Homepage Layout"}
            </h1>
            <span className="rounded bg-slate-100 text-slate-700 text-xs px-2.5 py-0.5 font-bold">
              {themeName}
            </span>
          </div>
          <p className="text-[12px] text-[#646970] mt-0.5">
            {dict?.["admin.theme_settings.subtitle"] ||
              "Configure sidebar architecture, news display formats, and drag-and-drop magazine blocks for"}{" "}
            <strong className="text-[#1d2327]">{themeName}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Theme Selector Dropdown */}
          <div className="flex items-center gap-1.5 bg-white border border-[#8c8f94] rounded px-2.5 py-1">
            <span className="text-[11px] font-medium text-slate-500">
              {dict?.["admin.theme_settings.theme_label"] || "Theme:"}
            </span>
            <select
              value={themeSlug}
              onChange={(e) => {
                router.push(`/admincp/theme-settings?theme=${e.target.value}`);
              }}
              className="bg-transparent text-xs font-semibold text-[#1d2327] focus:outline-none cursor-pointer"
            >
              {allThemes.map((t) => (
                <option key={t.slug} value={t.slug}>
                  {t.name} {t.isActive ? dict?.["admin.theme_settings.active_badge"] || "(Active)" : ""}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={onReset}
            title={dict?.["admin.theme_settings.reset_defaults"] || "Reset blocks to theme's signature default layout"}
            className="rounded-[3px] border border-[#dcdcde] bg-white px-3 py-1.5 text-xs font-medium text-[#2c3338] hover:bg-slate-50 transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="size-3.5 text-slate-500" />
            {dict?.["admin.theme_settings.reset_defaults"] || "Reset to Defaults"}
          </button>

          <button
            type="button"
            disabled={isPending}
            onClick={onSave}
            className="rounded-[3px] border border-[#2271b1] bg-[#2271b1] px-4 py-1.5 font-medium text-white hover:bg-[#135e96] transition-colors disabled:opacity-50 shadow-sm"
          >
            {isPending
              ? dict?.["admin.theme_settings.saving"] || "Saving..."
              : dict?.["admin.theme_settings.save_layout"] || "Save Layout"}
          </button>
        </div>
      </div>
    </div>
  );
}
