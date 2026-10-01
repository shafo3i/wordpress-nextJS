"use client";

import React from "react";
import { ArrowDown, ArrowUp, Plus, Settings2, Trash2 } from "lucide-react";
import {
  HomepageBlock,
  HomepageBlockType,
  PageBuilderRow,
  PageBuilderSection,
  RowPreset,
} from "@/lib/themes/homepage-types";
import { BuilderRowCard } from "./builder-row-card";

interface BuilderSectionCardProps {
  section: PageBuilderSection;
  sectionIndex: number;
  totalSections: number;
  categories: { id: string; name: string; slug: string }[];
  dict?: Record<string, string>;
  direction?: "rtl" | "ltr";
  expandedBlockId: string | null;
  onSetExpandedBlockId: (id: string | null) => void;
  onUpdateSection: (updates: Partial<PageBuilderSection>) => void;
  onMoveSectionUp: () => void;
  onMoveSectionDown: () => void;
  onDeleteSection: () => void;
  onAddRow: () => void;
  onUpdateRowPreset: (rowId: string, preset: RowPreset) => void;
  onMoveRow: (rowIndex: number, direction: "up" | "down") => void;
  onDeleteRow: (rowId: string) => void;
  onUpdateBlock: (blockId: string, updates: Partial<HomepageBlock>) => void;
  onToggleBlockEnabled: (blockId: string) => void;
  onRemoveItem: (columnId: string, itemId: string) => void;
  onUpdateWidget?: (columnId: string, itemId: string, updates: any) => void;
  onAddItemToColumn: (columnId: string, type: "block" | "widget", payload: string) => void;
  availableBlockTypes: HomepageBlockType[];
  availableWidgets: { type: string; name: string; desc?: string }[];
}

export function BuilderSectionCard({
  section,
  sectionIndex,
  totalSections,
  categories,
  dict,
  direction = "ltr",
  expandedBlockId,
  onSetExpandedBlockId,
  onUpdateSection,
  onMoveSectionUp,
  onMoveSectionDown,
  onDeleteSection,
  onAddRow,
  onUpdateRowPreset,
  onMoveRow,
  onDeleteRow,
  onUpdateBlock,
  onToggleBlockEnabled,
  onRemoveItem,
  onUpdateWidget,
  onAddItemToColumn,
  availableBlockTypes,
  availableWidgets,
}: BuilderSectionCardProps) {
  const isRtl = direction === "rtl";

  const t = (key: string, enFallback: string, arFallback: string) => {
    if (isRtl) return dict?.[key] || arFallback;
    return dict?.[key] || enFallback;
  };

  return (
    <div className="rounded-[4px] border border-[#c3c4c7] bg-white shadow-sm space-y-4 p-4 text-start">
      {/* Section Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f0f0f1] pb-3">
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          <span className="size-6 rounded bg-[#2271b1] text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
            {sectionIndex + 1}
          </span>
          <input
            type="text"
            value={section.title || ""}
            placeholder={t("admin.theme_settings.display_title", "Section Display Title", "عنوان عرض القسم")}
            onChange={(e) => onUpdateSection({ title: e.target.value })}
            className="h-8 flex-1 max-w-sm rounded-[3px] border border-[#8c8f94] bg-white px-2.5 text-xs font-semibold text-[#1d2327] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none focus:ring-1 focus:ring-[#2271b1]"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Container Width */}
          <select
            value={section.container || "boxed"}
            onChange={(e) => onUpdateSection({ container: e.target.value as "boxed" | "full" })}
            className="h-8 rounded-[3px] border border-[#8c8f94] bg-white px-2 text-xs text-[#2c3338]"
          >
            <option value="boxed">
              {t("admin.builder.container_boxed", "Boxed Container", "حاوية محددة العرض")}
            </option>
            <option value="full">
              {t("admin.builder.container_full", "Full Bleed Width", "بعرض الشاشة الكامل")}
            </option>
          </select>

          {/* Padding Y */}
          <select
            value={section.paddingY || "md"}
            onChange={(e) =>
              onUpdateSection({ paddingY: e.target.value as "none" | "sm" | "md" | "lg" })
            }
            className="h-8 rounded-[3px] border border-[#8c8f94] bg-white px-2 text-xs text-[#2c3338]"
          >
            <option value="none">Padding: 0</option>
            <option value="sm">Padding: SM</option>
            <option value="md">Padding: MD</option>
            <option value="lg">Padding: LG</option>
          </select>

          {/* Reorder Section */}
          <button
            type="button"
            disabled={sectionIndex === 0}
            onClick={onMoveSectionUp}
            className="text-[#646970] hover:text-[#2271b1] disabled:opacity-20 p-1"
            title={t("admin.theme_settings.move_up", "Move up", "تحريك لأعلى")}
          >
            <ArrowUp className="size-4" />
          </button>
          <button
            type="button"
            disabled={sectionIndex === totalSections - 1}
            onClick={onMoveSectionDown}
            className="text-[#646970] hover:text-[#2271b1] disabled:opacity-20 p-1"
            title={t("admin.theme_settings.move_down", "Move down", "تحريك لأسفل")}
          >
            <ArrowDown className="size-4" />
          </button>

          {/* Delete Section */}
          <button
            type="button"
            onClick={onDeleteSection}
            className="text-[#b32d2e] hover:text-red-700 p-1 text-xs"
            title={t("admin.builder.delete_section", "Delete Section", "حذف القسم")}
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      {/* Rows in Section */}
      <div className="space-y-4">
        {section.rows.map((row, rIdx) => (
          <BuilderRowCard
            key={row.id}
            row={row}
            rowIndex={rIdx}
            totalRows={section.rows.length}
            categories={categories}
            dict={dict}
            direction={direction}
            expandedBlockId={expandedBlockId}
            onSetExpandedBlockId={onSetExpandedBlockId}
            onUpdateRowPreset={(preset) => onUpdateRowPreset(row.id, preset)}
            onMoveRowUp={() => onMoveRow(rIdx, "up")}
            onMoveRowDown={() => onMoveRow(rIdx, "down")}
            onDeleteRow={() => onDeleteRow(row.id)}
            onUpdateBlock={onUpdateBlock}
            onToggleBlockEnabled={onToggleBlockEnabled}
            onRemoveItem={onRemoveItem}
            onUpdateWidget={onUpdateWidget}
            onAddItemToColumn={onAddItemToColumn}
            availableBlockTypes={availableBlockTypes}
            availableWidgets={availableWidgets}
          />
        ))}
      </div>

      {/* Add Row Button */}
      <div className="pt-2 border-t border-[#f0f0f1] flex justify-end">
        <button
          type="button"
          onClick={onAddRow}
          className="rounded-[3px] border border-[#2271b1] text-[#2271b1] bg-white hover:bg-blue-50 px-3 py-1 text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <Plus className="size-3.5" />
          <span>{t("admin.builder.add_row", "Add Row", "إضافة صف")}</span>
        </button>
      </div>
    </div>
  );
}
