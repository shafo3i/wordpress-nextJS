import type { CustomizerSection } from "../types";

export const cssSection: CustomizerSection = {
  id: "css",
  title: "Additional Custom CSS",
  titleKey: "admin.customizer.section.css",
  icon: "Code2",
  priority: 90,
  groups: [
    {
      id: "css",
      settings: [
        {
          id: "customCss",
          type: "code",
          label: "Custom CSS",
          description:
            "Inject custom CSS declarations into the theme. Override any selector or use variables like var(--theme-primary).",
          placeholder: "/* Add custom CSS rules here */\n.site-nameplate {\n  letter-spacing: 0.05em;\n}",
          default: "",
          rows: 8,
        },
      ],
    },
  ],
};
