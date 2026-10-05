import type { CustomizerSection } from "@/lib/customizer/types";

/**
 * Pure data (no server imports) so the customizer UI, the CSS generator and the live site
 * can all read the settings this plugin owns.
 */
export const breakingNewsSections: CustomizerSection[] = [
  {
    id: "breaking-news",
    title: "Breaking News Ticker",
    icon: "Sparkles",
    priority: 45,
    groups: [
      {
        id: "ticker",
        settings: [
          {
            id: "topBarTickerText",
            type: "text",
            label: "Ticker Banner Text",
            placeholder: "MARKETS CLOSE UP: TECH LEADS BULLISH RALLY",
          },
          {
            id: "topBarTickerBg",
            type: "color",
            label: "Ticker Badge Background",
            cssVar: "--theme-topbar-ticker-bg",
            default: "#e11d48",
          },
          {
            id: "topBarTickerTextColor",
            type: "color",
            label: "Ticker Badge Text",
            cssVar: "--theme-topbar-ticker-text",
            default: "#ffffff",
          },
        ],
      },
    ],
  },
];