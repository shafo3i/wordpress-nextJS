"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Trash2,
  Columns3,
  LayoutTemplate,
  SidebarClose,
  SidebarOpen,
  RotateCcw,
} from "lucide-react";
import {
  BlockDisplayStyle,
  HomepageBlock,
  HomepageBlockType,
  HomepageLayout,
  HomepageSettings,
  ImageRatio,
  THEME_DEFAULT_SETTINGS,
} from "@/lib/themes/homepage-types";
import { Theme } from "@/lib/themes/types";
import { saveHomepageSettingsAction } from "@/app/(admin)/admincp/theme-settings/actions";
import {
  BlockWireframeIcon,
  BentoWireframe,
  LeadSideListWireframe,
  LeadRightSideListWireframe,
  Grid3Wireframe,
  Grid4Wireframe,
  ListThumbLeftWireframe,
  ListThumbRightWireframe,
  Broadsheet3ColWireframe,
  HeroSliderWireframe,
  OverlayCardsWireframe,
  MinimalTextWireframe,
} from "./block-wireframes";

export function ThemeSettingsShell({
  themeSlug,
  themeName,
  allThemes,
  initialSettings,
  categories,
}: {
  themeSlug: string;
  themeName: string;
  allThemes: Theme[];
  initialSettings: HomepageSettings;
  categories: { id: string; name: string; slug: string }[];
}) {
  const [layout, setLayout] = useState<HomepageLayout>(initialSettings.layout || "right_sidebar");
  const [blocks, setBlocks] = useState<HomepageBlock[]>(initialSettings.blocks);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Reorder via Drag and Drop
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = "move";
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const updated = [...blocks];
    const [moved] = updated.splice(draggedIndex, 1);
    updated.splice(targetIndex, 0, moved);

    setBlocks(updated.map((b, idx) => ({ ...b, order: idx + 1 })));
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const moveBlock = (index: number, direction: "up" | "down") => {
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= blocks.length) return;

    const updated = [...blocks];
    const temp = updated[index];
    updated[index] = updated[target];
    updated[target] = temp;

    setBlocks(updated.map((b, idx) => ({ ...b, order: idx + 1 })));
  };

  const toggleEnabled = (id: string) => {
    setBlocks((curr) =>
      curr.map((b) => (b.id === id ? { ...b, enabled: !b.enabled } : b))
    );
  };

  const updateBlock = (id: string, updates: Partial<HomepageBlock>) => {
    setBlocks((curr) =>
      curr.map((b) => (b.id === id ? { ...b, ...updates } : b))
    );
  };

  const removeBlock = (id: string) => {
    setBlocks((curr) => curr.filter((b) => b.id !== id));
  };

  const loadThemeDefaults = () => {
    const defaults = THEME_DEFAULT_SETTINGS[themeSlug] || THEME_DEFAULT_SETTINGS["ledger-classic"];
    if (confirm(`Reset homepage blocks to signature defaults for "${themeName}"?`)) {
      setLayout(defaults.layout);
      setBlocks(defaults.blocks);
      setNotice(`Loaded signature layout for ${themeName}`);
      setTimeout(() => setNotice(null), 3000);
    }
  };

  const addBlock = (type: HomepageBlockType) => {
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

    const titles: Record<HomepageBlockType, string> = {
      magazine_bento: "Top Stories Mega-Bento Grid",
      broadsheet_3col: "Broadsheet Front Page (3 Columns)",
      hero_slider: "Lead Story Carousel with Filmstrip",
      big_lead_side_list: "Lead Spotlight & Side Thumbnails",
      news_list: "Newsroom Feed (Landscape Photos)",
      visual_grid: "Visual Photo Magazine Tiles",
      category_grid: "Category Story Highlights",
      tabbed_block: "Topic Tab Switcher",
      trending: "Trending Stories Bar",
      opinion: "Editorial Opinion & Columnists",
      newsletter: "Morning Briefing Strip",
      multimedia: "Podcast & Broadcast Hub",
      hero: "Classic Spotlight",
    };

    const newBlock: HomepageBlock = {
      id: `block-${Date.now()}`,
      type,
      title: titles[type] || "Editorial Section",
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
      order: blocks.length + 1,
    };

    setBlocks((curr) => [...curr, newBlock]);
    setExpandedId(newBlock.id);
  };

  const handleSave = () => {
    startTransition(async () => {
      const res = await saveHomepageSettingsAction(themeSlug, {
        layout,
        blocks,
      });
      if (res.error) {
        alert(res.error);
      } else {
        setNotice(`Homepage settings for ${themeName} saved successfully!`);
        setTimeout(() => setNotice(null), 3000);
        router.refresh();
      }
    });
  };

  const BLOCK_TYPE_INFO: Record<
    HomepageBlockType,
    { name: string; desc: string; defaultStyle: BlockDisplayStyle }
  > = {
    magazine_bento: {
      name: "Mega Bento Grid (1+4)",
      desc: "1 giant hero story + 4 photo cards (2x2 grid)",
      defaultStyle: "bento",
    },
    broadsheet_3col: {
      name: "Broadsheet 3-Column Wire",
      desc: "Column 1 briefs + Column 2 feature + Column 3 live wire",
      defaultStyle: "broadsheet_wire",
    },
    hero_slider: {
      name: "Hero Carousel + Filmstrip",
      desc: "Hero picture slider with live preview filmstrip",
      defaultStyle: "hero_slider",
    },
    big_lead_side_list: {
      name: "Big Lead + Side Thumbnails",
      desc: "1 big photo lead story + 3-4 side-thumbnail stories",
      defaultStyle: "lead_side_list",
    },
    news_list: {
      name: "News List View",
      desc: "Editorial broadsheet list with landscape photo on left",
      defaultStyle: "list_thumb_left",
    },
    visual_grid: {
      name: "Visual Photo Tiles",
      desc: "3-column immersive cards with photo gradients & typography",
      defaultStyle: "overlay_cards",
    },
    category_grid: {
      name: "Category Cards",
      desc: "Multi-column news cards filtered by editorial topic",
      defaultStyle: "grid_3",
    },
    tabbed_block: {
      name: "Topic Tab Switcher",
      desc: "Interactive category tabs with post counts",
      defaultStyle: "grid_3",
    },
    trending: {
      name: "Trending 01-05 Leaderboard",
      desc: "Ranked 01-05 top stories with bold theme numbers",
      defaultStyle: "grid_3",
    },
    opinion: {
      name: "Opinion & Voices",
      desc: "Columnist portraits, credentials, and styled pull-quotes",
      defaultStyle: "grid_3",
    },
    multimedia: {
      name: "Broadcast & Podcast Hub",
      desc: "Audio player with equalizer waves & playlist",
      defaultStyle: "grid_3",
    },
    newsletter: {
      name: "Executive Briefing Box",
      desc: "High-conversion subscriber callout strip",
      defaultStyle: "grid_3",
    },
    hero: {
      name: "Classic Spotlight",
      desc: "Classic lead article spotlight",
      defaultStyle: "lead_side_list",
    },
  };

  const DISPLAY_STYLE_OPTIONS: {
    id: BlockDisplayStyle;
    label: string;
    renderIcon: (active: boolean) => React.ReactNode;
  }[] = [
    {
      id: "bento",
      label: "Bento (1+4)",
      renderIcon: (active) => <BentoWireframe active={active} className="w-8 h-5" />,
    },
    {
      id: "lead_side_list",
      label: "Lead Left + List",
      renderIcon: (active) => <LeadSideListWireframe active={active} className="w-8 h-5" />,
    },
    {
      id: "lead_right_side_list",
      label: "List + Lead Right",
      renderIcon: (active) => <LeadRightSideListWireframe active={active} className="w-8 h-5" />,
    },
    {
      id: "grid_3",
      label: "3 Columns",
      renderIcon: (active) => <Grid3Wireframe active={active} className="w-8 h-5" />,
    },
    {
      id: "grid_4",
      label: "4 Columns",
      renderIcon: (active) => <Grid4Wireframe active={active} className="w-8 h-5" />,
    },
    {
      id: "list_thumb_left",
      label: "Thumb Left",
      renderIcon: (active) => <ListThumbLeftWireframe active={active} className="w-8 h-5" />,
    },
    {
      id: "list_thumb_right",
      label: "Thumb Right",
      renderIcon: (active) => <ListThumbRightWireframe active={active} className="w-8 h-5" />,
    },
    {
      id: "broadsheet_wire",
      label: "3-Col Broadsheet",
      renderIcon: (active) => <Broadsheet3ColWireframe active={active} className="w-8 h-5" />,
    },
    {
      id: "hero_slider",
      label: "Slider Carousel",
      renderIcon: (active) => <HeroSliderWireframe active={active} className="w-8 h-5" />,
    },
    {
      id: "overlay_cards",
      label: "Overlay Cards",
      renderIcon: (active) => <OverlayCardsWireframe active={active} className="w-8 h-5" />,
    },
    {
      id: "minimal_text",
      label: "Text Only Wire",
      renderIcon: (active) => <MinimalTextWireframe active={active} className="w-8 h-5" />,
    },
  ];

  const LAYOUT_OPTIONS: {
    id: HomepageLayout;
    name: string;
    description: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: "full_width",
      name: "Full Width",
      description: "Immersive single-column magazine flow without sidebars",
      icon: <LayoutTemplate className="size-6 text-slate-700" />,
    },
    {
      id: "right_sidebar",
      name: "Right Sidebar",
      description: "Editorial stories with main widget sidebar on the right",
      icon: <SidebarClose className="size-6 text-slate-700" />,
    },
    {
      id: "left_sidebar",
      name: "Left Sidebar",
      description: "Main widget sidebar on the left with editorial stories",
      icon: <SidebarOpen className="size-6 text-slate-700" />,
    },
    {
      id: "dual_sidebar",
      name: "Dual Sidebars (3 Columns)",
      description: "Left Sidebar + Center Editorial Stream + Right Sidebar",
      icon: <Columns3 className="size-6 text-indigo-700" />,
    },
  ];

  return (
    <div className="space-y-6 text-[13px]">
      {/* Top Header Bar with Theme Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#c3c4c7] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[23px] font-normal leading-[1.3] text-[#1d2327]">
              Theme Settings: Homepage Layout
            </h1>
            <span className="rounded bg-slate-100 text-slate-700 text-xs px-2.5 py-0.5 font-bold">
              {themeName}
            </span>
          </div>
          <p className="text-[12px] text-[#646970] mt-0.5">
            Configure the sidebar architecture, news display formats, and drag-and-drop magazine blocks for <strong className="text-[#1d2327]">{themeName}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Theme Selector Dropdown */}
          <div className="flex items-center gap-1.5 bg-white border border-[#8c8f94] rounded px-2.5 py-1">
            <span className="text-[11px] font-medium text-slate-500">Theme:</span>
            <select
              value={themeSlug}
              onChange={(e) => {
                router.push(`/admincp/theme-settings?theme=${e.target.value}`);
              }}
              className="bg-transparent text-xs font-semibold text-[#1d2327] focus:outline-none cursor-pointer"
            >
              {allThemes.map((t) => (
                <option key={t.slug} value={t.slug}>
                  {t.name} {t.isActive ? "(Active)" : ""}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={loadThemeDefaults}
            title="Reset blocks to theme's signature default layout"
            className="rounded-[3px] border border-[#dcdcde] bg-white px-3 py-1.5 text-xs font-medium text-[#2c3338] hover:bg-slate-50 transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="size-3.5 text-slate-500" /> Reset to Defaults
          </button>

          <button
            type="button"
            disabled={isPending}
            onClick={handleSave}
            className="rounded-[3px] border border-[#2271b1] bg-[#2271b1] px-4 py-1.5 font-medium text-white hover:bg-[#135e96] transition-colors disabled:opacity-50 shadow-sm"
          >
            {isPending ? "Saving..." : "Save Layout"}
          </button>
        </div>
      </div>

      {notice && (
        <div className="flex items-center justify-between border-l-4 border-[#00a32a] bg-[#f0f6fc] p-3 text-[13px] text-[#1d2327]">
          <span>✓ {notice}</span>
          <button type="button" onClick={() => setNotice(null)} className="text-lg leading-none text-slate-400">
            ×
          </button>
        </div>
      )}

      {/* SECTION 1: HOMEPAGE SIDEBAR ARCHITECTURE SELECTOR */}
      <div className="rounded-[3px] border border-[#c3c4c7] bg-white p-5 shadow-[0_1px_1px_rgba(0,0,0,0.04)] space-y-3">
        <div className="flex items-center justify-between border-b border-[#f0f0f1] pb-2">
          <div>
            <h2 className="text-sm font-semibold text-[#1d2327]">1. Homepage Sidebar Layout Architecture</h2>
            <p className="text-[12px] text-[#646970]">
              Choose whether your homepage features full-width magazine sections, 1 sidebar, or a 3-column broadsheet.
            </p>
          </div>
          <span className="rounded bg-blue-100 text-blue-800 text-[11px] font-bold px-2 py-0.5 uppercase">
            Active: {LAYOUT_OPTIONS.find((l) => l.id === layout)?.name}
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
                className={`flex flex-col items-start p-3.5 rounded-lg border text-left transition-all ${
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

      {/* SECTION 2: EDITORIAL BLOCKS BUILDER */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[330px_1fr] items-start">
        {/* Left Available Blocks Tray */}
        <div className="rounded-[3px] border border-[#c3c4c7] bg-white p-4 shadow-[0_1px_1px_rgba(0,0,0,0.04)] space-y-3">
          <div className="border-b border-[#f0f0f1] pb-2">
            <h3 className="font-semibold text-[#1d2327] text-sm">2. Add Magazine Editorial Blocks</h3>
            <p className="text-[12px] text-[#646970]">
              Click any block wireframe below to append it to your front page story flow:
            </p>
          </div>

          <div className="space-y-2 pt-1 max-h-[620px] overflow-y-auto pr-1">
            {(
              [
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
              ] as HomepageBlockType[]
            ).map((type) => {
              const info = BLOCK_TYPE_INFO[type];
              if (!info) return null;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => addBlock(type)}
                  className="flex w-full items-start gap-3 rounded border border-[#dcdcde] bg-white p-2.5 text-left hover:border-[#2271b1] hover:bg-[#f0f6fc] transition-colors group"
                >
                  <div className="flex-shrink-0 pt-0.5">
                    <BlockWireframeIcon type={type} className="w-10 h-7" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-[#1d2327] group-hover:text-[#2271b1] block text-[12px]">
                      + {info.name}
                    </span>
                    <span className="text-[11px] text-[#646970] leading-tight block mt-0.5">
                      {info.desc}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Active Blocks Stack */}
        <div className="rounded-[3px] border border-[#c3c4c7] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.04)]">
          <div className="border-b border-[#c3c4c7] bg-[#f6f7f7] px-4 py-3 flex items-center justify-between">
            <div>
              <span className="font-semibold text-[#1d2327]">
                Active Story Flow for {themeName}
              </span>
              <span className="text-[12px] text-[#646970] ml-2 font-normal">
                (Click block to customize display layout, category, and metadata)
              </span>
            </div>
            <span className="text-[12px] text-[#646970] font-medium">{blocks.length} sections</span>
          </div>

          <div className="p-4 space-y-3">
            {blocks.length ? (
              blocks.map((block, index) => {
                const isExpanded = expandedId === block.id;
                const isDragging = draggedIndex === index;
                const isDragOver = dragOverIndex === index && draggedIndex !== index;
                const info = BLOCK_TYPE_INFO[block.type] || {
                  name: block.type,
                  desc: "",
                  defaultStyle: "grid_3",
                };
                const currentDisplayStyle = block.displayStyle || info.defaultStyle;

                return (
                  <div
                    key={block.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`rounded-[3px] border transition-all ${
                      !block.enabled
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
                          title="Drag to reorder section"
                        >
                          <GripVertical className="size-4" />
                        </div>

                        <div className="flex flex-col">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => moveBlock(index, "up")}
                            className="text-[#646970] hover:text-[#2271b1] disabled:opacity-20"
                          >
                            <ArrowUp className="size-3" />
                          </button>
                          <button
                            type="button"
                            disabled={index === blocks.length - 1}
                            onClick={() => moveBlock(index, "down")}
                            className="text-[#646970] hover:text-[#2271b1] disabled:opacity-20"
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
                          <strong className="text-[#1d2327] text-[13px]">{block.title}</strong>
                          <span className="text-[11px] text-[#646970] ml-2">
                            ({info.name}
                            {block.categorySlug && block.categorySlug !== "all"
                              ? ` • ${block.categorySlug}`
                              : ""}
                            )
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => toggleEnabled(block.id)}
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase transition-colors ${
                            block.enabled
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                          }`}
                        >
                          {block.enabled ? "Active" : "Hidden"}
                        </button>

                        <button
                          type="button"
                          onClick={() => setExpandedId(isExpanded ? null : block.id)}
                          className="p-1 text-[#646970] hover:text-[#2271b1]"
                        >
                          {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Block Settings Drawer */}
                    {isExpanded && (
                      <div className="border-t border-[#dcdcde] bg-[#f9fafb] p-4 space-y-4">
                        {/* 1. Basic Fields */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[12px] font-medium text-[#50575e] mb-1">
                              Section Display Title
                            </label>
                            <input
                              type="text"
                              value={block.title}
                              onChange={(e) => updateBlock(block.id, { title: e.target.value })}
                              className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none focus:ring-1 focus:ring-[#2271b1]"
                            />
                          </div>

                          {(block.type === "category_grid" ||
                            block.type === "magazine_bento" ||
                            block.type === "broadsheet_3col" ||
                            block.type === "hero_slider" ||
                            block.type === "big_lead_side_list" ||
                            block.type === "visual_grid" ||
                            block.type === "news_list" ||
                            block.type === "opinion" ||
                            block.type === "hero") && (
                            <div>
                              <label className="block text-[12px] font-medium text-[#50575e] mb-1">
                                Filter by Category
                              </label>
                              <select
                                value={block.categorySlug || "all"}
                                onChange={(e) =>
                                  updateBlock(block.id, { categorySlug: e.target.value })
                                }
                                className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none focus:ring-1 focus:ring-[#2271b1]"
                              >
                                <option value="all">All Categories</option>
                                {categories.map((c) => (
                                  <option key={c.slug} value={c.slug}>
                                    {c.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>

                        {/* 2. NEWS DISPLAY LAYOUT SELECTOR (Module Style) */}
                        {block.type !== "multimedia" && block.type !== "newsletter" && (
                          <div className="border-t border-[#e5e7eb] pt-3">
                            <label className="block text-[12px] font-semibold text-[#1d2327] mb-1.5">
                              How to Display News (Layout Presentation Style):
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                              {DISPLAY_STYLE_OPTIONS.map((opt) => {
                                const isSelected = currentDisplayStyle === opt.id;
                                return (
                                  <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => updateBlock(block.id, { displayStyle: opt.id })}
                                    className={`flex flex-col items-center p-2 rounded border text-center transition-all ${
                                      isSelected
                                        ? "border-[#2271b1] bg-white ring-2 ring-[#2271b1] shadow-sm"
                                        : "border-[#dcdcde] bg-white hover:border-[#8c8f94] hover:bg-slate-50"
                                    }`}
                                  >
                                    <div className="mb-1.5">{opt.renderIcon(isSelected)}</div>
                                    <span
                                      className={`text-[11px] leading-tight ${
                                        isSelected ? "font-bold text-[#2271b1]" : "text-[#50575e]"
                                      }`}
                                    >
                                      {opt.label}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* 3. Number of Stories & Content Toggles */}
                        <div className="border-t border-[#e5e7eb] pt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                          {(block.type === "category_grid" ||
                            block.type === "magazine_bento" ||
                            block.type === "broadsheet_3col" ||
                            block.type === "hero_slider" ||
                            block.type === "big_lead_side_list" ||
                            block.type === "visual_grid" ||
                            block.type === "news_list" ||
                            block.type === "trending" ||
                            block.type === "hero") && (
                            <div>
                              <label className="block text-[12px] font-medium text-[#50575e] mb-1.5">
                                Number of Stories to Show
                              </label>
                              <div className="flex gap-1.5">
                                {[3, 4, 5, 6, 8].map((num) => (
                                  <button
                                    key={num}
                                    type="button"
                                    onClick={() => updateBlock(block.id, { postCount: num })}
                                    className={`rounded border px-2.5 py-1 text-xs font-semibold ${
                                      (block.postCount || 4) === num
                                        ? "border-[#2271b1] bg-[#2271b1] text-white"
                                        : "border-[#dcdcde] bg-white text-[#2c3338] hover:bg-slate-50"
                                    }`}
                                  >
                                    {num} posts
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          <div>
                            <label className="block text-[12px] font-medium text-[#50575e] mb-1.5">
                              Article Metadata Display Options
                            </label>
                            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-[#2c3338]">
                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={block.showExcerpt !== false}
                                  onChange={(e) =>
                                    updateBlock(block.id, { showExcerpt: e.target.checked })
                                  }
                                  className="rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
                                />
                                <span>Show Excerpt</span>
                              </label>

                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={block.showAuthor !== false}
                                  onChange={(e) =>
                                    updateBlock(block.id, { showAuthor: e.target.checked })
                                  }
                                  className="rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
                                />
                                <span>Show Author</span>
                              </label>

                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={block.showDate !== false}
                                  onChange={(e) =>
                                    updateBlock(block.id, { showDate: e.target.checked })
                                  }
                                  className="rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
                                />
                                <span>Show Date</span>
                              </label>

                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={block.showCategory !== false}
                                  onChange={(e) =>
                                    updateBlock(block.id, { showCategory: e.target.checked })
                                  }
                                  className="rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
                                />
                                <span>Show Category Badge</span>
                              </label>
                            </div>
                          </div>
                        </div>

                        {/* Actions Bottom Bar */}
                        <div className="flex items-center justify-between pt-2 border-t border-[#e5e7eb]">
                          <button
                            type="button"
                            onClick={() => removeBlock(block.id)}
                            className="text-[12px] text-[#b32d2e] hover:underline flex items-center gap-1"
                          >
                            <Trash2 className="size-3" /> Remove this section
                          </button>
                          <button
                            type="button"
                            onClick={() => setExpandedId(null)}
                            className="text-[12px] text-[#2271b1] hover:underline font-semibold"
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-[#646970] border border-dashed border-[#c3c4c7] rounded">
                No blocks active for this theme. Click any block on the left or click "Reset to Defaults".
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
              {isPending ? "Saving..." : "Save Layout"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
