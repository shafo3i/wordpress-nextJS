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
import { saveWidgetAreaAction } from "@/app/(admin)/admincp/widgets/actions";
import { WidgetWireframeIcon } from "./widget-wireframes";

export function WidgetsManagerShell({
  initialAreas,
  availableWidgets,
}: {
  initialAreas: WidgetArea[];
  availableWidgets: AvailableWidgetDescriptor[];
}) {
  const [areas, setAreas] = useState<WidgetArea[]>(initialAreas);
  const [openAreaId, setOpenAreaId] = useState<string>(initialAreas[0]?.id || "sidebar_primary");
  const [expandedWidgetId, setExpandedWidgetId] = useState<string | null>(null);
  const [draggedPaletteWidget, setDraggedPaletteWidget] = useState<AvailableWidgetDescriptor | null>(null);
  const [draggedSource, setDraggedSource] = useState<{ areaId: string; index: number } | null>(null);
  const [dragOverAreaId, setDragOverAreaId] = useState<string | null>(null);
  const [dragOverItemIndex, setDragOverItemIndex] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

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

  const moveWidget = (index: number, direction: "up" | "down") => {
    if (!currentArea) return;
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= currentArea.items.length) return;

    const updatedItems = [...currentArea.items];
    const temp = updatedItems[index];
    updatedItems[index] = updatedItems[target];
    updatedItems[target] = temp;

    setAreas((curr) =>
      curr.map((a) => (a.id === currentArea.id ? { ...a, items: updatedItems } : a))
    );
  };

  const addWidget = (desc: AvailableWidgetDescriptor) => {
    if (!currentArea) return;

    const defaultTitles: Record<WidgetType, string> = {
      search: "Search Articles",
      recent_posts: "Recent Stories",
      categories: "Categories",
      author_bio: "About the Newsroom",
      custom_html: "Sponsor Advertisement",
      plugin_newsletter: "Morning Dispatch Newsletter",
      plugin_audio: "Daily Audio Stream",
      plugin_breaking: "Urgent News Flash",
      plugin_social: "Follow Our Newsroom",
      plugin_factcheck: "Verified Claim Check",
      plugin_ad: "Monetized Partner Banner",
      plugin_reading_time: "Reading Time Indicator",
      plugin_related_posts: "Recommended Follow-ups",
    };

    const newWidget: WidgetItem = {
      id: `w-${Date.now()}`,
      type: desc.type,
      title: defaultTitles[desc.type] || desc.name,
      pluginSlug: desc.pluginSlug,
      displayStyle: desc.type === "recent_posts" ? "list" : undefined,
      showThumbnail: true,
      showDate: true,
      showExcerpt: false,
      count: desc.type === "recent_posts" ? 5 : undefined,
      content:
        desc.type === "custom_html"
          ? '<div class="ad-banner p-4 bg-slate-100 rounded text-center">Featured Editorial Partner</div>'
          : desc.type === "plugin_newsletter"
          ? "Receive top investigative stories and digital market briefings directly in your inbox."
          : desc.type === "plugin_audio"
          ? "Daily 5-minute newsroom podcast covering breaking market stories."
          : desc.type === "plugin_breaking"
          ? "Emergency market circuit breaker triggered across secondary commodities."
          : desc.type === "plugin_factcheck"
          ? "Claim: Global shipping rates decline 40% in Q3. Verdict: TRUE (Verified by Bureau Desk)."
          : desc.type === "plugin_ad"
          ? "Premium enterprise sponsor of Signal News Digital Edition."
          : desc.type === "plugin_reading_time"
          ? "Calculates estimated read speed (~200 wpm) and word counts dynamically."
          : desc.type === "plugin_related_posts"
          ? "Surfaces contextual stories and editorial follow-ups based on category."
          : undefined,
    };

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
      if (res.error) {
        alert(res.error);
      } else {
        setNotice(`Widget area "${currentArea.title}" saved successfully!`);
        setTimeout(() => setNotice(null), 3000);
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-4 text-[13px]">
      <div className="flex items-center justify-between border-b border-[#c3c4c7] pb-3">
        <div>
          <h1 className="text-[23px] font-normal leading-[1.3] text-[#1d2327]">Widgets</h1>
          <p className="text-[12px] text-[#646970]">
            Manage sidebars, dual-sidebar columns, and footer widget areas. Active plugins automatically provide widgets below.
          </p>
        </div>

        <button
          type="button"
          disabled={isPending}
          onClick={handleSaveArea}
          className="rounded-[3px] border border-[#2271b1] bg-[#2271b1] px-4 py-1.5 font-medium text-white hover:bg-[#135e96] transition-colors disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Save Widget Area"}
        </button>
      </div>

      {notice && (
        <div className="flex items-center justify-between border-l-4 border-[#00a32a] bg-[#f0f6fc] p-3 text-[13px] text-[#1d2327]">
          <span>✓ {notice}</span>
          <button type="button" onClick={() => setNotice(null)} className="text-lg leading-none text-slate-400">
            ×
          </button>
        </div>
      )}

      {/* 2-Column WordPress Widgets Layout */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[320px_1fr] items-start">
        {/* Left Available Widgets Palette */}
        <div className="rounded-[3px] border border-[#c3c4c7] bg-white p-4 shadow-[0_1px_1px_rgba(0,0,0,0.04)] space-y-4">
          <div>
            <h3 className="font-semibold text-[#1d2327] text-sm">Available Widgets</h3>
            <p className="text-[12px] text-[#646970]">
              Drag widgets onto any area on the right, or click to append to <strong>{currentArea?.title}</strong>:
            </p>
          </div>

          {/* Core Widgets */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block border-b pb-1">
              Core Newsroom Widgets
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
                  className="flex w-full items-start gap-2.5 rounded border border-[#dcdcde] bg-white p-2.5 text-left hover:border-[#2271b1] hover:bg-[#f0f6fc] transition-colors group cursor-grab active:cursor-grabbing select-none"
                  title="Drag onto an area or click to add"
                >
                  <div className="flex-shrink-0 pt-0.5">
                    <WidgetWireframeIcon type={w.type} className="w-8 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#1d2327] group-hover:text-[#2271b1] block text-[12px]">
                        + {w.name}
                      </span>
                      <GripVertical className="size-3.5 text-slate-400 group-hover:text-[#2271b1] opacity-60" />
                    </div>
                    <span className="text-[11px] text-[#646970] leading-tight block mt-0.5">
                      {w.desc}
                    </span>
                  </div>
                </div>
              ))}
          </div>

          {/* Plugin-Provided Widgets */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between border-b pb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 flex items-center gap-1">
                <Sparkles className="size-3" /> Installed Plugin Widgets
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
                    className="flex w-full items-start gap-2.5 rounded border border-purple-200 bg-purple-50/40 p-2.5 text-left hover:border-purple-500 hover:bg-purple-100/50 transition-colors group cursor-grab active:cursor-grabbing select-none"
                    title="Drag onto an area or click to add"
                  >
                    <div className="flex-shrink-0 pt-0.5">
                      <WidgetWireframeIcon type={w.type} className="w-8 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-purple-950 group-hover:text-purple-700 text-[12px]">
                          + {w.name}
                        </span>
                        <GripVertical className="size-3.5 text-purple-400 group-hover:text-purple-600 opacity-60" />
                      </div>
                      <span className="text-[11px] text-purple-800/80 leading-tight block mt-0.5">
                        {w.desc}
                      </span>
                    </div>
                  </div>
                ))
            ) : (
              <p className="text-[11px] text-slate-500 italic p-2 bg-slate-50 border rounded">
                No plugin widgets available. Activate plugins in <em>Plugins → Installed Plugins</em> to enable widgets here.
              </p>
            )}
          </div>
        </div>

        {/* Right Widget Areas Accordion */}
        <div className="space-y-3">
          {areas.map((area) => {
            const isOpen = openAreaId === area.id;
            const isAreaDragOver = dragOverAreaId === area.id;

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
                  className={`flex w-full items-center justify-between border-b border-[#c3c4c7] px-4 py-3 text-left font-semibold text-[#2c3338] transition-colors ${
                    isOpen ? "bg-[#f0f0f1]" : "bg-[#f6f7f7] hover:bg-[#f0f0f1]"
                  }`}
                >
                  <div>
                    <span className="text-sm text-[#1d2327]">{area.title}</span>
                    {area.id === "sidebar_secondary" && (
                      <span className="ml-2 rounded bg-indigo-100 text-indigo-800 text-[10px] px-1.5 py-0.5 font-bold uppercase">
                        Dual Sidebar
                      </span>
                    )}
                    <span className="text-[11px] font-normal text-[#646970] ml-2 block sm:inline">
                      {area.description}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#646970] font-normal">
                      {area.items.length} widget{area.items.length === 1 ? "" : "s"}
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
                                    title="Drag to reorder"
                                  >
                                    <GripVertical className="size-4" />
                                  </div>

                                  <div className="flex flex-col">
                                    <button
                                      type="button"
                                      disabled={index === 0}
                                      onClick={() => moveWidget(index, "up")}
                                      className="text-[#646970] hover:text-[#2271b1] disabled:opacity-20"
                                    >
                                      <ArrowUp className="size-3" />
                                    </button>
                                    <button
                                      type="button"
                                      disabled={index === area.items.length - 1}
                                      onClick={() => moveWidget(index, "down")}
                                      className="text-[#646970] hover:text-[#2271b1] disabled:opacity-20"
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

                                  <span className="font-semibold text-[#1d2327]">{item.title}</span>
                                  {isPlugin ? (
                                    <span className="rounded bg-purple-100 text-purple-800 text-[9px] px-1.5 py-0.2 font-bold uppercase">
                                      Plugin
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-[#646970] font-mono">({item.type})</span>
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
                                  <div>
                                    <label className="block text-[12px] font-medium text-[#50575e] mb-1">
                                      Widget Title
                                    </label>
                                    <input
                                      type="text"
                                      value={item.title}
                                      onChange={(e) => updateWidget(item.id, { title: e.target.value })}
                                      className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none focus:ring-1 focus:ring-[#2271b1]"
                                    />
                                  </div>

                                  {item.type === "recent_posts" && (
                                    <div className="space-y-3">
                                      <div className="border-t border-[#f0f0f1] pt-2 space-y-2">
                                        <label className="block text-[12px] font-medium text-[#50575e]">
                                          Display Layout Style:
                                        </label>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                          {[
                                            { id: "list", label: "Thumbnail List", desc: "Left thumb + title" },
                                            { id: "compact", label: "Compact Wire", desc: "Bullet headline wire" },
                                            { id: "card", label: "Mini Cards", desc: "Stacked photo cards" },
                                            { id: "numbered", label: "Leaderboard", desc: "Numbered 01-05" },
                                          ].map((styleOpt) => {
                                            const isSel = (item.displayStyle || "list") === styleOpt.id;
                                            return (
                                              <button
                                                key={styleOpt.id}
                                                type="button"
                                                onClick={() =>
                                                  updateWidget(item.id, {
                                                    displayStyle: styleOpt.id as WidgetDisplayStyle,
                                                  })
                                                }
                                                className={`p-2 rounded border text-left transition-all ${
                                                  isSel
                                                    ? "border-[#2271b1] bg-[#f0f6fc] ring-1 ring-[#2271b1]"
                                                    : "border-[#dcdcde] bg-white hover:border-[#8c8f94]"
                                                }`}
                                              >
                                                <span
                                                  className={`block text-[11px] font-semibold ${
                                                    isSel ? "text-[#2271b1]" : "text-[#1d2327]"
                                                  }`}
                                                >
                                                  {styleOpt.label}
                                                </span>
                                                <span className="text-[10px] text-[#646970] block">
                                                  {styleOpt.desc}
                                                </span>
                                              </button>
                                            );
                                          })}
                                        </div>

                                        <div className="flex flex-wrap gap-4 pt-1">
                                          <label className="flex items-center gap-1.5 text-[11px] text-[#50575e] cursor-pointer">
                                            <input
                                              type="checkbox"
                                              checked={item.showThumbnail !== false}
                                              onChange={(e) =>
                                                updateWidget(item.id, { showThumbnail: e.target.checked })
                                              }
                                              className="rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
                                            />
                                            Show Thumbnail
                                          </label>
                                          <label className="flex items-center gap-1.5 text-[11px] text-[#50575e] cursor-pointer">
                                            <input
                                              type="checkbox"
                                              checked={item.showDate !== false}
                                              onChange={(e) =>
                                                updateWidget(item.id, { showDate: e.target.checked })
                                              }
                                              className="rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
                                            />
                                            Show Date
                                          </label>
                                          <label className="flex items-center gap-1.5 text-[11px] text-[#50575e] cursor-pointer">
                                            <input
                                              type="checkbox"
                                              checked={Boolean(item.showExcerpt)}
                                              onChange={(e) =>
                                                updateWidget(item.id, { showExcerpt: e.target.checked })
                                              }
                                              className="rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
                                            />
                                            Show Excerpt
                                          </label>
                                        </div>
                                      </div>

                                      <div>
                                        <label className="block text-[12px] font-medium text-[#50575e] mb-1">
                                          Number of posts to show
                                        </label>
                                        <input
                                          type="number"
                                          min="1"
                                          max="15"
                                          value={item.count || 5}
                                          onChange={(e) =>
                                            updateWidget(item.id, { count: Number(e.target.value) || 5 })
                                          }
                                          className="h-[30px] w-24 rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px] text-[#2c3338]"
                                        />
                                      </div>
                                    </div>
                                  )}

                                  {(item.type === "custom_html" ||
                                    item.type === "author_bio" ||
                                    item.type === "plugin_newsletter" ||
                                    item.type === "plugin_audio" ||
                                    item.type === "plugin_breaking" ||
                                    item.type === "plugin_factcheck" ||
                                    item.type === "plugin_ad" ||
                                    item.type === "plugin_reading_time" ||
                                    item.type === "plugin_related_posts") && (
                                    <div>
                                      <label className="block text-[12px] font-medium text-[#50575e] mb-1">
                                        {item.type === "custom_html"
                                          ? "HTML Code"
                                          : item.type === "plugin_newsletter"
                                          ? "Subscription Prompt Message"
                                          : item.type === "plugin_audio"
                                          ? "Podcast Stream Description"
                                          : item.type === "plugin_breaking"
                                          ? "Breaking Dispatch Text"
                                          : item.type === "plugin_factcheck"
                                          ? "Claim & Rating Text"
                                          : item.type === "plugin_ad"
                                          ? "Sponsor Tagline"
                                          : item.type === "plugin_reading_time"
                                          ? "Reading Time Description"
                                          : item.type === "plugin_related_posts"
                                          ? "Related Stories Subtitle"
                                          : "Bio Content"}
                                      </label>
                                      <textarea
                                        rows={3}
                                        value={item.content || ""}
                                        onChange={(e) => updateWidget(item.id, { content: e.target.value })}
                                        className="w-full rounded-[3px] border border-[#8c8f94] bg-white p-2 text-[12px] text-[#2c3338]"
                                      />
                                    </div>
                                  )}

                                  <div className="flex items-center justify-between pt-2 border-t border-[#f0f0f1]">
                                    <button
                                      type="button"
                                      onClick={() => removeWidget(item.id)}
                                      className="text-[12px] text-[#b32d2e] hover:underline flex items-center gap-1"
                                    >
                                      <Trash2 className="size-3" /> Delete
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setExpandedWidgetId(null)}
                                      className="text-[12px] text-[#2271b1] hover:underline"
                                    >
                                      Close
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
                            + Drop here to place at bottom of {area.title}
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
                          ? "Drop widget here to add to " + area.title
                          : "No widgets in this area yet. Drag any widget from the left or click to add."}
                      </div>
                    )}

                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={handleSaveArea}
                        className="rounded-[3px] border border-[#2271b1] bg-[#2271b1] px-3.5 py-1 text-xs font-medium text-white hover:bg-[#135e96] transition-colors disabled:opacity-50"
                      >
                        Save {area.title}
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
