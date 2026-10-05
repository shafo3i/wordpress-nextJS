import type { ThemeModule } from "@/lib/themes/types";
import { buildPalette } from "@/lib/customizer/palette-builder";
import { CRIMSON_MAGAZINE } from "@/lib/customizer/palettes";
import manifest from "./theme.json";

const theme: ThemeModule = {
  manifest,
  supports: { sectionStyle: "magazine" },
  defaults: {
    ...buildPalette(CRIMSON_MAGAZINE),
    logoWidth: 200,
    headingFontFamily: "montserrat",
    bodyFontFamily: "roboto",
    headingFontWeight: "900",
    headerLayout: "magazine",
    topBarTickerText: "BREAKING: SPECIAL INVESTIGATION INTO AI SILICON MANUFACTURING BREAKTHROUGHS",
    headerBorderStyle: "none",
    navAlignment: "between",
    navStyle: "pill-badge",
    navUppercase: true,
    borderRadius: "8",
    cardStyle: "lifted-shadow",
    footerCopyright: "© 2026 PressForge Magazine. High-impact digital publishing.",
  },
};

export default theme;