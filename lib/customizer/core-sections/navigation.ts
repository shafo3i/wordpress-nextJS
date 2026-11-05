import type { CustomizerSection } from "../types";

export const navigationSection: CustomizerSection = {
  id: "navigation",
  title: "Navigation & Menus",
  titleKey: "admin.customizer.section.navigation",
  icon: "Menu",
  priority: 50,
  groups: [
    {
      id: "nav",
      settings: [
        { id: "navHeight", type: "range", label: "", labelKey: "admin.customizer.setting.navHeight", default: 56, min: 40, max: 88, step: 2, unit: "px", cssVar: "--theme-nav-height", cssUnit: "px" },
        { id: "navItemSpacing", type: "range", label: "", labelKey: "admin.customizer.setting.navItemSpacing", default: 16, min: 8, max: 32, step: 1, unit: "px", cssVar: "--theme-nav-item-spacing", cssUnit: "px" },
        {
          id: "navAlignment",
          type: "button-group",
          label: "Menu Item Alignment",
          default: "left",
          columns: 4,
          options: [
            { value: "left", label: "Left" },
            { value: "center", label: "Center" },
            { value: "right", label: "Right" },
            { value: "between", label: "Justify" },
          ],
        },
        {
          id: "navStyle",
          type: "button-group",
          label: "Link Item Styling",
          default: "classic-text",
          columns: 3,
          options: [
            { value: "classic-text", label: "Classic Text" },
            { value: "underlined", label: "Underlined" },
            { value: "pill-badge", label: "Pill Badges" },
          ],
        },
        { id: "navUppercase", type: "toggle", label: "UPPERCASE Menu Links", default: false },
        { id: "showSearchInNav", type: "toggle", label: "Show Search Icon in Nav", default: true },
      ],
    },
  ],
};
