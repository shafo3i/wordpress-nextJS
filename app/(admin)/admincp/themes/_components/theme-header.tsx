"use client";

import { useState } from "react";
import { ThemeUploadZone } from "./theme-upload-zone";

interface ThemeHeaderProps {
  search?: string;
  dict?: Record<string, string>;
  direction?: "rtl" | "ltr";
}

export function ThemeHeader({
  search = "",
  dict,
  direction = "ltr",
}: ThemeHeaderProps) {
  const [showUpload, setShowUpload] = useState(false);

  return (
    <div className="space-y-4">
      {/* Top action row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-[23px] font-normal leading-[1.3] text-[#1d2327]">
            {dict?.["admin.themes.title"] || "Themes"}
          </h1>
          <button
            type="button"
            onClick={() => setShowUpload(!showUpload)}
            className="rounded-[3px] border border-[#2271b1] bg-[#f6f7f7] px-2.5 py-1 text-[13px] font-medium text-[#2271b1] hover:border-[#0a4b78] hover:bg-[#f0f0f1] hover:text-[#0a4b78] transition-colors"
          >
            {dict?.["admin.themes.add_new"] || "Add New Theme"}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <form method="GET" className="flex items-center gap-1">
            <label htmlFor="theme-search-input" className="sr-only">
              {dict?.["admin.themes.search_placeholder"] || "Search installed themes..."}
            </label>
            <input
              id="theme-search-input"
              name="s"
              defaultValue={search}
              placeholder={dict?.["admin.themes.search_placeholder"] || "Search installed themes..."}
              type="search"
              className="h-[30px] w-52 sm:w-64 rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none focus:ring-1 focus:ring-[#2271b1]"
            />
            <button
              type="submit"
              className="h-[30px] rounded-[3px] border border-[#2271b1] bg-[#f6f7f7] px-3 text-[13px] text-[#2271b1] hover:border-[#0a4b78] hover:bg-[#f0f0f1] hover:text-[#0a4b78] transition-colors"
            >
              {dict?.["admin.themes.search_button"] || "Search"}
            </button>
          </form>

          <div className="hidden sm:flex items-center gap-1 text-[13px]">
            <button
              className="flex items-center gap-1 rounded-b-[4px] border border-[#c3c4c7] bg-white px-2.5 py-0.5 text-[#50575e] hover:border-[#8c8f94] hover:text-[#1d2327]"
              type="button"
            >
              {dict?.["admin.common.screen_options"] || "Screen Options"} <span className="text-[9px]">▼</span>
            </button>
            <button
              className="flex items-center gap-1 rounded-b-[4px] border border-[#c3c4c7] bg-white px-2.5 py-0.5 text-[#50575e] hover:border-[#8c8f94] hover:text-[#1d2327]"
              type="button"
            >
              {dict?.["admin.common.help"] || "Help"} <span className="text-[9px]">▼</span>
            </button>
          </div>
        </div>
      </div>

      {/* Upload Drop Zone if toggled */}
      <ThemeUploadZone isOpen={showUpload} dict={dict} direction={direction} />
    </div>
  );
}
