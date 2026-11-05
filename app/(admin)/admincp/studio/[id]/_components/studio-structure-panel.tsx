"use client";

import React,{ useState } from "react";
import { ArrowDown,ArrowUp,ChevronDown,ChevronRight,Copy,Eye,EyeOff,LayoutGrid,MousePointerSquareDashed,Sparkles,Trash2,X } from "lucide-react";
import type { StudioElement } from "@/lib/studio/types";

interface StudioStructurePanelProps {
  elements: StudioElement[];
  selectedId: string | null;
  onSelectElement: (id: string) => void;
  onMoveElement: (id: string, dir: "up" | "down") => void;
  onDuplicateElement: (id: string) => void;
  onDeleteElement: (id: string) => void;
  onToggleHidden: (id: string) => void;
  onClose: () => void;
  dict?: Record<string, string>;
}

export function StudioStructurePanel({
  elements,
  selectedId,
  onSelectElement,
  onMoveElement,
  onDuplicateElement,
  onDeleteElement,
  onToggleHidden,
  onClose,
  dict,
}: StudioStructurePanelProps) {
  const [collapsedIds, setCollapsedIds] = useState<Record<string, boolean>>({});

  const toggleCollapse = (id: string) => {
    setCollapsedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getElementLabel = (el: StudioElement): string => {
    if (el.title) return el.title;
    if (el.elType === "container") {
      const cType = el.settings.containerType || "flexbox";
      return dict?.[`admin.studio.el.${cType}`] || cType;
    }
    if (el.widgetType.startsWith("block_")) {
      const bType = el.widgetType.replace("block_", "");
      return dict?.[`admin.theme_settings.block.${bType}.name`] || bType;
    }
    if (el.widgetType.startsWith("widget_")) {
      const wType = el.widgetType.replace("widget_", "");
      return dict?.[`admin.widgets.descriptor.${wType}.name`] || wType;
    }
    return dict?.[`admin.studio.el.${el.widgetType}`] || el.widgetType;
  };

  const renderTreeItem = (el: StudioElement, depth = 0): React.ReactNode => {
    const isSelected = selectedId === el.id;
    const hasChildren = el.elements.length > 0;
    const isCollapsed = Boolean(collapsedIds[el.id]);

    return (
      <div key={el.id} className="select-none">
        <div
          onClick={() => onSelectElement(el.id)}
          style={{ paddingInlineStart: `${10 + depth * 14}px` }}
          className={`group flex items-center justify-between pe-2 py-1.5 text-xs cursor-pointer transition-colors ${
            isSelected
              ? "bg-blue-50 text-[#2563eb] font-semibold"
              : "text-slate-700 hover:bg-slate-100"
          }`}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCollapse(el.id);
                }}
                className="p-0.5 text-slate-400 hover:text-slate-700"
              >
                {isCollapsed ? (
                  <ChevronRight className="size-3" />
                ) : (
                  <ChevronDown className="size-3" />
                )}
              </button>
            ) : (
              <span className="w-4" />
            )}

            {el.elType === "container" ? (
              <LayoutGrid className="size-3.5 text-slate-500 shrink-0" />
            ) : (
              <MousePointerSquareDashed className="size-3.5 text-indigo-500 shrink-0" />
            )}

            <span className={`truncate ${el.hidden ? "line-through opacity-50" : ""}`}>
              {getElementLabel(el)}
            </span>
          </div>

          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMoveElement(el.id, "up");
              }}
              className="p-0.5 text-slate-400 hover:text-slate-700 rounded"
              title={dict?.["admin.studio.action.move_up"]}
            >
              <ArrowUp className="size-3" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMoveElement(el.id, "down");
              }}
              className="p-0.5 text-slate-400 hover:text-slate-700 rounded"
              title={dict?.["admin.studio.action.move_down"]}
            >
              <ArrowDown className="size-3" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicateElement(el.id);
              }}
              className="p-0.5 text-slate-400 hover:text-slate-700 rounded"
              title={dict?.["admin.studio.action.duplicate"]}
            >
              <Copy className="size-3" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleHidden(el.id);
              }}
              className="p-0.5 text-slate-400 hover:text-slate-700 rounded"
              title={dict?.["admin.studio.action.toggle_visibility"]}
            >
              {el.hidden ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteElement(el.id);
              }}
              className="p-0.5 text-slate-400 hover:text-red-600 rounded"
              title={dict?.["admin.studio.action.delete"]}
            >
              <Trash2 className="size-3" />
            </button>
          </div>
        </div>

        {hasChildren && !isCollapsed && (
          <div>{el.elements.map((child) => renderTreeItem(child, depth + 1))}</div>
        )}
      </div>
    );
  };

  return (
    <aside className="fixed end-5 top-16 z-40 w-[265px] rounded-md border border-slate-200 bg-white shadow-2xl flex flex-col max-h-[calc(100vh-100px)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2.5">
        <div className="flex items-center gap-1.5 text-slate-500">
          <Sparkles className="size-3.5 text-indigo-500" />
        </div>
        <h3 className="text-xs font-bold text-slate-800">
          {dict?.["admin.studio.structure"]}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-700 p-0.5 rounded"
        >
          <X className="size-3.5" />
        </button>
      </div>

      {/* Tree List */}
      <div className="flex-1 overflow-y-auto py-1.5 min-h-[240px]">
        {elements.length > 0 ? (
          elements.map((el) => renderTreeItem(el, 0))
        ) : (
          <div className="p-6 text-center text-xs text-slate-400">
            {dict?.["admin.studio.empty_structure"]}
          </div>
        )}
      </div>
    </aside>
  );
}

