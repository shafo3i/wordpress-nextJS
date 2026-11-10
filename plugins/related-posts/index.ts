import type { PluginContext } from "@/lib/plugins/types"
import { addFilter } from "@/lib/plugins/hooks"
import { getPluginConfig } from "@/lib/plugins/config"
import { getRelatedPublishedPosts } from "@/lib/site-content"
import { safeMediaUrl, escapeMediaHtml } from "@/lib/post-media"
import { localizePath } from "@/components/site/utils"

export function init() {
  addFilter(
    "the_content",
    async (content: string, context?: PluginContext) => {
      if (!content) return content

      const config = await getPluginConfig("related-posts")
      const count = Math.min(12, Math.max(1, Number(config.count) || 3))
      const locale = context?.article?.locale || context?.theme?.locale
      const dict = context?.theme?.dict || {}
      const relatedStories = await getRelatedPublishedPosts(
        context?.article?.id || "",
        count,
        config.matchStrategy === "tags"
          ? "tags"
          : config.matchStrategy === "recent"
            ? "recent"
            : "categories",
        locale
      )

      if (relatedStories.length === 0) {
        return content
      }

      const cardsHtml = relatedStories
        .map(
          (story) => `
    <a href="${escapeMediaHtml(localizePath(`/posts/${encodeURIComponent(story.slug)}`, locale, context?.theme?.defaultLocale))}" class="block p-3 bg-theme-surface border border-theme-border rounded-lg hover:border-theme-primary hover:shadow-sm transition-all group">
      ${config.showThumbnail !== false && safeMediaUrl(story.imageUrl || "") ? `<img src="${escapeMediaHtml(story.imageUrl)}" alt="" loading="lazy" class="mb-2 h-20 w-24 object-cover" />` : ""}
      ${config.showDate !== false ? `<time class="text-theme-muted">${escapeMediaHtml(new Date(story.date).toLocaleDateString(locale))}</time>` : ""}
      <span class="text-[10px] text-theme-link font-bold uppercase tracking-wider block mb-1">${escapeMediaHtml(
        story.categories?.[0] || ""
      )}</span>
      <p class="font-bold text-theme-heading group-hover:text-theme-link-hover transition-colors line-clamp-2 leading-snug">${escapeMediaHtml(
        story.title
      )}</p>
    </a>`
        )
        .join("")

      const relatedBox = `
<div class="wp-plugin-related-posts not-prose my-8 p-5 bg-theme-surface border border-theme-border rounded-xl">
  <h4 class="text-xs uppercase tracking-wider font-bold text-theme-muted mb-3 flex items-center gap-1.5">
    ${escapeMediaHtml(dict["site.related_posts.heading"] || "")}
  </h4>
  <div class="grid grid-cols-1 ${config.displayStyle === "grid" ? "md:grid-cols-2" : ""} gap-3 text-xs">
    ${cardsHtml}
  </div>
</div>`

      return content + relatedBox
    },
    30
  )
}
