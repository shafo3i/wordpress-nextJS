import type { PluginContext } from "@/lib/plugins/types"
import { addFilter } from "@/lib/plugins/hooks"
import { getPluginConfig } from "@/lib/plugins/config"
import { escapeMediaHtml as escape, safeMediaUrl } from "@/lib/post-media"
import { sanitizePluginMarkup } from "@/lib/plugins/markup"
export function init() {
  addFilter(
    "the_content",
    async (content: string, context?: PluginContext) => {
      const config = await getPluginConfig("ad-manager")
      if (!content || !config.enabled) return content
      const target = safeMediaUrl(config.targetUrl || ""),
        image = safeMediaUrl(config.imageUrl || "")
      const banner = config.customHtml
        ? sanitizePluginMarkup(config.customHtml)
        : image
          ? `<img src="${escape(image)}" alt="${escape(config.sponsorName || "")}" class="max-h-40 w-full object-contain" />`
          : ""
      if (!banner) return content
      const linked =
        target && !config.customHtml
          ? `<a href="${escape(target)}" target="_blank" rel="sponsored noopener noreferrer">${banner}</a>`
          : banner
      const label = context?.theme?.dict?.["admin.plugins.sponsored"] || ""
      const markup = `<aside class="wp-plugin-ad-manager not-prose my-6 border border-theme-border p-4 text-center"><p class="text-xs text-theme-muted">${escape(label)} ${escape(config.sponsorName || "")}</p>${linked}</aside>`
      return config.placement === "before_content"
        ? markup + content
        : content + markup
    },
    15
  )
}
