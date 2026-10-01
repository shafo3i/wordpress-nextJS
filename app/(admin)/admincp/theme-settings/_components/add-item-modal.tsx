"use client";

import React, { useState } from "react";
import { Puzzle, X } from "lucide-react";
import { HomepageBlockType } from "@/lib/themes/homepage-types";
import { BlockWireframeIcon } from "./block-wireframes";

interface AddItemModalProps {
  open: boolean;
  columnTitle?: string;
  availableBlockTypes: HomepageBlockType[];
  availableWidgets: { type: string; name: string; desc: string }[];
  dict?: Record<string, string>;
  direction?: "rtl" | "ltr";
  onClose: () => void;
  onSelect: (type: "block" | "widget", payload: string) => void;
}

export function AddItemModal({
  open,
  columnTitle,
  availableBlockTypes,
  availableWidgets,
  dict,
  direction = "ltr",
  onClose,
  onSelect,
}: AddItemModalProps) {
  const [activeTab, setActiveTab] = useState<"blocks" | "widgets">("blocks");
  const isRtl = direction === "rtl";

  const t = (key: string, enFallback: string, arFallback: string) => {
    if (isRtl) return dict?.[key] || arFallback;
    return dict?.[key] || enFallback;
  };

  if (!open) return null;

  return (
    <div
      dir={direction}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-lg bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] text-start"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-[#f8fafc] px-5 py-3.5">
          <div>
            <h3 className="text-sm font-bold text-[#1d2327]">
              {t("admin.builder.add_modal_title", "Add to Column", "إضافة إلى العمود")}
              {columnTitle ? ` (${columnTitle})` : ""}
            </h3>
            <p className="text-[11px] text-[#646970]">
              {t(
                "admin.builder.add_modal_desc",
                "Choose an editorial story block or a modular widget to place into this column:",
                "اختر كتلة تحريرية أو أداة لوضعها في هذا العمود:"
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-slate-200 bg-white px-5 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab("blocks")}
            className={`pb-2.5 px-4 text-xs font-bold border-b-2 transition-all ${
              activeTab === "blocks"
                ? "border-[#2271b1] text-[#2271b1]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {t("admin.builder.tab_blocks", "Editorial Blocks", "الكتل التحريرية")} (
            {availableBlockTypes.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("widgets")}
            className={`pb-2.5 px-4 text-xs font-bold border-b-2 transition-all ${
              activeTab === "widgets"
                ? "border-[#2271b1] text-[#2271b1]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {t("admin.builder.tab_widgets", "Modular Widgets", "الأدوات والودجات")} (
            {availableWidgets.length})
          </button>
        </div>

        {/* Modal Body: Rich Visual Grid */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === "blocks" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {availableBlockTypes.map((type) => {
                const name = dict?.[`admin.theme_settings.block.${type}.name`] || type;
                const desc = dict?.[`admin.theme_settings.block.${type}.desc`] || "";
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      onSelect("block", type);
                      onClose();
                    }}
                    className="flex items-start gap-3 rounded-lg border border-[#dcdcde] bg-white p-3 text-start hover:border-[#2271b1] hover:bg-[#f0f6fc] hover:shadow-sm transition-all group"
                  >
                    <div className="flex-shrink-0 pt-0.5">
                      <BlockWireframeIcon type={type} className="w-12 h-8" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-bold text-[#1d2327] group-hover:text-[#2271b1] block text-[13px] leading-snug">
                        + {name}
                      </span>
                      <span className="text-[11px] text-[#646970] leading-tight block mt-1 line-clamp-2">
                        {desc}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {availableWidgets.map((w) => (
                <button
                  key={w.type}
                  type="button"
                  onClick={() => {
                    onSelect("widget", w.type);
                    onClose();
                  }}
                  className="flex items-start gap-3 rounded-lg border border-[#dcdcde] bg-white p-3 text-start hover:border-[#2271b1] hover:bg-[#f0f6fc] hover:shadow-sm transition-all group"
                >
                  <div className="size-10 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center flex-shrink-0">
                    <Puzzle className="size-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-[#1d2327] group-hover:text-[#2271b1] block text-[13px] leading-snug">
                      + {w.name}
                    </span>
                    <span className="text-[11px] text-[#646970] leading-tight block mt-1 line-clamp-2">
                      {w.desc}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
