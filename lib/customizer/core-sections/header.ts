import type { CustomizerSection } from "../types";

export const headerSection: CustomizerSection = {
  id: "header",
  title: "Header Layout & Topbar",
  titleKey: "admin.customizer.section.header",
  icon: "Layout",
  priority: 40,
  groups: [
    {
      id: "layout",
      settings: [
        {
          id: "headerLayout",
          type: "radio-cards",
          label: "Masthead Architectural Style",
          default: "classic",
          options: [
            { value: "classic", label: "Classic Newspaper Broadsheet", note: "Centered nameplate, dateline, double rules" },
            { value: "magazine", label: "Magazine Multi-tier", note: "Top ticker bar, brand row, full-bleed navbar" },
            { value: "minimal", label: "Clean Minimalist Navbar", note: "Left logo, inline navigation, right action" },
            { value: "centered", label: "Centered Editorial", note: "Symmetric masthead with balanced side elements" },
          ],
        },
        {
          id: "headerBorderStyle",
          type: "button-group",
          label: "Header Bottom Rule Style",
          default: "double",
          columns: 3,
          options: [
            { value: "double", label: "Classic Double" },
            { value: "solid", label: "Single Thin" },
            { value: "none", label: "Borderless" },
          ],
        },
      ],
    },
    {
      id: "topbar",
      settings: [
        { id: "showTopBar", type: "toggle", label: "Show Top Utility / Breaking Bar", default: true },
      ],
    },
    {
      id: "toggles",
      settings: [
        { id: "stickyHeader", type: "toggle", label: "Sticky Header on Scroll", default: true },
        { id: "showDateInHeader", type: "toggle", label: "Show Date Line in Masthead", default: true },
        { id: "showSocialIconsInHeader", type: "toggle", label: "Show Social Icons in Header", default: true },
      ],
    },
  ],
};
