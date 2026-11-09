import type { CustomizerSection, SettingDef } from "../types"

const range = (
  id: string,
  value: number,
  min: number,
  max: number,
  unit = "px"
): SettingDef => ({
  id,
  type: "range",
  label: "",
  default: value,
  min,
  max,
  step: 1,
  unit,
})
const toggle = (id: string, value: boolean): SettingDef => ({
  id,
  type: "toggle",
  label: "",
  default: value,
})
const choice = (
  id: string,
  value: string,
  options: string[],
  numeric = false
): SettingDef => ({
  id,
  type: "select",
  label: "",
  default: numeric ? Number(value) : value,
  numeric,
  options: options.map((value) => ({ value, label: "" })),
})

export const archiveSection: CustomizerSection = {
  id: "archive",
  title: "",
  icon: "Layers",
  priority: 65,
  previewPage: "category",
  groups: [
    {
      id: "layout",
      title: "",
      titleKey: "admin.customizer.group.archive.layout",
      settings: [
        choice("archiveLayout", "list", ["list", "grid"]),
        choice("archiveColumns", "3", ["1", "2", "3", "4"], true),
        range("archiveContentWidth", 1200, 800, 1600),
        range("archivePostsPerPage", 12, 6, 36, ""),
        toggle("archiveFeatured", false),
        choice("archiveSidebar", "right", ["none", "left", "right"]),
      ],
    },
    {
      id: "cards",
      title: "",
      titleKey: "admin.customizer.group.archive.cards",
      settings: [
        range("archiveGap", 16, 8, 48),
        range("archivePadding", 16, 0, 40),
        range("archiveRadius", 0, 0, 32),
        toggle("archiveBorder", true),
        toggle("archiveContentBorder", false),
        toggle("archiveDividerBorders", true),
        range("archiveTitleSize", 20, 14, 36),
        choice(
          "archiveTitleWeight",
          "700",
          ["400", "500", "600", "700", "800"],
          true
        ),
        range("archiveExcerptLength", 160, 0, 400, ""),
        toggle("archiveShowDate", true),
        toggle("archiveShowAuthor", true),
        toggle("archiveShowCategory", true),
      ],
    },
    {
      id: "images",
      title: "",
      titleKey: "admin.customizer.group.archive.images",
      settings: [
        toggle("archiveShowImages", true),
        range("archiveImageWidth", 160, 80, 280),
        range("archiveImageHeight", 110, 70, 240),
        range("archiveGridImageHeight", 180, 100, 320),
        range("archiveImageRadius", 0, 0, 24),
      ],
    },
  ],
}
