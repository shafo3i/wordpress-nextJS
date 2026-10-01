"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Columns3,
  LayoutTemplate,
  Plus,
  Puzzle,
  SidebarClose,
  SidebarOpen,
} from "lucide-react";
import {
  BlockDisplayStyle,
  HomepageBlock,
  HomepageBlockType,
  HomepageLayout,
  HomepageSettings,
  PageBuilderSection,
  RowPreset,
  THEME_DEFAULT_SETTINGS,
  flattenSectionsToBlocks,
  normalizeHomepageSettings,
} from "@/lib/themes/homepage-types";
import { Theme } from "@/lib/themes/types";
import { saveHomepageSettingsAction } from "../actions";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { BlockWireframeIcon } from "./block-wireframes";
import { ThemeSettingsHeader } from "./theme-settings-header";
import { BuilderSectionCard } from "./builder-section-card";
import type { AvailableWidgetDescriptor } from "@/lib/widgets/types";
import {
  addItemToColumn,
  changeRowPreset,
  createDefaultRow,
  createDefaultSection,
  deleteRowFromSections,
  deleteSectionFromList,
  reorderArray,
  removeItemFromColumn,
  toggleBlockEnabledInSections,
  updateBlockInColumn,
  updateWidgetInColumn,
} from "./builder-state-helpers";

interface ThemeSettingsShellProps {
  themeSlug: string;
  themeName: string;
  allThemes: Theme[];
  initialSettings: HomepageSettings;
  categories: { id: string; name: string; slug: string }[];
  availableWidgets?: AvailableWidgetDescriptor[];
  dict?: Record<string, string>;
  direction?: "rtl" | "ltr";
}

export function ThemeSettingsShell({
  themeSlug,
  themeName,
  allThemes,
  initialSettings,
  categories,
  availableWidgets: availableWidgetsProp = [],
  dict,
  direction = "ltr",
}: ThemeSettingsShellProps) {
  const isRtl = direction === "rtl";
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const t = (key: string, enFallback: string, arFallback: string) => {
    if (isRtl) return dict?.[key] || arFallback;
    return dict?.[key] || enFallback;
  };

  // Normalize initial data to sections
  const initialNormalized = normalizeHomepageSettings(initialSettings);
  const [layout, setLayout] = useState<HomepageLayout>(initialNormalized.layout || "right_sidebar");
  const [sections, setSections] = useState<PageBuilderSection[]>(initialNormalized.sections);
  const [expandedBlockId, setExpandedBlockId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"blocks" | "widgets">("blocks");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  const availableBlockTypes: HomepageBlockType[] = [
    "magazine_bento",
    "broadsheet_3col",
    "hero_slider",
    "big_lead_side_list",
    "news_list",
    "visual_grid",
    "tabbed_block",
    "category_grid",
    "trending",
    "opinion",
    "multimedia",
    "newsletter",
  ];

  const getWidgetName = (w: AvailableWidgetDescriptor) => {
    return dict?.[`admin.widgets.descriptor.${w.type}.name`] || w.name;
  };

  const getWidgetDesc = (w: AvailableWidgetDescriptor) => {
    return dict?.[`admin.widgets.descriptor.${w.type}.desc`] || w.desc;
  };

  const availableWidgets = availableWidgetsProp.map((w) => ({
    type: w.type,
    name: getWidgetName(w),
    desc: getWidgetDesc(w),
  }));

  const LAYOUT_OPTIONS: {
    id: HomepageLayout;
    name: string;
    description: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: "full_width",
      name: t("admin.theme_settings.layout.full_width.name", "Full Width", "عرض كامل"),
      description: t("admin.theme_settings.layout.full_width.desc", "Immersive single-column magazine flow without sidebars", "تدفق مجلة غامر من عمود واحد بدون أشرطة جانبية"),
      icon: <LayoutTemplate className="size-6 text-slate-700" />,
    },
    {
      id: "right_sidebar",
      name: t("admin.theme_settings.layout.right_sidebar.name", "Right Sidebar", "شريط جانبي أيمن"),
      description: t("admin.theme_settings.layout.right_sidebar.desc", "Editorial stories with main widget sidebar on the right", "مقالات تحريرية مع شريط ودجات رئيسي على اليمين"),
      icon: <SidebarClose className="size-6 text-slate-700" />,
    },
    {
      id: "left_sidebar",
      name: t("admin.theme_settings.layout.left_sidebar.name", "Left Sidebar", "شريط جانبي أيسر"),
      description: t("admin.theme_settings.layout.left_sidebar.desc", "Main widget sidebar on the left with editorial stories", "شريط ودجات رئيسي على اليسار مع مقالات تحريرية"),
      icon: <SidebarOpen className="size-6 text-slate-700" />,
    },
    {
      id: "dual_sidebar",
      name: t("admin.theme_settings.layout.dual_sidebar.name", "Dual Sidebars (3 Columns)", "أشرطة جانبية مزدوجة (3 أعمدة)"),
      description: t("admin.theme_settings.layout.dual_sidebar.desc", "Left Sidebar + Center Editorial Stream + Right Sidebar", "شريط جانبي أيسر + تيار المقالات التحريرية + شريط جانبي أيمن"),
      icon: <Columns3 className="size-6 text-indigo-700" />,
    },
  ];

  // Helper to create a new block
  const createNewBlock = (type: HomepageBlockType): HomepageBlock => {
    const defaultStyles: Partial<Record<HomepageBlockType, BlockDisplayStyle>> = {
      magazine_bento: "bento",
      broadsheet_3col: "broadsheet_wire",
      hero_slider: "hero_slider",
      big_lead_side_list: "lead_side_list",
      news_list: "list_thumb_left",
      visual_grid: "overlay_cards",
      category_grid: "grid_3",
      hero: "lead_side_list",
    };

    const name = dict?.[`admin.theme_settings.block.${type}.name`] || type;

    return {
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type,
      title: "",
      displayStyle: defaultStyles[type] || "grid_3",
      imageRatio: "landscape",
      showExcerpt: true,
      showAuthor: true,
      showDate: true,
      showCategory: true,
      enabled: true,
      categorySlug: categories[0]?.slug || "all",
      postCount:
        type === "magazine_bento" ? 5 :
        type === "broadsheet_3col" ? 6 :
        type === "hero_slider" ? 5 :
        type === "big_lead_side_list" ? 4 :
        type === "visual_grid" ? 3 :
        type === "news_list" ? 4 : 4,
      order: 1,
    };
  };

  // Section Management Handlers
  const handleAddSection = () => {
    const newSec = createDefaultSection("");
    setSections((prev) => [...prev, newSec]);
  };

  const handleUpdateSection = (sectionIndex: number, updates: Partial<PageBuilderSection>) => {
    setSections((prev) =>
      prev.map((sec, idx) => (idx === sectionIndex ? { ...sec, ...updates } : sec))
    );
  };

  const handleMoveSection = (index: number, moveDir: "up" | "down") => {
    const target = moveDir === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= sections.length) return;
    setSections((prev) => reorderArray(prev, index, target));
  };

  const handleDeleteSection = (sectionId: string) => {
    setSections((prev) => deleteSectionFromList(prev, sectionId));
  };

  // Row Management Handlers
  const handleAddRow = (sectionIndex: number) => {
    const newRow = createDefaultRow("1/1");
    setSections((prev) =>
      prev.map((sec, idx) =>
        idx === sectionIndex ? { ...sec, rows: [...sec.rows, newRow] } : sec
      )
    );
  };

  const handleUpdateRowPreset = (sectionIndex: number, rowId: string, preset: RowPreset) => {
    setSections((prev) =>
      prev.map((sec, idx) => {
        if (idx !== sectionIndex) return sec;
        return {
          ...sec,
          rows: sec.rows.map((row) => (row.id === rowId ? changeRowPreset(row, preset) : row)),
        };
      })
    );
  };

  const handleMoveRow = (sectionIndex: number, rowIndex: number, moveDir: "up" | "down") => {
    const target = moveDir === "up" ? rowIndex - 1 : rowIndex + 1;
    setSections((prev) =>
      prev.map((sec, idx) => {
        if (idx !== sectionIndex) return sec;
        if (target < 0 || target >= sec.rows.length) return sec;
        return { ...sec, rows: reorderArray(sec.rows, rowIndex, target) };
      })
    );
  };

  const handleDeleteRow = (rowId: string) => {
    setSections((prev) => deleteRowFromSections(prev, rowId));
  };

  // Column Item Management Handlers
  const handleAddItemToColumn = (columnId: string, type: "block" | "widget", payload: string) => {
    if (type === "block") {
      const block = createNewBlock(payload as HomepageBlockType);
      setSections((prev) => addItemToColumn(prev, columnId, { id: `item-${block.id}`, type: "block", block }));
      setExpandedBlockId(block.id);
    } else {
      const widgetName = availableWidgets.find((w) => w.type === payload)?.name || payload;
      setSections((prev) =>
        addItemToColumn(prev, columnId, {
          id: `item-w-${payload}-${Date.now()}`,
          type: "widget",
          widgetId: payload,
          title: "",
        })
      );
    }
  };

  // Adding from Tray directly
  const handleAddFromTray = (type: "block" | "widget", payload: string) => {
    let currentSections = [...sections];
    if (currentSections.length === 0) {
      currentSections = [createDefaultSection("")];
    }
    const lastSec = currentSections[currentSections.length - 1];
    if (lastSec.rows.length === 0) {
      lastSec.rows = [createDefaultRow("1/1")];
    }
    const lastRow = lastSec.rows[lastSec.rows.length - 1];
    const targetCol = lastRow.columns[0];

    if (type === "block") {
      const block = createNewBlock(payload as HomepageBlockType);
      const updated = addItemToColumn(currentSections, targetCol.id, {
        id: `item-${block.id}`,
        type: "block",
        block,
      });
      setSections(updated);
      setExpandedBlockId(block.id);
    } else {
      const updated = addItemToColumn(currentSections, targetCol.id, {
        id: `item-w-${payload}-${Date.now()}`,
        type: "widget",
        widgetId: payload,
        title: "",
      });
      setSections(updated);
    }
  };

  const handleUpdateBlock = (blockId: string, updates: Partial<HomepageBlock>) => {
    setSections((prev) => updateBlockInColumn(prev, blockId, updates));
  };

  const handleToggleBlockEnabled = (blockId: string) => {
    setSections((prev) => toggleBlockEnabledInSections(prev, blockId));
  };

  const handleRemoveItem = (columnId: string, itemId: string) => {
    setSections((prev) => removeItemFromColumn(prev, columnId, itemId));
  };

  const handleUpdateWidget = (columnId: string, itemId: string, updates: any) => {
    setSections((prev) => updateWidgetInColumn(prev, columnId, itemId, updates));
  };

  // Save Settings
  const handleSave = () => {
    startTransition(async () => {
      const flattenedBlocks = flattenSectionsToBlocks(sections);
      const res = await saveHomepageSettingsAction(themeSlug, {
        layout,
        blocks: flattenedBlocks,
        sections,
      });
      if (!res.success || res.error) {
        setFeedback({
          type: "error",
          message: res.error || t("admin.theme_settings.save_failed", "Failed to save homepage layout settings.", "فشل حفظ إعدادات تخطيط الصفحة الرئيسية."),
        });
      } else {
        const msg = t("admin.theme_settings.save_success", "Homepage settings saved successfully!", "تم حفظ إعدادات الصفحة الرئيسية بنجاح!");
        setFeedback({ type: "success", message: msg });
        setTimeout(() => setFeedback(null), 3500);
        router.refresh();
      }
    });
  };

  // Reset to Defaults
  const loadThemeDefaults = () => {
    setConfirmResetOpen(true);
  };

  const executeLoadThemeDefaults = () => {
    const defaults = THEME_DEFAULT_SETTINGS[themeSlug] || THEME_DEFAULT_SETTINGS["ledger-classic"];
    setLayout(defaults.layout);
    const normalizedDefaults = normalizeHomepageSettings(defaults);
    setSections(normalizedDefaults.sections);
    const msg = `${t("admin.theme_settings.loaded_defaults", "Loaded signature layout for", "تم تحميل التخطيط الافتراضي لـ")} ${themeName}`;
    setFeedback({ type: "success", message: msg });
    setTimeout(() => setFeedback(null), 3000);
  };

  return (
    <div dir={direction} className="space-y-6 text-[13px] text-start">
      <ThemeSettingsHeader
        themeSlug={themeSlug}
        themeName={themeName}
        allThemes={allThemes}
        isPending={isPending}
        onSave={handleSave}
        onReset={loadThemeDefaults}
        dict={dict}
        direction={direction}
      />

      {/* Inline Feedback Notice Banner */}
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

      {/* SECTION 1: HOMEPAGE SIDEBAR ARCHITECTURE SELECTOR */}
      <div className="rounded-[3px] border border-[#c3c4c7] bg-white p-5 shadow-[0_1px_1px_rgba(0,0,0,0.04)] space-y-3">
        <div className="flex items-center justify-between border-b border-[#f0f0f1] pb-2">
          <div>
            <h2 className="text-sm font-semibold text-[#1d2327]">
              {t("admin.theme_settings.section1_title", "1. Homepage Sidebar Layout Architecture", "1. بنية تخطيط الشريط الجانبي للصفحة الرئيسية")}
            </h2>
            <p className="text-[12px] text-[#646970]">
              {t("admin.theme_settings.section1_desc", "Choose whether your homepage features full-width magazine sections, 1 sidebar, or a 3-column broadsheet.", "اختر ما إذا كانت صفحتك الرئيسية تتضمن أقسام مجلة بعرض كامل، أو شريطاً جانبياً واحداً، أو صحيفة من 3 أعمدة.")}
            </p>
          </div>
          <span className="rounded bg-blue-100 text-blue-800 text-[11px] font-bold px-2 py-0.5 uppercase">
            {t("admin.theme_settings.active_layout", "Active:", "النشط:")}{" "}
            {LAYOUT_OPTIONS.find((l) => l.id === layout)?.name}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {LAYOUT_OPTIONS.map((opt) => {
            const isSelected = layout === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setLayout(opt.id)}
                className={`flex flex-col items-start p-3.5 rounded-lg border text-start transition-all ${
                  isSelected
                    ? "border-[#2271b1] bg-[#f0f6fc] ring-2 ring-[#2271b1]"
                    : "border-[#dcdcde] bg-white hover:border-[#8c8f94] hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <div className="p-2 rounded bg-white shadow-sm border border-slate-200">
                    {opt.icon}
                  </div>
                  <input
                    type="radio"
                    name="homepage_layout"
                    checked={isSelected}
                    onChange={() => setLayout(opt.id)}
                    className="size-4 text-[#2271b1] focus:ring-[#2271b1]"
                  />
                </div>
                <strong className="text-sm text-[#1d2327] font-semibold block">{opt.name}</strong>
                <span className="text-[11px] text-[#646970] mt-1 leading-snug block">
                  {opt.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: PAGE BUILDER (SECTIONS & COLUMNS) */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[330px_1fr] items-start">
        {/* Left Available Tray (Blocks & Widgets) */}
        <div className="rounded-[3px] border border-[#c3c4c7] bg-white p-4 shadow-[0_1px_1px_rgba(0,0,0,0.04)] space-y-3 sticky top-4">
          <div className="border-b border-[#f0f0f1] pb-2">
            <h3 className="font-semibold text-[#1d2327] text-sm">
              {t("admin.theme_settings.section2_title", "2. Add Magazine Elements", "2. إضافة عناصر المجلة")}
            </h3>
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => setActiveTab("blocks")}
                className={`flex-1 py-1 text-xs font-bold rounded border transition-colors ${
                  activeTab === "blocks"
                    ? "border-[#2271b1] bg-[#2271b1] text-white"
                    : "border-[#dcdcde] bg-white text-[#50575e] hover:bg-slate-50"
                }`}
              >
                {t("admin.builder.tab_blocks", "Editorial Blocks", "الكتل التحريرية")}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("widgets")}
                className={`flex-1 py-1 text-xs font-bold rounded border transition-colors ${
                  activeTab === "widgets"
                    ? "border-[#2271b1] bg-[#2271b1] text-white"
                    : "border-[#dcdcde] bg-white text-[#50575e] hover:bg-slate-50"
                }`}
              >
                {t("admin.builder.tab_widgets", "Modular Widgets", "الأدوات والودجات")}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#646970] px-0.5 pt-1">
            <span>
              {t(
                "admin.builder.drag_hint",
                "Drag into column or click to add:",
                "اسحب إلى أي عمود أو انقر للإضافة:"
              )}
            </span>
          </div>

          <div className="space-y-2 pt-1 max-h-[620px] overflow-y-auto pe-1">
            {activeTab === "blocks"
              ? availableBlockTypes.map((type) => {
                  const name = dict?.[`admin.theme_settings.block.${type}.name`] || type;
                  const desc = dict?.[`admin.theme_settings.block.${type}.desc`] || "";
                  return (
                    <button
                      key={type}
                      type="button"
                      draggable={true}
                      onDragStart={(e) => {
                        e.dataTransfer.setData(
                          "application/json",
                          JSON.stringify({ type: "block", payload: type })
                        );
                        e.dataTransfer.effectAllowed = "copy";
                      }}
                      onClick={() => handleAddFromTray("block", type)}
                      className="flex w-full items-start gap-3 rounded border border-[#dcdcde] bg-white p-2.5 text-start hover:border-[#2271b1] hover:bg-[#f0f6fc] transition-colors group cursor-grab active:cursor-grabbing select-none"
                    >
                      <div className="flex-shrink-0 pt-0.5 pointer-events-none">
                        <BlockWireframeIcon type={type} className="w-10 h-7" />
                      </div>
                      <div className="flex-1 min-w-0 pointer-events-none">
                        <span className="font-semibold text-[#1d2327] group-hover:text-[#2271b1] block text-[12px]">
                          + {name}
                        </span>
                        <span className="text-[11px] text-[#646970] leading-tight block mt-0.5">
                          {desc}
                        </span>
                      </div>
                    </button>
                  );
                })
              : availableWidgets.map((w) => (
                  <button
                    key={w.type}
                    type="button"
                    draggable={true}
                    onDragStart={(e) => {
                      e.dataTransfer.setData(
                        "application/json",
                        JSON.stringify({ type: "widget", payload: w.type })
                      );
                      e.dataTransfer.effectAllowed = "copy";
                    }}
                    onClick={() => handleAddFromTray("widget", w.type)}
                    className="flex w-full items-start gap-3 rounded border border-[#dcdcde] bg-white p-2.5 text-start hover:border-[#2271b1] hover:bg-[#f0f6fc] transition-colors group cursor-grab active:cursor-grabbing select-none"
                  >
                    <div className="size-8 rounded bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center flex-shrink-0 pointer-events-none">
                      <Puzzle className="size-4" />
                    </div>
                    <div className="flex-1 min-w-0 pointer-events-none">
                      <span className="font-semibold text-[#1d2327] group-hover:text-[#2271b1] block text-[12px]">
                        + {w.name}
                      </span>
                      <span className="text-[11px] text-[#646970] leading-tight block mt-0.5">
                        {w.desc}
                      </span>
                    </div>
                  </button>
                ))}
          </div>
        </div>

        {/* Right Active Page Builder */}
        <div className="space-y-4">
          <div className="rounded-[3px] border border-[#c3c4c7] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.04)]">
            <div className="border-b border-[#c3c4c7] bg-[#f6f7f7] px-4 py-3 flex items-center justify-between">
              <div>
                <span className="font-semibold text-[#1d2327]">
                  {t("admin.builder.sections_title", "Homepage Sections & Columns Builder", "منشئ أقسام وأعمدة الصفحة الرئيسية")}
                </span>
                <span className="text-[12px] text-[#646970] ms-2 font-normal">
                  {t("admin.theme_settings.story_flow_hint", "(Click block to customize display layout, category, and metadata)", "(انقر على الكتلة لتخصيص تخطيط العرض والتصنيف والبيانات الوصفية)")}
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddSection}
                className="rounded-[3px] border border-[#2271b1] text-[#2271b1] bg-white hover:bg-blue-50 px-3 py-1 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Plus className="size-3.5" />
                <span>{t("admin.builder.add_section", "Add Section", "إضافة قسم جديد")}</span>
              </button>
            </div>

            <div className="p-4 space-y-4">
              {sections.length > 0 ? (
                sections.map((section, sIdx) => (
                  <BuilderSectionCard
                    key={section.id}
                    section={section}
                    sectionIndex={sIdx}
                    totalSections={sections.length}
                    categories={categories}
                    dict={dict}
                    direction={direction}
                    expandedBlockId={expandedBlockId}
                    onSetExpandedBlockId={setExpandedBlockId}
                    onUpdateSection={(updates) => handleUpdateSection(sIdx, updates)}
                    onMoveSectionUp={() => handleMoveSection(sIdx, "up")}
                    onMoveSectionDown={() => handleMoveSection(sIdx, "down")}
                    onDeleteSection={() => handleDeleteSection(section.id)}
                    onAddRow={() => handleAddRow(sIdx)}
                    onUpdateRowPreset={(rowId, preset) => handleUpdateRowPreset(sIdx, rowId, preset)}
                    onMoveRow={(rowIdx, moveDir) => handleMoveRow(sIdx, rowIdx, moveDir)}
                    onDeleteRow={handleDeleteRow}
                    onUpdateBlock={handleUpdateBlock}
                    onToggleBlockEnabled={handleToggleBlockEnabled}
                    onRemoveItem={handleRemoveItem}
                    onUpdateWidget={handleUpdateWidget}
                    onAddItemToColumn={handleAddItemToColumn}
                    availableBlockTypes={availableBlockTypes}
                    availableWidgets={availableWidgets}
                  />
                ))
              ) : (
                <div className="p-8 text-center text-[#646970] border border-dashed border-[#c3c4c7] rounded">
                  <p className="mb-3">
                    {t(
                      "admin.theme_settings.no_blocks",
                      "No sections active for this theme. Click '+ Add Section' or select a block from the left.",
                      "لا توجد أقسام نشطة لهذا القالب. انقر على '+ إضافة قسم جديد' أو اختر كتلة من اليمين."
                    )}
                  </p>
                  <button
                    type="button"
                    onClick={handleAddSection}
                    className="rounded-[3px] border border-[#2271b1] bg-[#2271b1] text-white px-3 py-1 text-xs font-medium"
                  >
                    + {t("admin.builder.add_section", "Add Section", "إضافة قسم جديد")}
                  </button>
                </div>
              )}
            </div>

            <div className="border-t border-[#c3c4c7] bg-[#f6f7f7] px-4 py-3 flex justify-end">
              <button
                type="button"
                disabled={isPending}
                onClick={handleSave}
                className="rounded-[3px] border border-[#2271b1] bg-[#2271b1] px-4 py-1.5 font-medium text-white hover:bg-[#135e96] transition-colors disabled:opacity-50 shadow-sm"
              >
                {isPending
                  ? t("admin.theme_settings.saving", "Saving...", "جاري الحفظ...")
                  : t("admin.theme_settings.save_layout", "Save Layout", "حفظ التخطيط")}
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmResetOpen}
        onOpenChange={setConfirmResetOpen}
        title={t("admin.theme_settings.reset_confirm_title", "Reset Homepage Blocks", "استعادة كتل الصفحة الرئيسية")}
        description={`${t("admin.theme_settings.reset_confirm_desc", "Reset homepage blocks to signature defaults for", "هل ترغب في استعادة كتل الصفحة الرئيسية إلى الإعدادات الافتراضية الخاصة بـ")} "${themeName}"?`}
        confirmText={t("admin.theme_settings.reset_confirm_btn", "Reset Defaults", "استعادة الافتراضيات")}
        cancelText={t("admin.theme_settings.cancel", "Cancel", "إلغاء")}
        variant="default"
        onConfirm={executeLoadThemeDefaults}
      />
    </div>
  );
}
