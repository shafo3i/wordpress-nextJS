import type { ThemeModule } from "@/lib/themes/types";
import { buildPalette } from "@/lib/customizer/palette-builder";
import { EDITORIAL_STONE } from "@/lib/customizer/palettes";
import manifest from "./theme.json";

const theme: ThemeModule = {
  manifest,
  supports: { sectionStyle: "minimal" },
  defaults: {
    ...buildPalette(EDITORIAL_STONE),
    logoWidth: 160,
    headingFontFamily: "merriweather",
    bodyFontFamily: "source_serif",
    baseFontSize: 18,
    headerLayout: "minimal",
    stickyHeader: false,
    showTopBar: false,
    showSocialIconsInHeader: false,
    headerBorderStyle: "solid",
    navAlignment: "center",
    navStyle: "underlined",
    containerWidth: "1140",
    borderRadius: "0",
    cardStyle: "clean-minimal",
    singleLayout: "centered",
    singleShowShareButtons: false,
    singleContentWidth: "narrow",
    footerColumns: 3,
    showFooterSocials: false,
    footerCopyright: "© 2026 PressForge Longform. Dedicated to investigative storytelling.",
  },
};

export default theme;