import { defineWidget } from "../widget-definition"
import { generateStudioId } from "../ids"
export const DATA_WIDGETS = {
  icon_list: defineWidget("icon_list", {
    kind: "widget",
    icon: "ListChecks",
    catalogs: ["general"],
    renderGroup: "data",
    controlGroup: "atomic",
    createSettings: () => ({
      tabsItems: [
        { id: generateStudioId("li"), title: "", content: "" },
        { id: generateStudioId("li"), title: "", content: "" },
        { id: generateStudioId("li"), title: "", content: "" },
      ],
    }),
  }),
  counter: defineWidget("counter", {
    kind: "widget",
    icon: "Hash",
    catalogs: ["general"],
    renderGroup: "data",
    controlGroup: "atomic",
    createSettings: () => ({
      counterValue: 0,
      counterSuffix: "",
      text: "",
      align: "center",
    }),
  }),
  progress_bar: defineWidget("progress_bar", {
    kind: "widget",
    icon: "BarChart3",
    catalogs: ["general"],
    renderGroup: "data",
    controlGroup: "atomic",
    createSettings: () => ({
      text: "",
      progressPercent: 0,
    }),
  }),
  testimonial: defineWidget("testimonial", {
    kind: "widget",
    icon: "MessageSquareQuote",
    catalogs: ["general"],
    renderGroup: "data",
    controlGroup: "atomic",
    createSettings: () => ({
      text: "",
      testimonialName: "",
      testimonialRole: "",
      testimonialAvatar: "",
    }),
  }),
  social_icons: defineWidget("social_icons", {
    kind: "widget",
    icon: "Share2",
    catalogs: ["general"],
    renderGroup: "data",
    controlGroup: "atomic",
    createSettings: () => ({
      align: "center",
      socialLinks: [],
    }),
  }),
  alert: defineWidget("alert", {
    kind: "widget",
    icon: "AlertCircle",
    catalogs: ["general"],
    renderGroup: "data",
    controlGroup: "atomic",
    createSettings: () => ({
      alertType: "info",
      text: "",
      subText: "",
    }),
  }),
}
