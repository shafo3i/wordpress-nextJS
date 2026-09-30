import type {
  AvailableWidgetDescriptor,
  WidgetItem,
  WidgetModule,
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
  search: { ...searchModule, manifest: searchManifest as any },
  recent_posts: { ...recentPostsModule, manifest: recentPostsManifest as any },
  categories: { ...categoriesModule, manifest: categoriesManifest as any },
  author_bio: { ...authorBioModule, manifest: authorBioManifest as any },
  custom_html: { ...customHtmlModule, manifest: customHtmlManifest as any },
  weather: { ...weatherModule, manifest: weatherManifest as any },

  // Plugin widgets
  plugin_newsletter: { ...newsletterModule, manifest: newsletterManifest as any },
  plugin_breaking: { ...breakingNewsModule, manifest: breakingNewsManifest as any },
  plugin_audio: { ...audioModule, manifest: audioManifest as any },
  plugin_factcheck: { ...factCheckModule, manifest: factCheckManifest as any },
  plugin_social: { ...socialShareModule, manifest: socialShareManifest as any },
  plugin_ad: { ...adManagerModule, manifest: adManagerManifest as any },
  plugin_reading_time: { ...readingTimeModule, manifest: readingTimeManifest as any },
  plugin_related_posts: { ...relatedPostsModule, manifest: relatedPostsManifest as any },
};

/**
 * Get a widget module by its unique identifier / type
 */
export function getWidget(id: string): WidgetModule | undefined {
  return REGISTERED_WIDGETS[id];
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

  const manifest = mod?.manifest;

  return {
    id: `w-${desc.pluginSlug || desc.type}-${Date.now()}`,
    type: desc.type,
    title: manifest?.defaultTitle || desc.name,
    content: manifest?.defaultContent,
    pluginSlug: desc.pluginSlug,
    displayStyle: desc.type === "recent_posts" ? "list" : undefined,
    showThumbnail: true,
    showDate: true,
    showExcerpt: false,
    count: desc.type === "recent_posts" ? 5 : undefined,
    config: desc.type === "weather" ? { city: "London", temp: "18", condition: "Sunny" } : undefined,
  };
}
