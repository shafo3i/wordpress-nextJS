import type {
  AvailableWidgetDescriptor,
  WidgetItem,
  WidgetModule,
  WidgetManifest,
} from "./types";

// Core widgets
import searchManifest from "./search/widget.json";
import searchModule from "./search";

import recentPostsManifest from "./recent-posts/widget.json";
import recentPostsModule from "./recent-posts";

import categoriesManifest from "./categories/widget.json";
import categoriesModule from "./categories";

import authorBioManifest from "./author-bio/widget.json";
import authorBioModule from "./author-bio";

import customHtmlManifest from "./custom-html/widget.json";
import customHtmlModule from "./custom-html";

import weatherManifest from "./weather/widget.json";
import weatherModule from "./weather";

// Plugin widgets
import newsletterManifest from "./newsletter/widget.json";
import newsletterModule from "./newsletter";

import breakingNewsManifest from "./breaking-news/widget.json";
import breakingNewsModule from "./breaking-news";

import audioManifest from "./article-audio/widget.json";
import audioModule from "./article-audio";

import factCheckManifest from "./fact-check/widget.json";
import factCheckModule from "./fact-check";

import socialShareManifest from "./social-share/widget.json";
import socialShareModule from "./social-share";

import adManagerManifest from "./ad-manager/widget.json";
import adManagerModule from "./ad-manager";

import readingTimeManifest from "./reading-time/widget.json";
import readingTimeModule from "./reading-time";

import relatedPostsManifest from "./related-posts/widget.json";
import relatedPostsModule from "./related-posts";

export const REGISTERED_WIDGETS: Record<string, WidgetModule> = {
  // Core
  search: { ...searchModule, manifest: searchManifest as WidgetManifest },
  recent_posts: { ...recentPostsModule, manifest: recentPostsManifest as WidgetManifest },
  categories: { ...categoriesModule, manifest: categoriesManifest as WidgetManifest },
  author_bio: { ...authorBioModule, manifest: authorBioManifest as WidgetManifest },
  custom_html: { ...customHtmlModule, manifest: customHtmlManifest as WidgetManifest },
  weather: { ...weatherModule, manifest: weatherManifest as WidgetManifest },

  // Plugin widgets
  plugin_newsletter: { ...newsletterModule, manifest: newsletterManifest as WidgetManifest },
  plugin_breaking: { ...breakingNewsModule, manifest: breakingNewsManifest as WidgetManifest },
  plugin_audio: { ...audioModule, manifest: audioManifest as WidgetManifest },
  plugin_factcheck: { ...factCheckModule, manifest: factCheckManifest as WidgetManifest },
  plugin_social: { ...socialShareModule, manifest: socialShareManifest as WidgetManifest },
  plugin_ad: { ...adManagerModule, manifest: adManagerManifest as WidgetManifest },
  plugin_reading_time: { ...readingTimeModule, manifest: readingTimeManifest as WidgetManifest },
  plugin_related_posts: { ...relatedPostsModule, manifest: relatedPostsManifest as WidgetManifest },
};

const WIDGET_ALIASES: Record<string, string> = {
  newsletter: "plugin_newsletter",
  "plugin_newsletter": "plugin_newsletter",
  article_audio: "plugin_audio",
  "article-audio": "plugin_audio",
  audio: "plugin_audio",
  "plugin_audio": "plugin_audio",
  breaking_news: "plugin_breaking",
  "breaking-news": "plugin_breaking",
  breaking: "plugin_breaking",
  "plugin_breaking": "plugin_breaking",
  social_share: "plugin_social",
  "social-share": "plugin_social",
  social: "plugin_social",
  "plugin_social": "plugin_social",
  reading_time: "plugin_reading_time",
  "reading-time": "plugin_reading_time",
  "plugin_reading_time": "plugin_reading_time",
  related_posts: "plugin_related_posts",
  "related-posts": "plugin_related_posts",
  "plugin_related_posts": "plugin_related_posts",
  ad: "plugin_ad",
  ad_manager: "plugin_ad",
  "ad-manager": "plugin_ad",
  "plugin_ad": "plugin_ad",
  factcheck: "plugin_factcheck",
  fact_check: "plugin_factcheck",
  "fact-check": "plugin_factcheck",
  "plugin_factcheck": "plugin_factcheck",
  recent_posts: "recent_posts",
  "recent-posts": "recent_posts",
  author_bio: "author_bio",
  "author-bio": "author_bio",
  custom_html: "custom_html",
  "custom-html": "custom_html",
};

/**
 * Get a widget module by its unique identifier / type
 */
export function getWidget(id: string): WidgetModule | undefined {
  if (typeof id !== "string" || !id || ["__proto__", "constructor", "prototype"].includes(id)) return undefined;
  
  // 1. Direct key match
  if (Object.hasOwn(REGISTERED_WIDGETS, id)) return REGISTERED_WIDGETS[id];
  
  // 2. Normalized underscore match
  const normalized = id.replace(/-/g, "_");
  if (Object.hasOwn(REGISTERED_WIDGETS, normalized)) return REGISTERED_WIDGETS[normalized];
  
  // 3. Alias dictionary check
  const alias = Object.hasOwn(WIDGET_ALIASES, id) ? WIDGET_ALIASES[id] : Object.hasOwn(WIDGET_ALIASES, normalized) ? WIDGET_ALIASES[normalized] : undefined;
  if (alias && REGISTERED_WIDGETS[alias]) return REGISTERED_WIDGETS[alias];
  
  // 4. "plugin_" prefix checks
  if (REGISTERED_WIDGETS[`plugin_${id}`]) return REGISTERED_WIDGETS[`plugin_${id}`];
  if (REGISTERED_WIDGETS[`plugin_${normalized}`]) return REGISTERED_WIDGETS[`plugin_${normalized}`];
  
  // 5. Look up by pluginSlug or manifest.id
  const bySlug = Object.values(REGISTERED_WIDGETS).find((w) => {
    const m = w.manifest;
    return (
      m.id === id ||
      m.id === normalized ||
      m.pluginSlug === id ||
      m.pluginSlug === normalized ||
      m.pluginSlug === id.replace(/_/g, "-")
    );
  });
  if (bySlug) return bySlug;

  return undefined;
}

/**
 * Get all registered widget modules
 */
export function getAllWidgets(): WidgetModule[] {
  return Object.values(REGISTERED_WIDGETS);
}

/**
 * Get available widget descriptors for the editor palette,
 * dynamically filtered by active plugin slugs.
 */
export function getAvailableWidgets(activePluginSlugs?: string[]): AvailableWidgetDescriptor[] {
  const result: AvailableWidgetDescriptor[] = [];

  for (const mod of Object.values(REGISTERED_WIDGETS)) {
    const { manifest } = mod;
    if (manifest.category === "core") {
      result.push({
        type: manifest.id,
        name: manifest.name,
        desc: manifest.description,
        isPlugin: false,
      });
    } else if (manifest.category === "plugin") {
      const isAllowed = !activePluginSlugs || (manifest.pluginSlug && activePluginSlugs.includes(manifest.pluginSlug));
      if (isAllowed) {
        result.push({
          type: manifest.id,
          name: manifest.name,
          desc: manifest.description,
          isPlugin: true,
          pluginSlug: manifest.pluginSlug,
        });
      }
    }
  }

  return result;
}

/**
 * Instantiate a default WidgetItem when dragging or adding from the palette
 */
export function createDefaultWidgetItem(desc: AvailableWidgetDescriptor): WidgetItem {
  const mod = getWidget(desc.type);
  if (mod?.createDefault) {
    return mod.createDefault(desc);
  }

  return {
    id: `w-${desc.pluginSlug || desc.type}-${Date.now()}`,
    type: desc.type,
    title: "",
    content: "",
    pluginSlug: desc.pluginSlug,
    displayStyle: desc.type === "recent_posts" ? "list" : undefined,
    showThumbnail: true,
    showDate: true,
    showExcerpt: false,
    count: desc.type === "recent_posts" ? 5 : undefined,
    config: undefined,
    locale: "all",
  };
}
