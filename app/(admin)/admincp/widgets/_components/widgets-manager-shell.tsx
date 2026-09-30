"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Plus,
  Trash2,
  Sparkles,
} from "lucide-react";
import {
  AvailableWidgetDescriptor,
  WidgetArea,
  WidgetItem,
  WidgetType,
  WidgetDisplayStyle,
  createDefaultWidgetItem,
} from "@/lib/widgets/types";
import { getWidget } from "@/widgets/registry";
import { saveWidgetAreaAction } from "../actions";
import { WidgetWireframeIcon } from "./widget-wireframes";
import { WidgetsHeader } from "./widgets-header";

interface WidgetsManagerShellProps {
  initialAreas: WidgetArea[];
  availableWidgets: AvailableWidgetDescriptor[];
  dict?: Record<string, string>;
  direction?: "rtl" | "ltr";
}

const DEFAULT_ITEM_TITLE_ARABIC: Record<string, string> = {
  "About Signal News": "عن سيجنال نيوز",
  "Search News": "البحث في الأخبار",
  "Search Articles": "البحث في المقالات",
  "Recent Stories": "أحدث القصص",
  "Recent Posts": "أحدث المقالات",
  "Morning Dispatch": "الموجز الصباحي",
  "Morning Dispatch Newsletter": "نشرة الموجز الصباحي",
  "Explore Topics": "استكشاف الموضوعات",
  "Categories": "التصنيفات",
  "About the Newsroom": "نبذة عن غرفة الأخبار",
  "Newsroom Daily Audio": "صوتيات غرفة الأخبار اليومية",
  "Daily Audio Stream": "البث الصوتي اليومي",
  "Quick Sections": "أقسام سريعة",
  "Claim Verification": "التحقق من الادعاءات",
  "Verified Claim Check": "فحص الادعاءات الموثقة",
  "Urgent News Flash": "خبر عاجل",
  "Follow Our Newsroom": "تابع غرفة أخبارنا",
  "Monetized Partner Banner": "بانر إعلاني للشركاء",
  "Reading Time Indicator": "مؤشر وقت القراءة",
  "Recommended Follow-ups": "متابعات مقترحة",
};

export function WidgetsManagerShell({
  initialAreas,
  availableWidgets,
  dict,
  direction = "ltr",
}: WidgetsManagerShellProps) {
  const [areas, setAreas] = useState<WidgetArea[]>(initialAreas);
  const [openAreaId, setOpenAreaId] = useState<string>(initialAreas[0]?.id || "sidebar_primary");
  const [expandedWidgetId, setExpandedWidgetId] = useState<string | null>(null);
  const [draggedPaletteWidget, setDraggedPaletteWidget] = useState<AvailableWidgetDescriptor | null>(null);
  const [draggedSource, setDraggedSource] = useState<{ areaId: string; index: number } | null>(null);
  const [dragOverAreaId, setDragOverAreaId] = useState<string | null>(null);
  const [dragOverItemIndex, setDragOverItemIndex] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const getAreaTitle = (area: WidgetArea) => {
    return dict?.[`admin.widgets.area.${area.id}.title`] || area.title;
  };

  const getAreaDesc = (area: WidgetArea) => {
    return dict?.[`admin.widgets.area.${area.id}.desc`] || area.description;
  };

  const getWidgetName = (w: AvailableWidgetDescriptor) => {
    return dict?.[`admin.widgets.descriptor.${w.type}.name`] || w.name;
  };

  const getWidgetDesc = (w: AvailableWidgetDescriptor) => {
    return dict?.[`admin.widgets.descriptor.${w.type}.desc`] || w.desc;
  };

  const getItemDisplayTitle = (item: WidgetItem) => {
    if (direction === "rtl" && DEFAULT_ITEM_TITLE_ARABIC[item.title]) {
      return DEFAULT_ITEM_TITLE_ARABIC[item.title];
    }
    return item.title;
  };

  const getWidgetTypeBadge = (type: string) => {
    if (direction === "rtl") {
      switch (type) {
        case "search": return "بحث";
        case "recent_posts": return "أحدث المقالات";
        case "categories": return "تصنيفات";
        case "author_bio": return "نبذة الكاتب";
        case "custom_html": return "HTML مخصص";
        case "plugin_reading_time": return "وقت القراءة";
        case "plugin_related_posts": return "مقالات ذات صلة";
        case "plugin_newsletter": return "نشرة بريدية";
        case "plugin_audio": return "بث صوتي";
        case "plugin_breaking": return "عاجل";
        case "plugin_social": return "تواصل";
        case "plugin_factcheck": return "تدقيق حقائق";
        case "plugin_ad": return "إعلان";
        default: return type;
      }
    }
    return type;
  };

  const currentArea = areas.find((a) => a.id === openAreaId) || areas[0];

  // Drag from palette
  const handlePaletteDragStart = (e: React.DragEvent, desc: AvailableWidgetDescriptor) => {
    e.dataTransfer.effectAllowed = "copy";
    e.dataTransfer.setData("application/json", JSON.stringify(desc));
    setDraggedPaletteWidget(desc);
    setDraggedSource(null);
  };

  // Drag existing placed widget
  const handleItemDragStart = (e: React.DragEvent, areaId: string, index: number) => {
    e.dataTransfer.effectAllowed = "move";
    setDraggedSource({ areaId, index });
    setDraggedPaletteWidget(null);
  };

  const handleDragOverArea = (e: React.DragEvent, areaId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = draggedPaletteWidget ? "copy" : "move";
    if (dragOverAreaId !== areaId) {
      setDragOverAreaId(areaId);
    }
  };

  const handleDragOverItem = (e: React.DragEvent, areaId: string, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = draggedPaletteWidget ? "copy" : "move";
    setDragOverAreaId(areaId);
    if (dragOverItemIndex !== index) {
      setDragOverItemIndex(index);
    }
  };

  const handleDropOnArea = (e: React.DragEvent, targetAreaId: string, targetIndex?: number) => {
    e.preventDefault();
    e.stopPropagation();

    // Case 1: Dropping new widget from palette into area
    if (draggedPaletteWidget) {
      const newWidget = createDefaultWidgetItem(draggedPaletteWidget);
      // Localize default title if in Arabic
      if (direction === "rtl" && DEFAULT_ITEM_TITLE_ARABIC[newWidget.title]) {
        newWidget.title = DEFAULT_ITEM_TITLE_ARABIC[newWidget.title];
      }

      setAreas((curr) =>
        curr.map((area) => {
          if (area.id !== targetAreaId) return area;
          const updated = [...area.items];
          const insertIdx = targetIndex !== undefined && targetIndex >= 0 ? targetIndex : updated.length;
          updated.splice(insertIdx, 0, newWidget);
          return { ...area, items: updated };
        })
      );
      setOpenAreaId(targetAreaId);
      setExpandedWidgetId(newWidget.id);
      setDraggedPaletteWidget(null);
      setDragOverAreaId(null);
      setDragOverItemIndex(null);
      return;
    }

    // Case 2: Moving existing widget
    if (draggedSource) {
      const { areaId: srcAreaId, index: srcIndex } = draggedSource;
      setAreas((curr) => {
        const srcArea = curr.find((a) => a.id === srcAreaId);
        if (!srcArea || srcIndex >= srcArea.items.length) return curr;

        // Same area reorder
        if (srcAreaId === targetAreaId) {
          const updated = [...srcArea.items];
          const [moved] = updated.splice(srcIndex, 1);
          const destIdx = targetIndex !== undefined && targetIndex >= 0 ? targetIndex : updated.length;
          updated.splice(destIdx, 0, moved);
          return curr.map((a) => (a.id === targetAreaId ? { ...a, items: updated } : a));
        }

        // Cross-area move
        const srcUpdated = [...srcArea.items];
        const [moved] = srcUpdated.splice(srcIndex, 1);
        return curr.map((a) => {
          if (a.id === srcAreaId) return { ...a, items: srcUpdated };
          if (a.id === targetAreaId) {
            const destItems = [...a.items];
            const destIdx = targetIndex !== undefined && targetIndex >= 0 ? targetIndex : destItems.length;
            destItems.splice(destIdx, 0, moved);
            return { ...a, items: destItems };
          }
          return a;
        });
      });

      setOpenAreaId(targetAreaId);
      setDraggedSource(null);
      setDragOverAreaId(null);
      setDragOverItemIndex(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedPaletteWidget(null);
    setDraggedSource(null);
    setDragOverAreaId(null);
    setDragOverItemIndex(null);
  };

  const moveWidget = (index: number, moveDirection: "up" | "down") => {
    if (!currentArea) return;
    const targetIdx = moveDirection === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= currentArea.items.length) return;

    const updated = [...currentArea.items];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIdx, 0, moved);

    setAreas((curr) =>
      curr.map((a) => (a.id === currentArea.id ? { ...a, items: updated } : a))
    );
  };

  const addWidget = (desc: AvailableWidgetDescriptor) => {
    if (!currentArea) return;
    const newWidget = createDefaultWidgetItem(desc);
    if (direction === "rtl" && DEFAULT_ITEM_TITLE_ARABIC[newWidget.title]) {
      newWidget.title = DEFAULT_ITEM_TITLE_ARABIC[newWidget.title];
    }
    const updatedItems = [...currentArea.items, newWidget];
    setAreas((curr) =>
      curr.map((a) => (a.id === currentArea.id ? { ...a, items: updatedItems } : a))
    );
    setExpandedWidgetId(newWidget.id);
  };

  const updateWidget = (id: string, updates: Partial<WidgetItem>) => {
    if (!currentArea) return;
    const updatedItems = currentArea.items.map((w) => (w.id === id ? { ...w, ...updates } : w));
    setAreas((curr) =>
      curr.map((a) => (a.id === currentArea.id ? { ...a, items: updatedItems } : a))
    );
  };

  const removeWidget = (id: string) => {
    if (!currentArea) return;
    const updatedItems = currentArea.items.filter((w) => w.id !== id);
    setAreas((curr) =>
      curr.map((a) => (a.id === currentArea.id ? { ...a, items: updatedItems } : a))
    );
  };

  const handleSaveArea = () => {
    if (!currentArea) return;

    startTransition(async () => {
      const res = await saveWidgetAreaAction(currentArea.id, currentArea.items);
      if (!res.success || res.error) {
        setFeedback({
          type: "error",
          message: res.error || dict?.["admin.widgets.save_failed"] || "Failed to save widget area.",
        });
      } else {
        const areaTitle = getAreaTitle(currentArea);
        const successMsg =
          direction === "rtl"
            ? `تم حفظ منطقة "${areaTitle}" بنجاح!`
            : `Widget area "${areaTitle}" saved successfully!`;
        setFeedback({
          type: "success",
          message: dict?.["admin.widgets.save_success"] || successMsg,
        });
        setTimeout(() => setFeedback(null), 4000);
        router.refresh();
      }
    });
  };

  return (
    <div dir={direction} className="space-y-4 text-[13px] text-start">
      <WidgetsHeader dict={dict} direction={direction} />

      {/* Save Button Row */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#646970]">
          {direction === "rtl"
            ? `المنطقة النشطة: ${currentArea ? getAreaTitle(currentArea) : ""}`
            : `Active Area: ${currentArea ? getAreaTitle(currentArea) : ""}`}
        </span>

        <button
          type="button"
          disabled={isPending}
          onClick={handleSaveArea}
          className="rounded-[3px] border border-[#2271b1] bg-[#2271b1] px-4 py-1.5 font-medium text-white hover:bg-[#135e96] transition-colors disabled:opacity-50"
        >
          {isPending
            ? dict?.["admin.widgets.saving"] || "Saving..."
            : dict?.["admin.widgets.save_area"] || "Save Widget Area"}
        </button>
      </div>

      {/* Inline Feedback Banner (Clean WP notice replacing browser alert) */}
      {feedback && (
        <div
          className={`flex items-center justify-between border-s-4 bg-white p-3 text-[13px] shadow-[0_1px_1px_rgba(0,0,0,0.04)] ${
            feedback.type === "error"
              ? "border-[#d63638] text-[#d63638]"
              : "border-[#00a32a] text-[#1d2327]"
          }`}
        >
          <span>
            {feedback.type === "error" ? "⚠ " : "✓ "}
            {feedback.message}
          </span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-lg leading-none text-slate-400 hover:text-slate-600"
          >
            ×
          </button>
        </div>
      )}

      {/* 2-Column WordPress Widgets Layout */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[320px_1fr] items-start">
        {/* Available Widgets Palette */}
        <div className="rounded-[3px] border border-[#c3c4c7] bg-white p-4 shadow-[0_1px_1px_rgba(0,0,0,0.04)] space-y-4">
          <div>
            <h3 className="font-semibold text-[#1d2327] text-sm">
              {dict?.["admin.widgets.available_widgets"] || "Available Widgets"}
            </h3>
            <p className="text-[12px] text-[#646970]">
              {dict?.["admin.widgets.available_desc"] ||
                "Drag widgets onto any area on the right, or click to add:"}
            </p>
          </div>

          {/* Core Widgets */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block border-b pb-1">
              {dict?.["admin.widgets.core_widgets"] || "Core Newsroom Widgets"}
            </span>
            {availableWidgets
              .filter((w) => !w.isPlugin)
              .map((w) => (
                <div
                  key={w.type}
                  role="button"
                  tabIndex={0}
                  draggable
                  onDragStart={(e) => handlePaletteDragStart(e, w)}
                  onDragEnd={handleDragEnd}
                  onClick={() => addWidget(w)}
                  className="flex w-full items-start gap-2.5 rounded border border-[#dcdcde] bg-white p-2.5 text-start hover:border-[#2271b1] hover:bg-[#f0f6fc] transition-colors group cursor-grab active:cursor-grabbing select-none"
                  title={direction === "rtl" ? "اسحب للإضافة أو انقر" : "Drag onto an area or click to add"}
                >
                  <div className="flex-shrink-0 pt-0.5">
                    <WidgetWireframeIcon type={w.type} className="w-8 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#1d2327] group-hover:text-[#2271b1] block text-[12px]">
                        + {getWidgetName(w)}
                      </span>
                      <GripVertical className="size-3.5 text-slate-400 group-hover:text-[#2271b1] opacity-60" />
                    </div>
                    <span className="text-[11px] text-[#646970] leading-tight block mt-0.5">
                      {getWidgetDesc(w)}
                    </span>
                  </div>
                </div>
              ))}
          </div>

          {/* Plugin-Provided Widgets */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between border-b pb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 flex items-center gap-1">
                <Sparkles className="size-3" />{" "}
                {dict?.["admin.widgets.plugin_widgets"] || "Installed Plugin Widgets"}
              </span>
            </div>

            {availableWidgets.filter((w) => w.isPlugin).length ? (
              availableWidgets
                .filter((w) => w.isPlugin)
                .map((w) => (
                  <div
                    key={w.type}
                    role="button"
                    tabIndex={0}
                    draggable
                    onDragStart={(e) => handlePaletteDragStart(e, w)}
                    onDragEnd={handleDragEnd}
                    onClick={() => addWidget(w)}
                    className="flex w-full items-start gap-2.5 rounded border border-purple-200 bg-purple-50/40 p-2.5 text-start hover:border-purple-500 hover:bg-purple-100/50 transition-colors group cursor-grab active:cursor-grabbing select-none"
                    title={direction === "rtl" ? "اسحب للإضافة أو انقر" : "Drag onto an area or click to add"}
                  >
                    <div className="flex-shrink-0 pt-0.5">
                      <WidgetWireframeIcon type={w.type} className="w-8 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-purple-950 group-hover:text-purple-700 text-[12px]">
                          + {getWidgetName(w)}
                        </span>
                        <GripVertical className="size-3.5 text-purple-400 group-hover:text-purple-600 opacity-60" />
                      </div>
                      <span className="text-[11px] text-purple-800/80 leading-tight block mt-0.5">
                        {getWidgetDesc(w)}
                      </span>
                    </div>
                  </div>
                ))
            ) : (
              <p className="text-[11px] text-slate-500 italic p-2 bg-slate-50 border rounded">
                {dict?.["admin.widgets.no_plugin_widgets"] ||
                  "No plugin widgets available. Activate plugins in Plugins → Installed Plugins to enable widgets here."}
              </p>
            )}
          </div>
        </div>

        {/* Widget Areas Accordion */}
        <div className="space-y-3">
          {areas.map((area) => {
            const isOpen = openAreaId === area.id;
            const isAreaDragOver = dragOverAreaId === area.id;
            const isSecondarySidebar = area.id === "sidebar_secondary";
            const areaTitle = getAreaTitle(area);
            const areaDescription = getAreaDesc(area);

            return (
              <div
                key={area.id}
                onDragOver={(e) => {
                  handleDragOverArea(e, area.id);
                  if (!isOpen && (draggedPaletteWidget || draggedSource)) {
                    setOpenAreaId(area.id);
                  }
                }}
                onDrop={(e) => handleDropOnArea(e, area.id)}
                className={`rounded-[3px] border bg-white shadow-[0_1px_1px_rgba(0,0,0,0.04)] overflow-hidden transition-all ${
                  isAreaDragOver
                    ? "border-[#2271b1] ring-2 ring-[#2271b1]/30"
                    : "border-[#c3c4c7]"
                }`}
              >
                {/* Area Header Bar */}
                <button
                  type="button"
                  onClick={() => setOpenAreaId(isOpen ? "" : area.id)}
                  className={`flex w-full items-center justify-between border-b border-[#c3c4c7] px-4 py-3 text-start font-semibold text-[#2c3338] transition-colors ${
                    isOpen ? "bg-[#f0f0f1]" : "bg-[#f6f7f7] hover:bg-[#f0f0f1]"
                  }`}
                >
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="text-sm text-[#1d2327]">{areaTitle}</span>
                    {isSecondarySidebar && (
                      <span className="rounded bg-indigo-100 text-indigo-800 text-[10px] px-1.5 py-0.5 font-bold uppercase">
                        {dict?.["admin.widgets.dual_sidebar"] || "Dual Sidebar"}
                      </span>
                    )}
                    <span className="text-[11px] font-normal text-[#646970] block sm:inline">
                      {areaDescription}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#646970] font-normal">
                      {area.items.length}{" "}
                      {area.items.length === 1
                        ? dict?.["admin.widgets.widget_count_single"] || "widget"
                        : dict?.["admin.widgets.widgets_count"] || "widgets"}
                    </span>
                    {isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                  </div>
                </button>

                {/* Area Body if Open */}
                {isOpen && (
                  <div
                    onDragOver={(e) => handleDragOverArea(e, area.id)}
                    onDrop={(e) => handleDropOnArea(e, area.id)}
                    className="p-4 space-y-3 bg-white min-h-[90px]"
                  >
                    {area.items.length ? (
                      <div className="space-y-2">
                        {area.items.map((item, index) => {
                          const isExpanded = expandedWidgetId === item.id;
                          const isDragging = draggedSource?.areaId === area.id && draggedSource?.index === index;
                          const isDragOver = dragOverAreaId === area.id && dragOverItemIndex === index;
                          const isPlugin = item.type.startsWith("plugin_");
                          const itemTitle = getItemDisplayTitle(item);
                          const typeBadge = getWidgetTypeBadge(item.type);

                          return (
                            <div
                              key={item.id}
                              draggable
                              onDragStart={(e) => handleItemDragStart(e, area.id, index)}
                              onDragOver={(e) => handleDragOverItem(e, area.id, index)}
                              onDrop={(e) => handleDropOnArea(e, area.id, index)}
                              onDragEnd={handleDragEnd}
                              className={`rounded-[3px] border transition-all ${
                                isDragging
                                  ? "opacity-30 border-dashed border-[#2271b1] bg-blue-50"
                                  : isDragOver
                                  ? "border-t-4 border-t-[#2271b1] border-[#c3c4c7] bg-[#f0f6fc]"
                                  : isPlugin
                                  ? "border-purple-300 bg-purple-50/20 hover:border-purple-400"
                                  : "border-[#c3c4c7] bg-[#f6f7f7] hover:border-[#8c8f94]"
                              }`}
                            >
                              <div className="flex items-center justify-between px-3 py-2">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="cursor-grab active:cursor-grabbing text-[#8c8f94] hover:text-[#1d2327] p-0.5"
                                    title={direction === "rtl" ? "اسحب لإعادة الترتيب" : "Drag to reorder"}
                                  >
                                    <GripVertical className="size-4" />
                                  </div>

                                  <div className="flex flex-col">
                                    <button
                                      type="button"
                                      disabled={index === 0}
                                      onClick={() => moveWidget(index, "up")}
                                      className="text-[#646970] hover:text-[#2271b1] disabled:opacity-20"
                                      title={direction === "rtl" ? "تحريك لأعلى" : "Move up"}
                                    >
                                      <ArrowUp className="size-3" />
                                    </button>
                                    <button
                                      type="button"
                                      disabled={index === area.items.length - 1}
                                      onClick={() => moveWidget(index, "down")}
                                      className="text-[#646970] hover:text-[#2271b1] disabled:opacity-20"
                                      title={direction === "rtl" ? "تحريك لأسفل" : "Move down"}
                                    >
                                      <ArrowDown className="size-3" />
                                    </button>
                                  </div>

                                  {/* Visual Layout Wireframe Icon */}
                                  <div className="flex-shrink-0">
                                    <WidgetWireframeIcon
                                      type={item.type}
                                      className="w-7 h-5"
                                      active={isExpanded}
                                    />
                                  </div>

                                  <span className="font-semibold text-[#1d2327]">{itemTitle}</span>
                                  {isPlugin ? (
                                    <span className="rounded bg-purple-100 text-purple-800 text-[9px] px-1.5 py-0.2 font-bold uppercase">
                                      {direction === "rtl" ? "إضافة" : "Plugin"}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-[#646970] font-mono">
                                      ({typeBadge})
                                    </span>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedWidgetId(isExpanded ? null : item.id)
                                  }
                                  className="p-1 text-[#646970] hover:text-[#2271b1]"
                                >
                                  {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                                </button>
                              </div>

                              {/* Expanded Form */}
                              {isExpanded && (
                                <div className="border-t border-[#dcdcde] bg-white p-3.5 space-y-3">
                                  {(() => {
                                    const widgetMod = getWidget(item.type);
                                    if (widgetMod?.AdminForm) {
                                      const FormComponent = widgetMod.AdminForm;
                                      return (
                                        <FormComponent
                                          item={item}
                                          onChange={(updated) => updateWidget(item.id, updated)}
                                          dict={dict}
                                          direction={direction}
                                        />
                                      );
                                    }
                                    return (
                                      <div className="space-y-3">
                                        <div>
                                          <label className="block text-[12px] font-medium text-[#50575e] mb-1">
                                            {dict?.["admin.widgets.widget_title"] || "Widget Title"}
                                          </label>
                                          <input
                                            type="text"
                                            value={item.title}
                                            onChange={(e) => updateWidget(item.id, { title: e.target.value })}
                                            className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none focus:ring-1 focus:ring-[#2271b1]"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-[12px] font-medium text-[#50575e] mb-1">
                                            {dict?.["admin.widgets.content"] || "Content"}
                                          </label>
                                          <textarea
                                            rows={3}
                                            value={item.content || ""}
                                            onChange={(e) => updateWidget(item.id, { content: e.target.value })}
                                            className="w-full rounded-[3px] border border-[#8c8f94] bg-white p-2 text-[12px] text-[#2c3338]"
                                          />
                                        </div>
                                      </div>
                                    );
                                  })()}

                                  <div className="flex items-center justify-between pt-2 border-t border-[#f0f0f1]">
                                    <button
                                      type="button"
                                      onClick={() => removeWidget(item.id)}
                                      className="text-[12px] text-[#b32d2e] hover:underline flex items-center gap-1"
                                    >
                                      <Trash2 className="size-3" />{" "}
                                      {dict?.["admin.widgets.delete"] || "Delete"}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setExpandedWidgetId(null)}
                                      className="text-[12px] text-[#2271b1] hover:underline"
                                    >
                                      {dict?.["admin.widgets.close"] || "Close"}
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* Drop slot at end of area list */}
                        {(draggedPaletteWidget || draggedSource) && (
                          <div
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setDragOverAreaId(area.id);
                              setDragOverItemIndex(area.items.length);
                            }}
                            onDrop={(e) => handleDropOnArea(e, area.id, area.items.length)}
                            className={`p-3 rounded border-2 border-dashed text-center text-xs transition-colors ${
                              dragOverAreaId === area.id && dragOverItemIndex === area.items.length
                                ? "border-[#2271b1] bg-[#f0f6fc] text-[#2271b1] font-semibold"
                                : "border-slate-300 bg-slate-50/80 text-slate-500"
                            }`}
                          >
                            + {direction === "rtl"
                              ? `أفلت هنا للوضع في أسفل ${areaTitle}`
                              : `Drop here to place at bottom of ${areaTitle}`}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div
                        onDragOver={(e) => handleDragOverArea(e, area.id)}
                        onDrop={(e) => handleDropOnArea(e, area.id)}
                        className={`border-2 border-dashed p-6 text-center transition-colors ${
                          dragOverAreaId === area.id
                            ? "border-[#2271b1] bg-[#f0f6fc] text-[#2271b1] font-medium"
                            : "border-[#c3c4c7] text-[#646970] bg-slate-50/50"
                        }`}
                      >
                        {draggedPaletteWidget || draggedSource
                          ? (direction === "rtl" ? `أفلت الودجت هنا لإضافته إلى ${areaTitle}` : `Drop widget here to add to ${areaTitle}`)
                          : dict?.["admin.widgets.no_widgets_in_area"] ||
                            "No widgets in this area yet. Drag any widget from the left or click to add."}
                      </div>
                    )}

                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={handleSaveArea}
                        className="rounded-[3px] border border-[#2271b1] bg-[#2271b1] px-3.5 py-1 text-xs font-medium text-white hover:bg-[#135e96] transition-colors disabled:opacity-50"
                      >
                        {isPending
                          ? dict?.["admin.widgets.saving"] || "Saving..."
                          : `${dict?.["admin.widgets.save_area"] || "Save"} (${areaTitle})`}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
