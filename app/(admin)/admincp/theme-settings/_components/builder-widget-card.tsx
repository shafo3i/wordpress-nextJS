"use client";

import React, { useState } from "react";
import { Trash2, Puzzle, Settings2, ChevronDown, ChevronUp } from "lucide-react";
import { BuilderItem } from "@/lib/themes/homepage-types";
import { getWidget } from "@/widgets/registry";

interface BuilderWidgetCardProps {
  item: BuilderItem;
  dict?: Record<string, string>;
  direction?: "rtl" | "ltr";
  onUpdate?: (updates: Partial<BuilderItem>) => void;
  onRemove: () => void;
}

export function BuilderWidgetCard({
  item,
  dict,
  direction = "ltr",
  onUpdate,
  onRemove,
}: BuilderWidgetCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isRtl = direction === "rtl";

  if (item.type !== "widget") return null;

  const widgetId = item.widgetId;
  const mod = widgetId ? getWidget(widgetId) : null;
  const manifest = mod?.manifest;

  const t = (key: string, enFallback: string, arFallback: string) => {
    if (isRtl) return dict?.[key] || arFallback;
    return dict?.[key] || enFallback;
  };

  const widgetName = dict?.[`admin.widgets.descriptor.${widgetId}.name`] || manifest?.name || widgetId || "Widget";
  const isDefaultOrOppositeLang =
    !item.title ||
    item.title === widgetId ||
    item.title === widgetName ||
    (!isRtl && /[\u0600-\u06FF]/.test(item.title)) ||
    (isRtl && /^[A-Za-z0-9\s•\-+()]+$/.test(item.title));

  const displayTitle = isDefaultOrOppositeLang ? widgetName : item.title;
  const desc = dict?.[`admin.widgets.descriptor.${widgetId}.desc`] || manifest?.description || "";
  const AdminForm = mod?.AdminForm;

  return (
    <div className="rounded-[4px] border border-[#c3c4c7] bg-white shadow-sm hover:border-[#8c8f94] transition-all overflow-hidden">
      {/* Header Bar */}
      <div className="p-2.5 flex items-center justify-between gap-2">
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer select-none"
        >
          <div className="size-7 rounded bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center flex-shrink-0">
            <Puzzle className="size-4" />
          </div>
          <div className="min-w-0">
            <strong className="text-[12px] font-semibold text-[#1d2327] block truncate">{displayTitle}</strong>
            {desc && <span className="text-[10px] text-[#646970] block truncate max-w-[200px]">{desc}</span>}
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className={`p-1 rounded text-xs flex items-center gap-1 font-semibold transition-colors ${isExpanded
                ? "bg-indigo-50 text-indigo-600 border border-indigo-200"
                : "text-[#646970] hover:text-indigo-600 hover:bg-slate-100"
              }`}
            title={t("admin.widgets.settings", "Widget Settings", "إعدادات الأداة")}
          >
            <Settings2 className="size-3.5" />
            {isExpanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
          </button>

          <button
            type="button"
            onClick={onRemove}
            className="text-[#b32d2e] hover:text-red-700 p-1 text-[11px] flex items-center gap-1 font-medium hover:bg-red-50 rounded"
            title={t("admin.widgets.remove", "Remove Widget", "إزالة الأداة")}
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Expandable Settings Drawer */}
      {isExpanded && (
        <div className="border-t border-[#dcdcde] bg-[#f8fafc] p-3 text-start space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-2">
            <span className="text-[11px] font-bold text-[#1d2327] uppercase tracking-wider">
              {t("admin.widgets.configure", "Configure Widget Settings", "تخصيص إعدادات الأداة")}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {manifest?.id || widgetId}
            </span>
          </div>

          {AdminForm ? (
            <AdminForm
              item={{
                id: item.id,
                type: widgetId,
                title: item.title || "",
                content: item.config?.content,
                count: item.config?.count,
                displayStyle: item.config?.displayStyle,
                config: item.config || {},
              }}
              onChange={(updates) => {
                const newConfig: Record<string, any> = {
                  ...(item.config || {}),
                  ...(updates.config || {}),
                };
                if (updates.content !== undefined) newConfig.content = updates.content;
                if (updates.count !== undefined) newConfig.count = updates.count;
                if (updates.displayStyle !== undefined) newConfig.displayStyle = updates.displayStyle;

                onUpdate?.({
                  title: updates.title !== undefined ? updates.title : item.title,
                  config: newConfig,
                });
              }}
              dict={dict}
              direction={direction}
            />
          ) : (
            <div>
              <label className="block text-[11px] font-medium text-[#50575e] mb-1">
                {dict?.["admin.widgets.widget_title"] || t("admin.widgets.widget_title", "Widget Title", "عنوان الأداة")}
              </label>
              <input
                type="text"
                value={isDefaultOrOppositeLang ? "" : (item.title || "")}
                placeholder={widgetName}
                onChange={(e) => onUpdate?.({ title: e.target.value })}
                className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-xs text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
