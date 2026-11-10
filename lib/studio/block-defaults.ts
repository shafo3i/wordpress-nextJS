import type {
  BlockDisplayStyle,
  HomepageBlock,
  HomepageBlockType,
} from "@/lib/themes/homepage-types"
import { generateStudioId } from "./ids"

const DEFAULT_BLOCK_STYLES: Partial<
  Record<HomepageBlockType, BlockDisplayStyle>
> = {
  lead_story_grid: "lead_story_grid",
  headlines_grid: "headlines_grid",
  recent_posts: "compact_posts",
  popular_posts: "compact_posts",
  headline_slider: "headline_cover",
  magazine_bento: "bento",
  broadsheet_3col: "broadsheet_wire",
  hero_slider: "hero_slider",
  featured_hero_slider: "featured_slider",
  big_lead_side_list: "lead_side_list",
  news_list: "list_thumb_left",
  visual_grid: "overlay_cards",
  category_grid: "grid_3",
  breaking_ticker: "breaking_bar",
  dual_category_columns: "dual_columns",
  compact_numbered_grid: "numbered_strip",
  split_hero_feature: "split_cover",
  multi_card_carousel: "cards_carousel",
  hero: "lead_side_list",
}

export function createDefaultBlockConfig(
  type: HomepageBlockType,
  defaultCategory = "all"
): HomepageBlock {
  return {
    id: generateStudioId("block"),
    type,
    title: "",
    sortOrder: type === "popular_posts" ? "popular" : "newest",
    displayStyle: DEFAULT_BLOCK_STYLES[type],
    featuredOnly: false,
    imageRatio: "landscape",
    showExcerpt: !["headline_slider", "recent_posts", "popular_posts"].includes(
      type
    ),
    showAuthor: !["headline_slider", "recent_posts", "popular_posts"].includes(
      type
    ),
    showDate: true,
    showCategory: true,
    enabled: true,
    categorySlug: defaultCategory,
    postCount:
      type === "lead_story_grid"
        ? 7
        : type === "headlines_grid"
          ? 9
          : type === "headline_slider" ||
              type === "magazine_bento" ||
              type === "hero_slider" ||
              type === "featured_hero_slider" ||
              type === "compact_numbered_grid"
            ? 5
            : type === "broadsheet_3col" ||
                type === "dual_category_columns" ||
                type === "breaking_ticker"
              ? 6
              : type === "multi_card_carousel"
                ? 8
                : type === "big_lead_side_list" || type === "split_hero_feature"
                  ? 4
                  : type === "visual_grid"
                    ? 3
                    : 4,
    order: 1,
  }
}
