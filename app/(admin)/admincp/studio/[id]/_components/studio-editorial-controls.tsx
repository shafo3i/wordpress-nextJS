import { useState } from "react"
import {
  getStudioCategoryOptions,
  resolveStudioCategorySelection,
} from "@/lib/studio/content"

import type {
  BlockDisplayStyle,
  HomepageBlock,
} from "@/lib/themes/homepage-types"

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
  FeaturedSliderWireframe,
  HeadlineCoverWireframe,
  BreakingBarWireframe,
  DualColumnsWireframe,
  SplitCoverWireframe,
  CardsCarouselWireframe,
  TrendingWireframe,
  OverlayCardsWireframe,
  MinimalTextWireframe,
} from "@/app/(admin)/admincp/theme-settings/_components/block-wireframes"

import type { StudioInspectorProps } from "./studio-panel-types"
export function StudioEditorialControls({
  selectedElement,
  onUpdateSettings,
  categories,
  dict,
  contentLocale,
  pageLocale,
  languages = [],
}: StudioInspectorProps) {
  const defaultLang = pageLocale || contentLocale || languages[0]?.code || ""
  const [activeLang, setActiveLang] = useState(contentLocale || defaultLang)
  const s = selectedElement.settings
  const blockConfig = s.blockConfig
  const feedLocale = blockConfig?.contentLocale || contentLocale || defaultLang
  const selectedCategory = blockConfig
    ? resolveStudioCategorySelection(categories, blockConfig, feedLocale)
    : undefined
  const localizedCategories = getStudioCategoryOptions(categories, feedLocale)
  const categoryOptions =
    selectedCategory &&
    !localizedCategories.some((category) => category.id === selectedCategory.id)
      ? [...localizedCategories, selectedCategory]
      : localizedCategories
  const hasCategorySelection = Boolean(
    blockConfig?.categoryId ||
    (blockConfig?.categorySlug && blockConfig.categorySlug !== "all")
  )
  const t = (key: string) => dict?.[key] || ""
  const getStyleName = (type: string) =>
    dict?.[`admin.theme_settings.style.${type}`] || type

  const updateBlockField = (patch: Partial<HomepageBlock>) => {
    if (blockConfig)
      onUpdateSettings(selectedElement.id, {
        blockConfig: { ...blockConfig, ...patch },
      })
  }

  return (
    <>
      {" "}
      {selectedElement.widgetType.startsWith("block_") && blockConfig && (
        <div className="space-y-3.5">
          {/* Language Switcher for Translatable Titles & Subtitles */}
          {languages.length > 0 && (
            <div className="space-y-1.5 border-b border-slate-200 pb-2.5">
              <span className="block font-semibold text-slate-700">
                {t("admin.theme_settings.edit_language")}
              </span>
              <div className="flex flex-wrap items-center gap-1 rounded border border-slate-300 bg-slate-100 p-1 text-[10px] font-bold">
                {languages.map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => setActiveLang(l.code)}
                    className={`flex-1 rounded px-2 py-1 transition-colors ${
                      activeLang === l.code
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {l.nativeName || l.name} ({l.code.toUpperCase()})
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Display Title + Show Title Toggle */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block font-semibold text-slate-700">
                {t("admin.theme_settings.display_title")}
              </label>
              <label className="flex cursor-pointer items-center gap-1 text-[11px] text-slate-600">
                <input
                  type="checkbox"
                  checked={blockConfig.showTitle !== false}
                  onChange={(e) =>
                    updateBlockField({ showTitle: e.target.checked })
                  }
                  className="rounded border-slate-300 text-blue-600"
                />
                <span>{t("admin.theme_settings.show_title")}</span>
              </label>
            </div>
            <input
              type="text"
              disabled={blockConfig.showTitle === false}
              value={
                blockConfig.titles &&
                blockConfig.titles[activeLang] !== undefined
                  ? blockConfig.titles[activeLang]
                  : activeLang === defaultLang
                    ? blockConfig.title || ""
                    : ""
              }
              placeholder={`${
                dict?.[`admin.theme_settings.block.${blockConfig.type}.name`] ||
                blockConfig.type
              } (${activeLang.toUpperCase()})`}
              onChange={(e) => {
                const val = e.target.value
                const updatedTitles = {
                  ...(blockConfig.titles || {}),
                  [activeLang]: val,
                }
                updateBlockField({
                  titles: updatedTitles,
                  title:
                    activeLang === defaultLang ? val : blockConfig.title || "",
                })
              }}
              className={`w-full rounded border border-slate-300 px-2.5 py-1.5 ${
                blockConfig.showTitle === false
                  ? "cursor-not-allowed bg-slate-50 opacity-50"
                  : ""
              }`}
            />
          </div>

          {/* Subtitle / Eyebrow (Per Language) */}
          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-700">
              {t("admin.theme_settings.block_subtitle")}
            </label>
            <input
              type="text"
              value={
                blockConfig.subtitles &&
                blockConfig.subtitles[activeLang] !== undefined
                  ? blockConfig.subtitles[activeLang]
                  : activeLang === defaultLang
                    ? blockConfig.subtitle || ""
                    : ""
              }
              placeholder={`${t("admin.theme_settings.subtitle_placeholder")} (${activeLang.toUpperCase()})`}
              onChange={(e) => {
                const val = e.target.value
                const updatedSubtitles = {
                  ...(blockConfig.subtitles || {}),
                  [activeLang]: val,
                }
                updateBlockField({
                  subtitles: updatedSubtitles,
                  subtitle:
                    activeLang === defaultLang
                      ? val
                      : blockConfig.subtitle || "",
                })
              }}
              className="w-full rounded border border-slate-300 px-2.5 py-1.5"
            />
          </div>

          {/* Filter by Category & Featured Posts Toggle */}
          <div className="space-y-2">
            <p className="text-xs text-slate-500">
              {t("admin.studio.content.translation_help")}
            </p>
            <div className="space-y-1.5">
              <label
                htmlFor={`studio-language-${selectedElement.id}`}
                className="block font-semibold text-slate-700"
              >
                {t("admin.studio.content.language")}
              </label>
              <select
                id={`studio-language-${selectedElement.id}`}
                value={blockConfig.contentLocale || ""}
                onChange={(event) =>
                  updateBlockField({
                    contentLocale: event.target.value || undefined,
                  })
                }
                className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5"
              >
                <option value="">
                  {t("admin.studio.content.inherit_language")} ({contentLocale})
                </option>
                {blockConfig.contentLocale &&
                  !languages.some(
                    (language) => language.code === blockConfig.contentLocale
                  ) && (
                    <option value={blockConfig.contentLocale} disabled>
                      {t("admin.studio.content.unavailable_language")} (
                      {blockConfig.contentLocale})
                    </option>
                  )}
                {languages.map((language) => (
                  <option key={language.code} value={language.code}>
                    {language.nativeName || language.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor={`studio-category-${selectedElement.id}`}
                className="block font-semibold text-slate-700"
              >
                {t("admin.theme_settings.filter_category")}
              </label>
              <select
                id={`studio-category-${selectedElement.id}`}
                value={
                  selectedCategory?.id ||
                  (hasCategorySelection ? "missing" : "all")
                }
                onChange={(event) => {
                  const category = categories.find(
                    (item) => item.id === event.target.value
                  )
                  updateBlockField({
                    categoryId: category?.id,
                    categorySlug: category?.slug || "all",
                  })
                }}
                className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5"
              >
                <option value="all">
                  {t("admin.theme_settings.all_categories")}
                </option>
                {hasCategorySelection && !selectedCategory && (
                  <option value="missing" disabled>
                    {t("admin.studio.content.category_missing")}
                  </option>
                )}
                {categoryOptions.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {selectedCategory?.locale &&
                selectedCategory.locale !== feedLocale && (
                  <p className="text-xs text-slate-500">
                    {t("admin.studio.content.category_translation_missing")}
                  </p>
                )}
            </div>
            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-700">
                {t("admin.studio.content.sort")}
              </label>
              <select
                value={blockConfig.sortOrder || "newest"}
                onChange={(event) =>
                  updateBlockField({
                    sortOrder: event.target.value as
                      "newest" | "oldest" | "popular",
                  })
                }
                className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5"
              >
                <option value="newest">
                  {t("admin.studio.content.newest")}
                </option>
                <option value="popular">
                  {t("admin.studio.content.popular")}
                </option>
                <option value="oldest">
                  {t("admin.studio.content.oldest")}
                </option>
              </select>
            </div>

            <label className="flex cursor-pointer items-center gap-2 rounded border border-amber-200 bg-amber-50/70 px-2.5 py-2 text-[11px] font-semibold text-amber-900">
              <input
                type="checkbox"
                checked={
                  blockConfig.featuredOnly ??
                  blockConfig.type === "featured_hero_slider"
                }
                onChange={(e) =>
                  updateBlockField({ featuredOnly: e.target.checked })
                }
                className="rounded border-amber-400 text-amber-600"
              />
              <span>★ {t("admin.theme_settings.featured_only")}</span>
            </label>
          </div>

          {/* Header Link Label */}
          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-700">
              {t("admin.theme_settings.link_text")}
            </label>
            <input
              type="text"
              value={blockConfig.linkText || ""}
              placeholder={t("admin.theme_settings.link_text_placeholder")}
              onChange={(e) => updateBlockField({ linkText: e.target.value })}
              className="w-full rounded border border-slate-300 px-2.5 py-1.5"
            />
          </div>

          {/* Broadsheet 3-Col Column Headers */}
          {(blockConfig.type === "broadsheet_3col" ||
            blockConfig.displayStyle === "broadsheet_wire") && (
            <div className="space-y-2 border-t border-slate-200 pt-2.5">
              <label className="block font-semibold text-slate-700">
                {t("admin.theme_settings.col_headers")}
              </label>
              <div className="space-y-2">
                <div className="space-y-1">
                  <span className="block text-[11px] text-slate-500">
                    {t("admin.theme_settings.col1")}
                  </span>
                  <input
                    type="text"
                    value={blockConfig.col1Title || ""}
                    placeholder={t("admin.theme_settings.col1")}
                    onChange={(e) =>
                      updateBlockField({ col1Title: e.target.value })
                    }
                    className="w-full rounded border border-slate-300 px-2.5 py-1.5"
                  />
                </div>
                <div className="space-y-1">
                  <span className="block text-[11px] text-slate-500">
                    {t("admin.theme_settings.col2")}
                  </span>
                  <input
                    type="text"
                    value={blockConfig.col2Title || ""}
                    placeholder={t("admin.theme_settings.col2")}
                    onChange={(e) =>
                      updateBlockField({ col2Title: e.target.value })
                    }
                    className="w-full rounded border border-slate-300 px-2.5 py-1.5"
                  />
                </div>
                <div className="space-y-1">
                  <span className="block text-[11px] text-slate-500">
                    {t("admin.theme_settings.col3")}
                  </span>
                  <input
                    type="text"
                    value={blockConfig.col3Title || ""}
                    placeholder={t("admin.theme_settings.col3")}
                    onChange={(e) =>
                      updateBlockField({ col3Title: e.target.value })
                    }
                    className="w-full rounded border border-slate-300 px-2.5 py-1.5"
                  />
                </div>
              </div>
            </div>
          )}

          {(blockConfig.type === "headline_slider" ||
            blockConfig.type === "breaking_ticker" ||
            blockConfig.displayStyle === "headline_cover" ||
            blockConfig.displayStyle === "breaking_bar") && (
            <div className="space-y-2 border-t border-slate-200 pt-2.5">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={blockConfig.autoplay !== false}
                  onChange={(event) =>
                    updateBlockField({ autoplay: event.target.checked })
                  }
                />
                {t("admin.studio.content.autoplay")}
              </label>
              <label className="block space-y-1">
                <span>{t("admin.studio.content.rotation_interval")}</span>
                <input
                  type="number"
                  min={2}
                  max={30}
                  step={0.5}
                  value={
                    (blockConfig.rotationInterval ??
                      (blockConfig.type === "breaking_ticker" ? 4500 : 5500)) /
                    1000
                  }
                  onChange={(event) => {
                    const seconds = Number(event.target.value)
                    if (
                      Number.isFinite(seconds) &&
                      seconds >= 2 &&
                      seconds <= 30
                    )
                      updateBlockField({
                        rotationInterval: Math.round(seconds * 1000),
                      })
                  }}
                  className="w-full rounded border border-slate-300 px-2.5 py-1.5"
                />
              </label>
            </div>
          )}

          {/* Visual Wireframe Layout Presentation Style Selector */}
          {blockConfig.type !== "multimedia" &&
            blockConfig.type !== "newsletter" && (
              <div className="space-y-2 border-t border-slate-200 pt-2.5">
                <label className="block font-semibold text-slate-700">
                  {dict?.["admin.theme_settings.presentation_style"]}
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(
                    [
                      {
                        id: "headline_cover",
                        renderIcon: (active: boolean) => (
                          <HeadlineCoverWireframe
                            active={active}
                            className="h-5 w-8"
                          />
                        ),
                      },
                      {
                        id: "featured_slider",
                        renderIcon: (active: boolean) => (
                          <FeaturedSliderWireframe
                            active={active}
                            className="h-5 w-8"
                          />
                        ),
                      },
                      {
                        id: "hero_slider",
                        renderIcon: (active: boolean) => (
                          <HeroSliderWireframe
                            active={active}
                            className="h-5 w-8"
                          />
                        ),
                      },
                      {
                        id: "bento",
                        renderIcon: (active: boolean) => (
                          <BentoWireframe active={active} className="h-5 w-8" />
                        ),
                      },
                      {
                        id: "split_cover",
                        renderIcon: (active: boolean) => (
                          <SplitCoverWireframe
                            active={active}
                            className="h-5 w-8"
                          />
                        ),
                      },
                      {
                        id: "cards_carousel",
                        renderIcon: (active: boolean) => (
                          <CardsCarouselWireframe
                            active={active}
                            className="h-5 w-8"
                          />
                        ),
                      },
                      {
                        id: "dual_columns",
                        renderIcon: (active: boolean) => (
                          <DualColumnsWireframe
                            active={active}
                            className="h-5 w-8"
                          />
                        ),
                      },
                      {
                        id: "numbered_strip",
                        renderIcon: (active: boolean) => (
                          <TrendingWireframe
                            active={active}
                            className="h-5 w-8"
                          />
                        ),
                      },
                      {
                        id: "breaking_bar",
                        renderIcon: (active: boolean) => (
                          <BreakingBarWireframe
                            active={active}
                            className="h-5 w-8"
                          />
                        ),
                      },
                      {
                        id: "lead_side_list",
                        renderIcon: (active: boolean) => (
                          <LeadSideListWireframe
                            active={active}
                            className="h-5 w-8"
                          />
                        ),
                      },
                      {
                        id: "lead_right_side_list",
                        renderIcon: (active: boolean) => (
                          <LeadRightSideListWireframe
                            active={active}
                            className="h-5 w-8"
                          />
                        ),
                      },
                      {
                        id: "grid_3",
                        renderIcon: (active: boolean) => (
                          <Grid3Wireframe active={active} className="h-5 w-8" />
                        ),
                      },
                      {
                        id: "grid_4",
                        renderIcon: (active: boolean) => (
                          <Grid4Wireframe active={active} className="h-5 w-8" />
                        ),
                      },
                      {
                        id: "compact_posts",
                        renderIcon: (active: boolean) => (
                          <ListThumbLeftWireframe
                            active={active}
                            className="h-5 w-8"
                          />
                        ),
                      },
                      {
                        id: "list_thumb_left",
                        renderIcon: (active: boolean) => (
                          <ListThumbLeftWireframe
                            active={active}
                            className="h-5 w-8"
                          />
                        ),
                      },
                      {
                        id: "list_thumb_right",
                        renderIcon: (active: boolean) => (
                          <ListThumbRightWireframe
                            active={active}
                            className="h-5 w-8"
                          />
                        ),
                      },
                      {
                        id: "broadsheet_wire",
                        renderIcon: (active: boolean) => (
                          <Broadsheet3ColWireframe
                            active={active}
                            className="h-5 w-8"
                          />
                        ),
                      },
                      {
                        id: "overlay_cards",
                        renderIcon: (active: boolean) => (
                          <OverlayCardsWireframe
                            active={active}
                            className="h-5 w-8"
                          />
                        ),
                      },
                      {
                        id: "minimal_text",
                        renderIcon: (active: boolean) => (
                          <MinimalTextWireframe
                            active={active}
                            className="h-5 w-8"
                          />
                        ),
                      },
                    ] as {
                      id: BlockDisplayStyle
                      renderIcon: (active: boolean) => React.ReactNode
                    }[]
                  ).map((opt) => {
                    const isSelected =
                      (blockConfig.displayStyle || "grid_3") === opt.id
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() =>
                          updateBlockField({ displayStyle: opt.id })
                        }
                        className={`flex flex-col items-center rounded border p-2 text-center transition-all ${
                          isSelected
                            ? "border-blue-600 bg-blue-50/40 ring-1 ring-blue-600"
                            : "border-slate-200 bg-white hover:border-slate-400"
                        }`}
                      >
                        <div className="mb-1">{opt.renderIcon(isSelected)}</div>
                        <span
                          className={`text-[10px] leading-tight ${
                            isSelected
                              ? "font-bold text-blue-600"
                              : "text-slate-600"
                          }`}
                        >
                          {getStyleName(opt.id)}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

          {/* Number of Stories */}
          <div className="space-y-1.5 border-t border-slate-200 pt-2.5">
            <label className="block font-semibold text-slate-700">
              {dict?.["admin.theme_settings.number_of_stories"]} (
              {blockConfig.postCount ?? 4})
            </label>
            <div className="mb-1.5 flex flex-wrap gap-1">
              {[3, 4, 5, 6, 8].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => updateBlockField({ postCount: num })}
                  className={`rounded border px-2 py-1 text-[11px] font-semibold ${
                    (blockConfig.postCount ?? 4) === num
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {num} {dict?.["admin.theme_settings.posts"]}
                </button>
              ))}
            </div>
            <input
              type="range"
              min={1}
              max={12}
              value={blockConfig.postCount ?? 4}
              onChange={(e) =>
                updateBlockField({ postCount: Number(e.target.value) })
              }
              className="w-full"
            />
          </div>

          <div className="space-y-2 border-t border-slate-200 pt-2.5">
            <label className="block font-semibold text-slate-700">
              {dict?.["admin.theme_settings.metadata_options"]}
            </label>
            {(
              [
                {
                  key: "showExcerpt",
                  labelKey: "admin.theme_settings.show_excerpt",
                },
                {
                  key: "showAuthor",
                  labelKey: "admin.theme_settings.show_author",
                },
                { key: "showDate", labelKey: "admin.theme_settings.show_date" },
                {
                  key: "showCategory",
                  labelKey: "admin.theme_settings.show_category",
                },
              ] as const
            ).map((meta) => (
              <label
                key={meta.key}
                className="flex cursor-pointer items-center gap-2"
              >
                <input
                  type="checkbox"
                  checked={blockConfig[meta.key] !== false}
                  onChange={(e) =>
                    updateBlockField({ [meta.key]: e.target.checked })
                  }
                  className="rounded border-slate-300 text-blue-600"
                />
                <span>{dict?.[meta.labelKey]}</span>
              </label>
            ))}
          </div>
        </div>
      )}
      {/* GLOBAL WIDGET CONTROLS */}
    </>
  )
}
