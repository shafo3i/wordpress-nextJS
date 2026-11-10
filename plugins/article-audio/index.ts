import type { PluginContext } from "@/lib/plugins/types"
import { addFilter } from "@/lib/plugins/hooks"
import { getPluginConfig } from "@/lib/plugins/config"
import { escapeMediaHtml as escape, safeMediaUrl } from "@/lib/post-media"
export function init() {
  addFilter(
    "the_content",
    async (content: string, context?: PluginContext) => {
      const config = await getPluginConfig("article-audio"),
        url = safeMediaUrl(config.audioUrl || "")
      if (!content || !url) return content
      const label = context?.theme?.dict?.["admin.plugins.audio.listen"] || ""
      return (
        `<section class="wp-plugin-audio not-prose my-5 border border-theme-border p-4"><p>${escape(config.stationName || label)}</p><audio controls preload="none" src="${escape(url)}" class="w-full">${escape(label)}</audio></section>` +
        content
      )
    },
    4
  )
}
