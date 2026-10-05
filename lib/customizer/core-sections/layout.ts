import type { CustomizerSection } from "../types";

export const layoutSection: CustomizerSection = {
  id: "layout",
  title: "Content Layout & Grid",
  titleKey: "admin.customizer.section.layout",
  icon: "Sliders",
  priority: 60,
  groups: [
    {
      id: "geometry",
      settings: [
        {
          id: "containerWidth",
          type: "button-group",
          label: "Container Maximum Width",
          default: "1280",
          columns: 3,
          cssVar: "--theme-container-width",
          cssUnit: "px",
          options: [
            { value: "1140", label: "Standard (1140px)" },
            { value: "1280", label: "Wide (1280px)" },
            { value: "1440", label: "Maxi (1440px)" },
          ],
        },
        {
          id: "borderRadius",
          type: "button-group",
          label: "Corner Radius (Cards & Badges)",
          default: "4",
          columns: 4,
          cssVar: "--theme-radius",
          cssUnit: "px",
          options: [
            { value: "0", label: "Sharp 0px", radius: 0 },
            { value: "4", label: "Classic 4px", radius: 4 },
            { value: "8", label: "Modern 8px", radius: 8 },
            { value: "16", label: "Soft 16px", radius: 16 },
          ],
        },
        {
          id: "cardStyle",
          type: "button-group",
          label: "Card Container Elevation",
          default: "flat-bordered",
          columns: 3,
          options: [
            { value: "flat-bordered", label: "Flat Bordered" },
            { value: "lifted-shadow", label: "Hover Lift Shadow" },
            { value: "clean-minimal", label: "Clean Borderless" },
          ],
        },
      ],
    },
  ],
};
