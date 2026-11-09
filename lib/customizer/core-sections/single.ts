import type { CustomizerSection } from "../types";

export const singleSection: CustomizerSection = {
  id: "single",
  title: "Single Article Page",
  titleKey: "admin.customizer.section.single",
  icon: "FileText",
  priority: 70,
  previewPage: "single",
  groups: [
    {
      id: "layout",
      title: "Article Page Layout Architecture",
      settings: [
        { id: "singleContentBorder", type: "toggle", label: "", default: true },
        { id: "singleImageBorder", type: "toggle", label: "", default: true },
        { id: "singleDividerBorders", type: "toggle", label: "", default: true },
        {
          id: "singleLayout",
          type: "radio-cards",
          label: "Article Page Layout",
          default: "sidebar-right",
          columns: 2,
          options: [
            { value: "sidebar-right", label: "Right Sidebar", note: "Main story (8 cols) + Sidebar (4 cols)", icon: "📰" },
            { value: "sidebar-left", label: "Left Sidebar", note: "Sidebar (4 cols) + Main story (8 cols)", icon: "📑" },
            { value: "full-container", label: "Full Container", note: "Full container width, no sidebar", icon: "📐" },
            { value: "centered", label: "Centered Column", note: "Centered distraction-free column", icon: "📖" },
          ],
        },
        {
          id: "singleContentWidth",
          type: "button-group",
          label: "Reading Column Width",
          description: "Controls text width for centered layouts or full container content.",
          default: "standard",
          columns: 3,
          options: [
            { value: "narrow", label: "Narrow (720px)", note: "Focused" },
            { value: "standard", label: "Standard (900px)", note: "Editorial" },
            { value: "wide", label: "Container (Full)", note: "100% Width" },
          ],
        },
      ],
    },
    {
      id: "elements",
      title: "Display Elements",
      settings: [
        { id: "singleShowViews", type: "toggle", label: "", default: true },
        {
          id: "singleShowFeaturedImage",
          type: "toggle",
          label: "Featured Header Image",
          description: "Display the primary hero visual below the headline",
          default: true,
        },
        {
          id: "singleShowAuthorAvatar",
          type: "toggle",
          label: "Author Avatar & Byline",
          description: "Show author circle badge and journalist attribution",
          default: true,
        },
        {
          id: "singleShowDate",
          type: "toggle",
          label: "Publication Date",
          description: "Show publication timestamp in article header",
          default: true,
        },
        {
          id: "singleShowReadingTime",
          type: "toggle",
          label: "Reading Time Velocity",
          description: "Show estimated minutes to read badge",
          default: true,
        },
        {
          id: "singleShowShareButtons",
          type: "toggle",
          label: "Social Share Bar",
          description: "Show share buttons beside the article",
          default: true,
        },

        { id: "singleShareFacebook", type: "toggle", label: "", default: true, showIf: { id: "singleShowShareButtons", equals: true } },
        { id: "singleShareX", type: "toggle", label: "", default: true, showIf: { id: "singleShowShareButtons", equals: true } },
        { id: "singleShareWhatsapp", type: "toggle", label: "", default: true, showIf: { id: "singleShowShareButtons", equals: true } },
        { id: "singleShareTelegram", type: "toggle", label: "", default: true, showIf: { id: "singleShowShareButtons", equals: true } },
        { id: "singleShareLinkedin", type: "toggle", label: "", default: true, showIf: { id: "singleShowShareButtons", equals: true } },
        { id: "singleShareEmail", type: "toggle", label: "", default: true, showIf: { id: "singleShowShareButtons", equals: true } },
        { id: "singleShareNative", type: "toggle", label: "", default: true, showIf: { id: "singleShowShareButtons", equals: true } },
        { id: "singleShareCopy", type: "toggle", label: "", default: true, showIf: { id: "singleShowShareButtons", equals: true } },
      ],
    },
  ],
};
