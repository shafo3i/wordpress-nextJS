"use client";

import React from "react";
import { ArrowDown, ArrowUp, ChevronDown, ChevronUp, GripVertical } from "lucide-react";
import { HomepageBlock } from "@/lib/themes/homepage-types";
import { BlockWireframeIcon } from "./block-wireframes";
import { EditorialBlockDrawer } from "./editorial-block-drawer";

interface EditorialBlockCardProps {
  block: HomepageBlock;
  index: number;
  totalBlocks: number;
  isExpanded: boolean;
  isDragging?: boolean;
  isDragOver?: boolean;
  categories: { id: string; name: string; slug: string }[];
  dict?: Record<string, string>;
  direction?: "rtl" | "ltr";
  onToggleExpand: () => void;
  onToggleEnabled: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onUpdate: (updates: Partial<HomepageBlock>) => void;
  onRemove: () => void;
  dragProps?: {
    draggable?: boolean;
    onDragStart?: (e: React.DragEvent) => void;
    onDragOver?: (e: React.DragEvent) => void;
    onDrop?: (e: React.DragEvent) => void;
    onDragEnd?: () => void;
  };
}

export function EditorialBlockCard({
  block,
  index,
  totalBlocks,
  isExpanded,
  isDragging = false,
  isDragOver = false,
  categories,
  dict,
  direction = "ltr",
  onToggleExpand,
  onToggleEnabled,
  onMoveUp,
  onMoveDown,
  onUpdate,
  onRemove,
  dragProps = {},
}: EditorialBlockCardProps) {
  const isRtl = direction === "rtl";

  const t = (key: string, enFallback: string, arFallback: string) => {
    if (isRtl) return dict?.[key] || arFallback;
    return dict?.[key] || enFallback;
  };

  const blockName = dict?.[`admin.theme_settings.block.${block.type}.name`] || block.type;
  const currentDisplayStyle = block.displayStyle || "grid_3";

  const isDefaultOrOppositeLang =
    !block.title ||
    block.title === block.type ||
    block.title === blockName ||
    (!isRtl && /[\u0600-\u06FF]/.test(block.title)) ||
    (isRtl && /^[A-Za-z0-9\s•\-+()]+$/.test(block.title));

  const displayTitle = isDefaultOrOppositeLang ? blockName : block.title;

  return (
    <div
      {...dragProps}
      className={`rounded-[3px] border transition-all ${!block.enabled
          ? "border-[#dcdcde] bg-slate-50 opacity-60"
          : isDragging
            ? "opacity-30 border-dashed border-[#2271b1] bg-blue-50"
            : isDragOver
              ? "border-t-4 border-t-[#2271b1] border-[#c3c4c7] bg-[#f0f6fc]"
              : "border-[#c3c4c7] bg-white hover:border-[#8c8f94]"
        }`}
    >
      {/* Header Strip with Layout Wireframe Icon */}
      <div className="flex items-center justify-between px-3.5 py-2.5">
        <div className="flex items-center gap-2.5">
          <div
            className="cursor-grab active:cursor-grabbing text-[#8c8f94] hover:text-[#1d2327] p-0.5"
            title={t("admin.theme_settings.drag_hint", "Drag to reorder section", "اسحب لإعادة الترتيب")}
          >
            <GripVertical className="size-4" />
          </div>

          <div className="flex flex-col">
            <button
              type="button"
              disabled={index === 0}
              onClick={onMoveUp}
              className="text-[#646970] hover:text-[#2271b1] disabled:opacity-20"
              title={t("admin.theme_settings.move_up", "Move up", "تحريك لأعلى")}
            >
              <ArrowUp className="size-3" />
            </button>
            <button
              type="button"
              disabled={index === totalBlocks - 1}
              onClick={onMoveDown}
              className="text-[#646970] hover:text-[#2271b1] disabled:opacity-20"
              title={t("admin.theme_settings.move_down", "Move down", "تحريك لأسفل")}
            >
              <ArrowDown className="size-3" />
            </button>
          </div>

          {/* Visual Wireframe Diagram Icon */}
          <div className="flex-shrink-0">
            <BlockWireframeIcon
              type={block.type}
              displayStyle={currentDisplayStyle}
              className="w-8 h-5.5"
              active={isExpanded}
            />
          </div>

          <div>
            <strong className="text-[#1d2327] text-[13px]">{displayTitle}</strong>
            {block.categorySlug && block.categorySlug !== "all" && (
              <span className="text-[11px] text-[#646970] ms-2">
                ({block.categorySlug})
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleEnabled}
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase transition-colors ${block.enabled
                ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                : "bg-slate-200 text-slate-600 hover:bg-slate-300"
              }`}
          >
            {block.enabled
              ? t("admin.theme_settings.active", "Active", "نشط")
              : t("admin.theme_settings.hidden", "Hidden", "مخفي")}
          </button>

          <button
            type="button"
            onClick={onToggleExpand}
            className="p-1 text-[#646970] hover:text-[#2271b1]"
          >
            {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Block Settings Drawer */}
      {isExpanded && (
        <EditorialBlockDrawer
          block={block}
          categories={categories}
          dict={dict}
          direction={direction}
          onUpdate={onUpdate}
          onRemove={onRemove}
          onClose={onToggleExpand}
        />
      )}
    </div>
  );
}
