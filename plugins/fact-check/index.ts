import type { PluginContext } from "@/lib/plugins/types"
import { addFilter } from "@/lib/plugins/hooks"
import { escapeMediaHtml as escape } from "@/lib/post-media"
import { getFactReview, publicFactReview } from "@/services/fact-review.service"

export function init() {
  addFilter(
    "the_content",
    async (content: string, context?: PluginContext) => {
      if (!content || !context?.article?.id) return content
      const review = publicFactReview(await getFactReview(context.article.id))
      if (!review) return content
      const dict = context?.theme?.dict || {}
      return (
        content +
        `<aside class="wp-plugin-fact-check not-prose my-6 border border-theme-border p-4 text-sm"><h3>${escape(dict["admin.plugins.fact.panel"] || "")}</h3><p><strong>${escape(dict[`admin.plugins.fact.status.${review.status}`] || "")}</strong></p><p>${escape(review.claim)}</p><p>${escape(review.summary)}</p><p>${escape(dict["admin.plugins.fact.reviewer"] || "")}: ${escape(review.reviewerName)} ? <time datetime="${escape(review.reviewedAt)}">${escape(new Date(review.reviewedAt).toLocaleDateString(context?.article?.locale || "en"))}</time></p><ul>${review.sources.map((source) => `<li><a href="${escape(source)}" target="_blank" rel="noopener noreferrer">${escape(source)}</a></li>`).join("")}</ul></aside>`
      )
    },
    22
  )
}
