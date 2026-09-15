export type HomepageLayout = "full_width" | "right_sidebar" | "left_sidebar" | "dual_sidebar";

export type BlockDisplayStyle =
  | "bento"
  | "lead_side_list"
  | "lead_right_side_list"
  | "grid_3"
  | "grid_4"
  | "list_thumb_left"
  | "list_thumb_right"
  | "hero_slider"
  | "broadsheet_wire"
  | "overlay_cards"
  | "minimal_text";

export type ImageRatio = "landscape" | "square" | "portrait" | "none";

export type HomepageBlockType =
  | "magazine_bento"
  | "broadsheet_3col"
  | "hero_slider"
  | "big_lead_side_list"
  | "news_list"
  | "visual_grid"
  | "category_grid"
  | "tabbed_block"
  | "trending"
  | "opinion"
  | "newsletter"
  | "multimedia"
  | "hero"; // backwards compatibility alias for big_lead_side_list

export type HomepageBlock = {
  id: string;
  type: HomepageBlockType;
  title: string;
  enabled: boolean;
  categorySlug?: string;
  postCount?: number;
  order: number;
  // News Display Presentation Controls
  displayStyle?: BlockDisplayStyle;
  imageRatio?: ImageRatio;
  showExcerpt?: boolean;
  showAuthor?: boolean;
  showDate?: boolean;
  showCategory?: boolean;
};

export type HomepageSettings = {
  layout: HomepageLayout;
  blocks: HomepageBlock[];
};

// Signature defaults per theme
export const THEME_DEFAULT_SETTINGS: Record<string, HomepageSettings> = {
  "ledger-magazine": {
    layout: "full_width",
    blocks: [
      {
        id: "block-bento",
        type: "magazine_bento",
        displayStyle: "bento",
        title: "Top Stories Mega-Bento",
        enabled: true,
        categorySlug: "all",
        postCount: 5,
        order: 1,
        showExcerpt: true,
        showAuthor: true,
        showDate: true,
        showCategory: true,
      },
      {
        id: "block-slider",
        type: "hero_slider",
        displayStyle: "hero_slider",
        title: "Featured Spotlight Carousel",
        enabled: true,
        categorySlug: "all",
        postCount: 5,
        order: 2,
        showExcerpt: true,
        showAuthor: true,
        showDate: true,
        showCategory: true,
      },
      {
        id: "block-trending",
        type: "trending",
        title: "High Velocity Trending",
        enabled: true,
        categorySlug: "all",
        postCount: 5,
        order: 3,
        showExcerpt: false,
        showAuthor: true,
        showDate: true,
        showCategory: true,
      },
      {
        id: "block-tabbed",
        type: "tabbed_block",
        title: "Topic Switcher Hub",
        enabled: true,
        categorySlug: "all",
        postCount: 4,
        order: 4,
        showExcerpt: true,
        showAuthor: true,
        showDate: true,
        showCategory: true,
      },
      {
        id: "block-visual",
        type: "visual_grid",
        displayStyle: "overlay_cards",
        title: "Visual Magazine Gallery",
        enabled: true,
        categorySlug: "technology",
        postCount: 3,
        order: 5,
        showExcerpt: false,
        showAuthor: true,
        showDate: true,
        showCategory: true,
      },
      {
        id: "block-media",
        type: "multimedia",
        title: "Broadcast & Podcast Hub",
        enabled: true,
        order: 6,
      },
      {
        id: "block-list",
        type: "news_list",
        displayStyle: "list_thumb_left",
        title: "Latest Newsroom Dispatch",
        enabled: true,
        categorySlug: "all",
        postCount: 4,
        order: 7,
        showExcerpt: true,
        showAuthor: true,
        showDate: true,
        showCategory: true,
      },
      {
        id: "block-newslt",
        type: "newsletter",
        title: "Executive Daily Briefing",
        enabled: true,
        order: 8,
      },
    ],
  },
  "ledger-classic": {
    layout: "right_sidebar",
    blocks: [
      {
        id: "block-broadsheet",
        type: "broadsheet_3col",
        displayStyle: "broadsheet_wire",
        title: "Front Page Editorial Dispatch",
        enabled: true,
        categorySlug: "all",
        postCount: 6,
        order: 1,
        showExcerpt: true,
        showAuthor: true,
        showDate: true,
        showCategory: true,
      },
      {
        id: "block-lead-side",
        type: "big_lead_side_list",
        displayStyle: "lead_side_list",
        title: "In-Depth Investigations",
        enabled: true,
        categorySlug: "business",
        postCount: 4,
        order: 2,
        showExcerpt: true,
        showAuthor: true,
        showDate: true,
        showCategory: true,
      },
      {
        id: "block-trending",
        type: "trending",
        title: "Most Read Across The Desk",
        enabled: true,
        categorySlug: "all",
        postCount: 5,
        order: 3,
        showExcerpt: false,
        showAuthor: true,
        showDate: true,
        showCategory: true,
      },
      {
        id: "block-news-list",
        type: "news_list",
        displayStyle: "list_thumb_left",
        title: "Chronological Wire Feed",
        enabled: true,
        categorySlug: "all",
        postCount: 4,
        order: 4,
        showExcerpt: true,
        showAuthor: true,
        showDate: true,
        showCategory: true,
      },
      {
        id: "block-opinion",
        type: "opinion",
        title: "Editorial Board & Voices",
        enabled: true,
        categorySlug: "opinion",
        postCount: 3,
        order: 5,
      },
      {
        id: "block-newsletter",
        type: "newsletter",
        title: "The Morning Broadside",
        enabled: true,
        order: 6,
      },
    ],
  },
  "ledger-dark": {
    layout: "dual_sidebar",
    blocks: [
      {
        id: "block-bento",
        type: "magazine_bento",
        displayStyle: "bento",
        title: "Global Intelligence Bento",
        enabled: true,
        categorySlug: "all",
        postCount: 5,
        order: 1,
        showExcerpt: true,
        showAuthor: true,
        showDate: true,
        showCategory: true,
      },
      {
        id: "block-trending",
        type: "trending",
        title: "Live Market Movers",
        enabled: true,
        categorySlug: "all",
        postCount: 5,
        order: 2,
      },
      {
        id: "block-visual",
        type: "visual_grid",
        displayStyle: "overlay_cards",
        title: "Cyber & Tech Innovations",
        enabled: true,
        categorySlug: "technology",
        postCount: 3,
        order: 3,
        showExcerpt: false,
        showAuthor: true,
        showDate: true,
        showCategory: true,
      },
      {
        id: "block-news-list",
        type: "news_list",
        displayStyle: "list_thumb_left",
        title: "Real-Time Terminal Feed",
        enabled: true,
        categorySlug: "all",
        postCount: 4,
        order: 4,
        showExcerpt: true,
        showAuthor: true,
        showDate: true,
        showCategory: true,
      },
      {
        id: "block-media",
        type: "multimedia",
        title: "Market Audio Stream",
        enabled: true,
        order: 5,
      },
    ],
  },
  "ledger-reader": {
    layout: "full_width",
    blocks: [
      {
        id: "block-lead-side",
        type: "big_lead_side_list",
        displayStyle: "lead_side_list",
        title: "Featured Longform Essays",
        enabled: true,
        categorySlug: "all",
        postCount: 4,
        order: 1,
        showExcerpt: true,
        showAuthor: true,
        showDate: true,
        showCategory: true,
      },
      {
        id: "block-news-list",
        type: "news_list",
        displayStyle: "minimal_text",
        title: "Curated Reading Feed",
        enabled: true,
        categorySlug: "all",
        postCount: 6,
        order: 2,
        showExcerpt: true,
        showAuthor: true,
        showDate: true,
        showCategory: true,
      },
      {
        id: "block-opinion",
        type: "opinion",
        title: "Literary Commentary & Analysis",
        enabled: true,
        categorySlug: "opinion",
        postCount: 3,
        order: 3,
      },
      {
        id: "block-newsletter",
        type: "newsletter",
        title: "The Weekend Reader Digest",
        enabled: true,
        order: 4,
      },
    ],
  },
};

export const DEFAULT_HOMEPAGE_SETTINGS: HomepageSettings =
  THEME_DEFAULT_SETTINGS["ledger-classic"];

export function getThemeDefaultSettings(themeSlug: string): HomepageSettings {
  return THEME_DEFAULT_SETTINGS[themeSlug] || DEFAULT_HOMEPAGE_SETTINGS;
}
