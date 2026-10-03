"use client";

import React from "react";
import { Trash2 } from "lucide-react";
import { BlockDisplayStyle, HomepageBlock } from "@/lib/themes/homepage-types";
import {
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

interface EditorialBlockDrawerProps {
  block: HomepageBlock;
  categories: { id: string; name: string; slug: string }[];
  dict?: Record<string, string>;
  direction?: "rtl" | "ltr";
  onUpdate: (updates: Partial<HomepageBlock>) => void;
  onRemove: () => void;
  onClose: () => void;
}

export function EditorialBlockDrawer({
  block,
  categories,
  dict,
  direction = "ltr",
  onUpdate,
  onRemove,
  onClose,
}: EditorialBlockDrawerProps) {
  const isRtl = direction === "rtl";

  const t = (key: string, enFallback: string, arFallback: string) => {
    if (isRtl) return dict?.[key] || arFallback;
    return dict?.[key] || enFallback;
  };

  const getStyleLabel = (styleId: BlockDisplayStyle, enFallback: string, arFallback: string) => {
    return dict?.[`admin.theme_settings.style.${styleId}`] || (isRtl ? arFallback : enFallback);
  };

  const DISPLAY_STYLE_OPTIONS: {
    id: BlockDisplayStyle;
    label: string;
    renderIcon: (active: boolean) => React.ReactNode;
  }[] = [
      {
        id: "bento",
        label: getStyleLabel("bento", "Bento (1+4)", "بينتو (1+4)"),
        renderIcon: (active) => <BentoWireframe active={active} className="w-8 h-5" />,
      },
      {
        id: "lead_side_list",
        label: getStyleLabel("lead_side_list", "Lead Left + List", "رئيسية على اليمين + قائمة"),
        renderIcon: (active) => <LeadSideListWireframe active={active} className="w-8 h-5" />,
      },
      {
        id: "lead_right_side_list",
        label: getStyleLabel("lead_right_side_list", "List + Lead Right", "قائمة + رئيسية على اليسار"),
        renderIcon: (active) => <LeadRightSideListWireframe active={active} className="w-8 h-5" />,
      },
      {
        id: "grid_3",
        label: getStyleLabel("grid_3", "3 Columns", "3 أعمدة"),
        renderIcon: (active) => <Grid3Wireframe active={active} className="w-8 h-5" />,
      },
      {
        id: "grid_4",
        label: getStyleLabel("grid_4", "4 Columns", "4 أعمدة"),
        renderIcon: (active) => <Grid4Wireframe active={active} className="w-8 h-5" />,
      },
      {
        id: "list_thumb_left",
        label: getStyleLabel("list_thumb_left", "Thumb Left", "مصغر بالبداية"),
        renderIcon: (active) => <ListThumbLeftWireframe active={active} className="w-8 h-5" />,
      },
      {
        id: "list_thumb_right",
        label: getStyleLabel("list_thumb_right", "Thumb Right", "مصغر بالنهاية"),
        renderIcon: (active) => <ListThumbRightWireframe active={active} className="w-8 h-5" />,
      },
      {
        id: "broadsheet_wire",
        label: getStyleLabel("broadsheet_wire", "3-Col Broadsheet", "صحيفة 3 أعمدة"),
        renderIcon: (active) => <Broadsheet3ColWireframe active={active} className="w-8 h-5" />,
      },
      {
        id: "hero_slider",
        label: getStyleLabel("hero_slider", "Slider Carousel", "عرض متحرك (سلايدر)"),
        renderIcon: (active) => <HeroSliderWireframe active={active} className="w-8 h-5" />,
      },
      {
        id: "overlay_cards",
        label: getStyleLabel("overlay_cards", "Overlay Cards", "بطاقات متراكبة"),
        renderIcon: (active) => <OverlayCardsWireframe active={active} className="w-8 h-5" />,
      },
      {
        id: "minimal_text",
        label: getStyleLabel("minimal_text", "Text Only Wire", "مخطط نصي فقط"),
        renderIcon: (active) => <MinimalTextWireframe active={active} className="w-8 h-5" />,
      },
    ];

  const currentDisplayStyle = block.displayStyle || "grid_3";

    const blockName = dict?.[`admin.theme_settings.block.${block.type}.name`] || block.type;
    const isDefaultOrOppositeLang =
      !block.title ||
      block.title === block.type ||
      block.title === blockName ||
      (!isRtl && /[\u0600-\u06FF]/.test(block.title)) ||
      (isRtl && /^[A-Za-z0-9\s•\-+()]+$/.test(block.title));

    return (
      <div className="border-t border-[#dcdcde] bg-[#f9fafb] p-4 space-y-4 text-start">
        {/* 1. Basic Fields: Section Display Title & Category Filter */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[12px] font-medium text-[#50575e] mb-1">
              {t("admin.theme_settings.display_title", "Section Display Title", "عنوان عرض القسم")}
            </label>
            <input
              type="text"
              value={isDefaultOrOppositeLang ? "" : (block.title || "")}
              placeholder={blockName}
              onChange={(e) => onUpdate({ title: e.target.value })}
              className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none focus:ring-1 focus:ring-[#2271b1]"
            />
          </div>

          <div>
            <label className="block text-[12px] font-medium text-[#50575e] mb-1">
              {t("admin.theme_settings.subtitle", "Subtitle / Eyebrow (Optional)", "العنوان الفرعي للقسم (اختياري)")}
            </label>
            <input
              type="text"
              value={block.subtitle || ""}
              placeholder={t("admin.theme_settings.subtitle_placeholder", "e.g. Special Focus", "مثال: تركيز خاص")}
              onChange={(e) => onUpdate({ subtitle: e.target.value })}
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
                {t("admin.theme_settings.filter_category", "Filter by Category", "تصفية حسب التصنيف")}
              </label>
              <select
                value={block.categorySlug || "all"}
                onChange={(e) => onUpdate({ categorySlug: e.target.value })}
                className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none focus:ring-1 focus:ring-[#2271b1]"
              >
                <option value="all">
                  {t("admin.theme_settings.all_categories", "All Categories", "جميع التصنيفات")}
                </option>
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-[12px] font-medium text-[#50575e] mb-1">
              {t("admin.theme_settings.link_text", "Header Link Label (Optional)", "نص الرابط الجانبي (اختياري)")}
            </label>
            <input
              type="text"
              value={block.linkText || ""}
              placeholder={t("admin.theme_settings.link_text_placeholder", "e.g. Explore All", "مثال: استكشف المزيد")}
              onChange={(e) => onUpdate({ linkText: e.target.value })}
              className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none focus:ring-1 focus:ring-[#2271b1]"
            />
          </div>
      </div>

      {/* Broadsheet Column Titles */}
      {(block.type === "broadsheet_3col" || block.displayStyle === "broadsheet_wire") && (
        <div className="border-t border-[#e5e7eb] pt-3">
          <label className="block text-[12px] font-semibold text-[#1d2327] mb-2">
            {t("admin.theme_settings.col_headers", "Column Headers (Optional - Leave blank to hide):", "عناوين الأعمدة (اختياري - اتركها فارغة للإخفاء):")}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="block text-[11px] text-[#6b7280] mb-0.5">
                {t("admin.theme_settings.col1", "Column 1 Header", "عنوان العمود 1")}
              </label>
              <input
                type="text"
                value={block.col1Title || ""}
                placeholder="e.g. Regional"
                onChange={(e) => onUpdate({ col1Title: e.target.value })}
                className="h-[28px] w-full rounded border border-[#8c8f94] bg-white px-2 text-xs text-[#2c3338]"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#6b7280] mb-0.5">
                {t("admin.theme_settings.col2", "Column 2 Header", "عنوان العمود 2")}
              </label>
              <input
                type="text"
                value={block.col2Title || ""}
                placeholder="e.g. Lead Feature"
                onChange={(e) => onUpdate({ col2Title: e.target.value })}
                className="h-[28px] w-full rounded border border-[#8c8f94] bg-white px-2 text-xs text-[#2c3338]"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#6b7280] mb-0.5">
                {t("admin.theme_settings.col3", "Column 3 Header", "عنوان العمود 3")}
              </label>
              <input
                type="text"
                value={block.col3Title || ""}
                placeholder="e.g. News Wire"
                onChange={(e) => onUpdate({ col3Title: e.target.value })}
                className="h-[28px] w-full rounded border border-[#8c8f94] bg-white px-2 text-xs text-[#2c3338]"
              />
            </div>
          </div>
        </div>
      )}

      {/* 2. NEWS DISPLAY LAYOUT SELECTOR (Module Style Wireframe Grid) */}
      {block.type !== "multimedia" && block.type !== "newsletter" && (
        <div className="border-t border-[#e5e7eb] pt-3">
          <label className="block text-[12px] font-semibold text-[#1d2327] mb-1.5">
            {t(
              "admin.theme_settings.presentation_style",
              "How to Display News (Layout Presentation Style):",
              "طريقة عرض الأخبار (نمط العرض التخطيطي):"
            )}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {DISPLAY_STYLE_OPTIONS.map((opt) => {
              const isSelected = currentDisplayStyle === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onUpdate({ displayStyle: opt.id })}
                  className={`flex flex-col items-center p-2 rounded border text-center transition-all ${isSelected
                      ? "border-[#2271b1] bg-white ring-2 ring-[#2271b1] shadow-sm"
                      : "border-[#dcdcde] bg-white hover:border-[#8c8f94] hover:bg-slate-50"
                    }`}
                >
                  <div className="mb-1.5">{opt.renderIcon(isSelected)}</div>
                  <span
                    className={`text-[11px] leading-tight ${isSelected ? "font-bold text-[#2271b1]" : "text-[#50575e]"
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
                {t("admin.theme_settings.number_of_stories", "Number of Stories to Show", "عدد المقالات المعروضة")}
              </label>
              <div className="flex gap-1.5">
                {[3, 4, 5, 6, 8].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => onUpdate({ postCount: num })}
                    className={`rounded border px-2.5 py-1 text-xs font-semibold ${(block.postCount || 4) === num
                        ? "border-[#2271b1] bg-[#2271b1] text-white"
                        : "border-[#dcdcde] bg-white text-[#2c3338] hover:bg-slate-50"
                      }`}
                  >
                    {num} {t("admin.theme_settings.posts", "posts", "مقالات")}
                  </button>
                ))}
              </div>
            </div>
          )}

        <div>
          <label className="block text-[12px] font-medium text-[#50575e] mb-1.5">
            {t("admin.theme_settings.metadata_options", "Article Metadata Display Options", "خيارات عرض البيانات الوصفية للمقال")}
          </label>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-[#2c3338]">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={block.showExcerpt !== false}
                onChange={(e) => onUpdate({ showExcerpt: e.target.checked })}
                className="rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
              />
              <span>{t("admin.theme_settings.show_excerpt", "Show Excerpt", "عرض المقتطف")}</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={block.showAuthor !== false}
                onChange={(e) => onUpdate({ showAuthor: e.target.checked })}
                className="rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
              />
              <span>{t("admin.theme_settings.show_author", "Show Author", "عرض الكاتب")}</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={block.showDate !== false}
                onChange={(e) => onUpdate({ showDate: e.target.checked })}
                className="rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
              />
              <span>{t("admin.theme_settings.show_date", "Show Date", "عرض التاريخ")}</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={block.showCategory !== false}
                onChange={(e) => onUpdate({ showCategory: e.target.checked })}
                className="rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
              />
              <span>{t("admin.theme_settings.show_category", "Show Category Badge", "عرض شارة التصنيف")}</span>
            </label>
          </div>
        </div>
      </div>

      {/* Actions Bottom Bar */}
      <div className="flex items-center justify-between pt-2 border-t border-[#e5e7eb]">
        <button
          type="button"
          onClick={onRemove}
          className="text-[12px] text-[#b32d2e] hover:underline flex items-center gap-1 font-medium"
        >
          <Trash2 className="size-3" />{" "}
          {t("admin.theme_settings.remove_section", "Remove this section", "إزالة هذا القسم")}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="text-[12px] text-[#2271b1] hover:underline font-semibold"
        >
          {t("admin.theme_settings.done", "Done", "تم")}
        </button>
      </div>
    </div>
  );
}
