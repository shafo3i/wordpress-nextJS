import { PluginModule } from "@/lib/plugins/types";

// Pre-installed plugins
import readingTimeManifest from "./reading-time/plugin.json";
import { init as initReadingTime } from "./reading-time";

import newsletterManifest from "./newsletter/plugin.json";
import { init as initNewsletter } from "./newsletter";

import relatedPostsManifest from "./related-posts/plugin.json";
import { init as initRelatedPosts } from "./related-posts";

import adManagerManifest from "./ad-manager/plugin.json";
import { init as initAdManager } from "./ad-manager";

// Newsroom catalog plugins
import breakingNewsManifest from "./breaking-news/plugin.json";
import { init as initBreakingNews } from "./breaking-news";

import tocManifest from "./table-of-contents/plugin.json";
import { init as initToc } from "./table-of-contents";

import socialShareManifest from "./social-share/plugin.json";
import { init as initSocialShare } from "./social-share";

import audioManifest from "./article-audio/plugin.json";
import { init as initAudio } from "./article-audio";

import factCheckManifest from "./fact-check/plugin.json";
import { init as initFactCheck } from "./fact-check";

export const AVAILABLE_PLUGINS: Record<string, PluginModule> = {
  "reading-time": {
    manifest: readingTimeManifest as any,
    init: initReadingTime,
  },
  newsletter: {
    manifest: newsletterManifest as any,
    init: initNewsletter,
  },
  "related-posts": {
    manifest: relatedPostsManifest as any,
    init: initRelatedPosts,
  },
  "ad-manager": {
    manifest: adManagerManifest as any,
    init: initAdManager,
  },
  "breaking-news": {
    manifest: breakingNewsManifest as any,
    init: initBreakingNews,
  },
  "table-of-contents": {
    manifest: tocManifest as any,
    init: initToc,
  },
  "social-share": {
    manifest: socialShareManifest as any,
    init: initSocialShare,
  },
  "article-audio": {
    manifest: audioManifest as any,
    init: initAudio,
  },
  "fact-check": {
    manifest: factCheckManifest as any,
    init: initFactCheck,
  },
};
