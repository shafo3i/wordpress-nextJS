import type { ThemeModule } from "@/lib/themes/types";
import { buildPalette } from "@/lib/customizer/palette-builder";
import { CYBER_EMERALD } from "@/lib/customizer/palettes";
import manifest from "./theme.json";

const theme: ThemeModule = {
  manifest,
  supports: { sectionStyle: "terminal" },
  defaults: {
    ...buildPalette(CYBER_EMERALD),
    logoWidth: 170,
    headingFontFamily: "oswald",
    bodyFontFamily: "inter",
    baseFontSize: 16,
    headingTransform: "uppercase",
    singleLayout: "full-container",
    singleContentWidth: "wide",
    footerCopyright: "© 2026 PressForge Midnight. High-velocity terminal intelligence.",
  },
};

export default theme;