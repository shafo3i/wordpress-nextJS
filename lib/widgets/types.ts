export type CoreWidgetType = "search" | "recent_posts" | "categories" | "author_bio" | "custom_html";

export type PluginWidgetType =
  | "plugin_newsletter"
  | "plugin_audio"
  | "plugin_breaking"
  | "plugin_social"
  | "plugin_factcheck"
  | "plugin_ad"
  | "plugin_reading_time"
  | "plugin_related_posts";

export type WidgetType = CoreWidgetType | PluginWidgetType;

export type WidgetDisplayStyle = "list" | "card" | "compact" | "numbered";

export type WidgetItem = {
  id: string;
  type: WidgetType;
  title: string;
  content?: string;
  count?: number;
  pluginSlug?: string;
  displayStyle?: WidgetDisplayStyle;
  showThumbnail?: boolean;
  showDate?: boolean;
  showExcerpt?: boolean;
};

export type WidgetArea = {
  id: string;
  title: string;
  description: string;
  items: WidgetItem[];
};

export type AvailableWidgetDescriptor = {
  type: WidgetType;
  name: string;
  icon: string;
  desc: string;
  isPlugin?: boolean;
  pluginSlug?: string;
};

export const CORE_WIDGETS: AvailableWidgetDescriptor[] = [
  { type: "search", name: "Search Bar", icon: "", desc: "A search form for news articles" },
  { type: "recent_posts", name: "Recent Posts", icon: "", desc: "A list of your site's most recent posts" },
  { type: "categories", name: "Categories", icon: "", desc: "A list or dropdown of editorial categories" },
  { type: "author_bio", name: "Author Bio", icon: "", desc: "Showcase newsroom staff and credentials" },
  { type: "custom_html", name: "Custom HTML / Code", icon: "", desc: "Arbitrary HTML, embed codes, or scripts" },
];

export const PLUGIN_WIDGET_DEFINITIONS: Record<string, AvailableWidgetDescriptor> = {
  "reading-time": {
    type: "plugin_reading_time",
    name: "Reading Time & Speed (Plugin)",
    icon: "",
    desc: "Article read pace and word count badge powered by Reading Time plugin",
    isPlugin: true,
    pluginSlug: "reading-time",
  },
  "related-posts": {
    type: "plugin_related_posts",
    name: "Related Stories (Plugin)",
    icon: "",
    desc: "Contextual recommended stories powered by Related Stories plugin",
    isPlugin: true,
    pluginSlug: "related-posts",
  },
  newsletter: {
    type: "plugin_newsletter",
    name: "Newsletter Signup (Plugin)",
    icon: "",
    desc: "Interactive email subscriber form powered by Newsletter plugin",
    isPlugin: true,
    pluginSlug: "newsletter",
  },
  "article-audio": {
    type: "plugin_audio",
    name: "Audio Stream / Podcast (Plugin)",
    icon: "",
    desc: "Broadsheet audio stream player powered by Article Audio plugin",
    isPlugin: true,
    pluginSlug: "article-audio",
  },
  "breaking-news": {
    type: "plugin_breaking",
    name: "Breaking Alert Banner (Plugin)",
    icon: "",
    desc: "Urgent breaking news dispatch powered by Breaking News plugin",
    isPlugin: true,
    pluginSlug: "breaking-news",
  },
  "social-share": {
    type: "plugin_social",
    name: "Social Channels & Share (Plugin)",
    icon: "",
    desc: "Connect with newsroom social handles powered by Social Share plugin",
    isPlugin: true,
    pluginSlug: "social-share",
  },
  "fact-check": {
    type: "plugin_factcheck",
    name: "Fact-Check Scorecard (Plugin)",
    icon: "",
    desc: "Editorial claim verification ratings powered by Fact Check plugin",
    isPlugin: true,
    pluginSlug: "fact-check",
  },
  "ad-manager": {
    type: "plugin_ad",
    name: "Sponsor Ad Unit (Plugin)",
    icon: "",
    desc: "Monetized sponsor banner powered by Ad Manager plugin",
    isPlugin: true,
    pluginSlug: "ad-manager",
  },
};

export function createDefaultWidgetItem(desc: AvailableWidgetDescriptor): WidgetItem {
  const defaultTitles: Record<WidgetType, string> = {
    search: "Search Articles",
    recent_posts: "Recent Stories",
    categories: "Categories",
    author_bio: "About the Newsroom",
    custom_html: "Sponsor Advertisement",
    plugin_newsletter: "Morning Dispatch Newsletter",
    plugin_audio: "Daily Audio Stream",
    plugin_breaking: "Urgent News Flash",
    plugin_social: "Follow Our Newsroom",
    plugin_factcheck: "Verified Claim Check",
    plugin_ad: "Monetized Partner Banner",
    plugin_reading_time: "Reading Time Indicator",
    plugin_related_posts: "Recommended Follow-ups",
  };

  return {
    id: `w-${desc.pluginSlug || desc.type}-${Date.now()}`,
    type: desc.type,
    title: defaultTitles[desc.type] || desc.name,
    pluginSlug: desc.pluginSlug,
    displayStyle: desc.type === "recent_posts" ? "list" : undefined,
    showThumbnail: true,
    showDate: true,
    showExcerpt: false,
    count: desc.type === "recent_posts" ? 5 : undefined,
    content:
      desc.type === "custom_html"
        ? '<div class="ad-banner p-4 bg-slate-100 rounded text-center">Featured Editorial Partner</div>'
        : desc.type === "plugin_newsletter"
        ? "Receive top investigative stories and digital market briefings directly in your inbox."
        : desc.type === "plugin_audio"
        ? "Daily 5-minute newsroom podcast covering breaking market stories."
        : desc.type === "plugin_breaking"
        ? "Emergency market circuit breaker triggered across secondary commodities."
        : desc.type === "plugin_factcheck"
        ? "Claim: Global shipping rates decline 40% in Q3. Verdict: TRUE (Verified by Bureau Desk)."
        : desc.type === "plugin_ad"
        ? "Premium enterprise sponsor of Signal News Digital Edition."
        : desc.type === "plugin_reading_time"
        ? "Calculates estimated read speed (~200 wpm) and word counts dynamically."
        : desc.type === "plugin_related_posts"
        ? "Surfaces contextual stories and editorial follow-ups based on category."
        : undefined,
  };
}
