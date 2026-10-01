"use client";

import React, { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Columns2,
  Columns3,
  Columns4,
  LayoutTemplate,
  Plus,
  Trash2,
} from "lucide-react";
import {
  BuilderItem,
  ColumnWidth,
  HomepageBlock,
  HomepageBlockType,
  PageBuilderColumn,
  PageBuilderRow,
  RowPreset,
} from "@/lib/themes/homepage-types";
import { EditorialBlockCard } from "./editorial-block-card";
import { BuilderWidgetCard } from "./builder-widget-card";
import { AddItemModal } from "./add-item-modal";

interface BuilderRowCardProps {
  row: PageBuilderRow;
  rowIndex: number;
  totalRows: number;
  categories: { id: string; name: string; slug: string }[];
  dict?: Record<string, string>;
  direction?: "rtl" | "ltr";
  expandedBlockId: string | null;
  onSetExpandedBlockId: (id: string | null) => void;
  onUpdateRowPreset: (preset: RowPreset) => void;
  onMoveRowUp: () => void;
  onMoveRowDown: () => void;
  onDeleteRow: () => void;
  onUpdateBlock: (blockId: string, updates: Partial<HomepageBlock>) => void;
  onToggleBlockEnabled: (blockId: string) => void;
  onRemoveItem: (columnId: string, itemId: string) => void;
  onUpdateWidget?: (columnId: string, itemId: string, updates: Partial<BuilderItem>) => void;
  onAddItemToColumn: (columnId: string, type: "block" | "widget", payload: string) => void;
  availableBlockTypes: HomepageBlockType[];
  availableWidgets: { type: string; name: string; desc?: string }[];
}

export function BuilderRowCard({
  row,
  rowIndex,
  totalRows,
  categories,
  dict,
  direction = "ltr",
  expandedBlockId,
  onSetExpandedBlockId,
  onUpdateRowPreset,
  onMoveRowUp,
  onMoveRowDown,
  onDeleteRow,
  onUpdateBlock,
  onToggleBlockEnabled,
  onRemoveItem,
  onUpdateWidget,
  onAddItemToColumn,
  availableBlockTypes,
  availableWidgets,
}: BuilderRowCardProps) {
  const isRtl = direction === "rtl";
  const [modalCol, setModalCol] = useState<{ id: string; title: string } | null>(null);
  const [dragOverColId, setDragOverColId] = useState<string | null>(null);

  const t = (key: string, enFallback: string, arFallback: string) => {
    if (isRtl) return dict?.[key] || arFallback;
    return dict?.[key] || enFallback;
  };

  const PRESETS: { id: RowPreset; label: string; icon: React.ReactNode }[] = [
    { id: "1/1", label: "1/1", icon: <LayoutTemplate className="size-3.5" /> },
    { id: "1/2_1/2", label: "1/2 + 1/2", icon: <Columns2 className="size-3.5" /> },
    { id: "2/3_1/3", label: "2/3 + 1/3", icon: <Columns2 className="size-3.5" /> },
    { id: "1/3_2/3", label: "1/3 + 2/3", icon: <Columns2 className="size-3.5" /> },
    { id: "1/3_1/3_1/3", label: t("admin.builder.cols_3", "3 Cols", "3 أعمدة"), icon: <Columns3 className="size-3.5" /> },
  ];

  const getColGridClass = (width: ColumnWidth) => {
    switch (width) {
      case "12/12":
        return "col-span-12";
      case "8/12":
        return "col-span-12 md:col-span-8";
      case "6/12":
        return "col-span-12 md:col-span-6";
      case "4/12":
        return "col-span-12 md:col-span-4";
      case "3/12":
        return "col-span-12 md:col-span-3";
      default:
        return "col-span-12";
    }
  };

  return (
    <div className="rounded-[4px] border border-[#dcdcde] bg-[#f8fafc] p-3.5 space-y-3">
      {/* Row Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#1d2327]">
            {t("admin.builder.row_layout", "Columns Layout", "تخطيط الأعمدة")}:
          </span>
          <div className="flex items-center gap-1 bg-white p-0.5 border border-[#c3c4c7] rounded-[3px]">
            {PRESETS.map((p) => {
              const isSelected = row.preset === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onUpdateRowPreset(p.id)}
                  className={`px-2 py-0.5 text-[11px] font-semibold rounded flex items-center gap-1 transition-all ${isSelected
                    ? "bg-[#2271b1] text-white shadow-sm"
                    : "text-[#50575e] hover:bg-slate-100"
                    }`}
                  title={p.label}
                >
                  {p.icon}
                  <span>{p.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={rowIndex === 0}
            onClick={onMoveRowUp}
            className="text-[#646970] hover:text-[#2271b1] disabled:opacity-20 p-1"
            title={t("admin.theme_settings.move_up", "Move up", "تحريك لأعلى")}
          >
            <ArrowUp className="size-3.5" />
          </button>
          <button
            type="button"
            disabled={rowIndex === totalRows - 1}
            onClick={onMoveRowDown}
            className="text-[#646970] hover:text-[#2271b1] disabled:opacity-20 p-1"
            title={t("admin.theme_settings.move_down", "Move down", "تحريك لأسفل")}
          >
            <ArrowDown className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={onDeleteRow}
            className="text-[#b32d2e] hover:text-red-700 p-1 ms-1 text-xs flex items-center gap-1"
            title={t("admin.builder.delete_row", "Delete Row", "حذف الصف")}
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Columns Grid */}
      <div className="grid grid-cols-12 gap-3 items-start">
        {row.columns.map((col, colIdx) => {
          const colSpan = getColGridClass(col.width);
          const isDraggingOver = dragOverColId === col.id;

          return (
            <div
              key={col.id}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "copy";
                if (dragOverColId !== col.id) {
                  setDragOverColId(col.id);
                }
              }}
              onDragLeave={(e) => {
                // Only unset if we are leaving this column container
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setDragOverColId(null);
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverColId(null);
                try {
                  const raw = e.dataTransfer.getData("application/json");
                  if (!raw) return;
                  const data = JSON.parse(raw);
                  if (data.type && data.payload) {
                    onAddItemToColumn(col.id, data.type, data.payload);
                  }
                } catch (err) {
                  console.error("Drop error:", err);
                }
              }}
              className={`${colSpan} rounded-[4px] border ${isDraggingOver
                ? "border-dashed border-[#2271b1] bg-blue-50/70 ring-2 ring-[#2271b1]/50"
                : "border-dashed border-[#c3c4c7] bg-white"
                } p-2.5 space-y-2.5 min-h-[130px] flex flex-col justify-between transition-colors`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] text-[#646970] border-b border-slate-100 pb-1">
                  <span className="font-semibold uppercase font-mono">
                    {t("admin.builder.column", "Column", "العمود")} {colIdx + 1} ({col.width})
                  </span>
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px]">
                    {col.items.length} {col.items.length === 1 ? t("admin.builder.item_single", "item", "عنصر") : t("admin.builder.items", "items", "عناصر")}
                  </span>
                </div>

                {/* Items in Column */}
                {col.items.map((item, itemIdx) => {
                  if (item.type === "block" && item.block) {
                    return (
                      <EditorialBlockCard
                        key={item.id}
                        block={item.block}
                        index={itemIdx}
                        totalBlocks={col.items.length}
                        isExpanded={expandedBlockId === item.block.id}
                        categories={categories}
                        dict={dict}
                        direction={direction}
                        onToggleExpand={() =>
                          onSetExpandedBlockId(expandedBlockId === item.block.id ? null : item.block.id)
                        }
                        onToggleEnabled={() => onToggleBlockEnabled(item.block.id)}
                        onUpdate={(updates) => onUpdateBlock(item.block.id, updates)}
                        onRemove={() => onRemoveItem(col.id, item.id)}
                      />
                    );
                  }

                  if (item.type === "widget") {
                    return (
                      <BuilderWidgetCard
                        key={item.id}
                        item={item}
                        dict={dict}
                        direction={direction}
                        onUpdate={(updates) => onUpdateWidget?.(col.id, item.id, updates)}
                        onRemove={() => onRemoveItem(col.id, item.id)}
                      />
                    );
                  }

                  return null;
                })}

                {/* Visual indicator when dropping over column */}
                {isDraggingOver && (
                  <div className="rounded border-2 border-dashed border-[#2271b1] bg-blue-100/70 py-3 text-center text-xs font-bold text-[#2271b1] animate-pulse">
                    {t("admin.builder.drop_hint", "Drop Block or Widget here", "أفلت الكتلة أو الأداة هنا")}
                  </div>
                )}
              </div>

              {/* Add Dropzone Button */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() =>
                    setModalCol({
                      id: col.id,
                      title: `${t("admin.builder.column", "Column", "العمود")} ${colIdx + 1} (${col.width})`,
                    })
                  }
                  className="w-full py-2 px-3 rounded border border-dashed border-[#c3c4c7] hover:border-[#2271b1] hover:bg-blue-50/60 text-[#646970] hover:text-[#2271b1] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-none"
                >
                  <Plus className="size-3.5" />
                  <span>
                    {t("admin.builder.add_block", "Add Block", "إضافة كتلة")} / {t("admin.builder.add_widget", "Widget", "أداة")}
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Visual Add Item Modal with Wireframe SVGs */}
      <AddItemModal
        open={!!modalCol}
        columnTitle={modalCol?.title}
        availableBlockTypes={availableBlockTypes}
        availableWidgets={availableWidgets.map((w) => ({
          type: w.type,
          name: w.name,
          desc: w.desc || "",
        }))}
        dict={dict}
        direction={direction}
        onClose={() => setModalCol(null)}
        onSelect={(type, payload) => {
          if (modalCol) {
            onAddItemToColumn(modalCol.id, type, payload);
          }
        }}
      />
    </div>
  );
}
