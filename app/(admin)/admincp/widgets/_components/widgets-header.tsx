"use client";

import { useState } from "react";

interface WidgetsHeaderProps {
  dict?: Record<string, string>;
  direction?: "rtl" | "ltr";
}

export function WidgetsHeader({ dict, direction = "ltr" }: WidgetsHeaderProps) {
  const [showScreenOptions, setShowScreenOptions] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className="space-y-4">
      {/* WordPress Screen Options & Help drawer */}
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
              ? "يمكنك سحب وإفلات الودجات بين القائمة الجانبية ومناطق الودجات المختلفة."
              : "Drag and drop widgets between the available palette and individual widget area slots."}
          </p>
        </div>
      )}

      {showHelp && (
        <div className="border border-[#c3c4c7] bg-white p-4 shadow-[0_1px_1px_rgba(0,0,0,0.04)] text-[13px] text-[#2c3338] space-y-2">
          <h4 className="font-semibold">{dict?.["admin.common.help"] || "Help"}</h4>
          <p className="text-[12px] text-[#646970]">
            {direction === "rtl"
              ? "الودجات هي كتل محتوى مستقلة يمكن إضافتها إلى الشريط الجانبي أو التذييل. تدعم الإضافات المنصبة أيضاً ودجات مخصصة تلقائياً."
              : "Widgets are independent content blocks you can add to sidebars and footers. Active plugins provide custom widgets automatically."}
          </p>
        </div>
      )}

      {/* Main Title Row */}
      <div className="border-b border-[#c3c4c7] pb-3">
        <h1 className="text-[23px] font-normal leading-[1.3] text-[#1d2327]">
          {dict?.["admin.widgets.title"] || "Widgets"}
        </h1>
        <p className="text-[12px] text-[#646970] mt-0.5">
          {dict?.["admin.widgets.subtitle"] ||
            "Manage sidebars, dual-sidebar columns, and footer widget areas. Active plugins automatically provide widgets below."}
        </p>
      </div>
    </div>
  );
}
