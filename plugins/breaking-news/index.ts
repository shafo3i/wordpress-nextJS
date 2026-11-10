import type { PluginContext } from "@/lib/plugins/types"
import { addFilter } from "@/lib/plugins/hooks"
import { getPluginConfig } from "@/lib/plugins/config"
import { getPublishedPosts } from "@/lib/site-content"
import { escapeMediaHtml as escape, safeMediaUrl } from "@/lib/post-media"
import { localizePath } from "@/components/site/utils"
export function init() {
  addFilter(
    "the_content",
    async (content: string, context?: PluginContext) => {
      const config = await getPluginConfig("breaking-news")
      if (!content || !config.enabled) return content
      const locale = context?.article?.locale || context?.theme?.locale,
        dict = context?.theme?.dict || {}
      let headline = config.headline || "",
        target = safeMediaUrl(config.targetUrl || "")
      if (!headline) {
        const [post] = await getPublishedPosts(1, locale)
        if (post) {
          headline = post.title
          target = localizePath(
            `/posts/${encodeURIComponent(post.slug)}`,
            locale,
            context?.theme?.defaultLocale
          )
        }
      }
      if (!headline) return content
      const color =
        config.urgency === "developing"
          ? "border-theme-warning"
          : config.urgency === "alert"
            ? "border-theme-info"
            : "border-theme-danger"
      return (
        `<aside class="wp-plugin-breaking-news not-prose mb-6 flex items-center gap-3 border ${color} p-4"><strong class="${config.enablePulse ? "motion-safe:animate-pulse" : ""}">${escape(config.badgeText || dict["site.breaking_news"] || "")}</strong><span>${escape(headline)}</span>${target ? `<a href="${escape(target)}">${escape(dict["site.read_more"] || "")}</a>` : ""}</aside>` +
        content
      )
    },
    2
  )
}
