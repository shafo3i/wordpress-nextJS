import type { ThemeModule } from "@/lib/themes/types";
import { buildPalette } from "@/lib/customizer/palette-builder";
import { BROADSHEET_BLUE } from "@/lib/customizer/palettes";
import manifest from "./theme.json";

const theme: ThemeModule = {
  manifest,
  supports: { sectionStyle: "classic" },
  defaults: {
    ...buildPalette(BROADSHEET_BLUE),
    topBarTickerText: "MARKETS CLOSE UP: TECH & COMMODITIES LEAD BULLISH RALLY",
    footerCopyright: "© 2026 Signal News Digital Edition. All rights reserved.",
  },
};

export default theme;