import type { CustomizerSection } from "../types";

export const footerSection: CustomizerSection = {
  id: "footer",
  title: "Footer Architecture",
  titleKey: "admin.customizer.section.footer",
  icon: "Footprints",
  priority: 80,
  groups: [
    {
      id: "footer",
      settings: [
        {
          id: "footerColumns",
          type: "button-group",
          label: "Footer Column Layout",
          default: 4,
          numeric: true,
          columns: 4,
          options: [
            { value: "1", label: "1 Col" },
            { value: "2", label: "2 Col" },
            { value: "3", label: "3 Col" },
            { value: "4", label: "4 Col" },
          ],
        },
        {
          id: "footerCopyright",
          type: "textarea",
          label: "Copyright Notice",
          default: "© 2026 PressForge. All rights reserved.",
          rows: 3,
        },
        { id: "showBackToTop", type: "toggle", label: "Show Back to Top Button", default: true },
        { id: "showFooterSocials", type: "toggle", label: "Show Footer Social Links", default: true },
      ],
    },
  ],
};
