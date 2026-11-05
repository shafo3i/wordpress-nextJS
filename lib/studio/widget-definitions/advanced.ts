import { defineWidget } from "../widget-definition"
import { generateStudioId } from "../ids"
export const ADVANCED_WIDGETS = {
  tabs: defineWidget("tabs", {
    kind: "widget",
    icon: "FolderKanban",
    catalogs: ["atomic", "general"],
    renderGroup: "advanced",
    controlGroup: "atomic",
    createSettings: () => ({
      tabsItems: [
        { id: generateStudioId("tab"), title: "", content: "" },
        { id: generateStudioId("tab"), title: "", content: "" },
      ],
    }),
  }),
  accordion: defineWidget("accordion", {
    kind: "widget",
    icon: "ListCollapse",
    catalogs: ["atomic", "general"],
    renderGroup: "advanced",
    controlGroup: "atomic",
    createSettings: () => ({
      accordionItems: [
        { id: generateStudioId("acc"), title: "", content: "" },
        { id: generateStudioId("acc"), title: "", content: "" },
      ],
    }),
  }),
  soundcloud: defineWidget("soundcloud", {
    kind: "widget",
    icon: "Headphones",
    catalogs: ["general"],
    renderGroup: "advanced",
    controlGroup: "atomic",
    createSettings: () => ({
      soundcloudUrl: "",
    }),
  }),
  shortcode: defineWidget("shortcode", {
    kind: "widget",
    icon: "Code2",
    catalogs: ["general"],
    renderGroup: "advanced",
    controlGroup: "atomic",
    createSettings: () => ({
      shortcodeText: "",
    }),
  }),
  html: defineWidget("html", {
    kind: "widget",
    icon: "Code2",
    catalogs: ["general"],
    renderGroup: "advanced",
    controlGroup: "atomic",
    createSettings: () => ({
      htmlCode: "",
    }),
  }),
  menu_anchor: defineWidget("menu_anchor", {
    kind: "widget",
    icon: "Anchor",
    catalogs: ["general"],
    renderGroup: "advanced",
    controlGroup: "atomic",
    createSettings: () => ({
      anchorId: "section-anchor",
    }),
  }),
  sidebar: defineWidget("sidebar", {
    kind: "widget",
    icon: "LayoutPanelLeft",
    catalogs: ["general"],
    renderGroup: "advanced",
    controlGroup: "atomic",
    createSettings: () => ({
      widgetId: "recent_posts",
    }),
  }),
  read_more: defineWidget("read_more", {
    kind: "widget",
    icon: "BookOpen",
    catalogs: ["general"],
    renderGroup: "advanced",
    controlGroup: "atomic",
    createSettings: () => ({
      buttonText: "",
      buttonUrl: "#",
    }),
  }),
  rating: defineWidget("rating", {
    kind: "widget",
    icon: "Star",
    catalogs: ["general"],
    renderGroup: "advanced",
    controlGroup: "atomic",
    createSettings: () => ({
      ratingValue: 0,
      ratingMax: 5,
      text: "",
      align: "start",
    }),
  }),
  text_path: defineWidget("text_path", {
    kind: "widget",
    icon: "Spline",
    catalogs: ["general"],
    renderGroup: "advanced",
    controlGroup: "atomic",
    createSettings: () => ({
      text: "",
      align: "center",
    }),
  }),
  svg: defineWidget("svg", {
    kind: "widget",
    icon: "FileCode",
    catalogs: ["atomic"],
    renderGroup: "advanced",
    controlGroup: "atomic",
    createSettings: () => ({
      svgCode:
        '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>',
      align: "center",
    }),
  }),
}
