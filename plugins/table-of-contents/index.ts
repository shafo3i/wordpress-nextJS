import type { PluginContext } from "@/lib/plugins/types"
import { addFilter } from "@/lib/plugins/hooks"
import { getPluginConfig } from "@/lib/plugins/config"
import { contentPlainText } from "@/lib/content-text"
import { escapeMediaHtml as escape } from "@/lib/post-media"
export function init() {
  addFilter(
    "the_content",
    async (content: string, context?: PluginContext) => {
      const config = await getPluginConfig("table-of-contents"),
        levels = Array.isArray(config.levels) ? config.levels : ["h2", "h3"]
      const items: string[] = [],
        used = new Set(
          Array.from(
            content.matchAll(/\bid=["']([^"']+)["']/g),
            (match) => match[1]
          )
        )
      const article = content.replace(
        /<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi,
        (full, level, attributes, body) => {
          if (!levels.includes(`h${level}`)) return full
          let id = attributes.match(/\bid=["']([^"']+)["']/i)?.[1]
          if (!id) {
            let number = items.length + 1
            while (used.has(`article-heading-${number}`)) number++
            id = `article-heading-${number}`
            used.add(id)
            attributes += ` id="${id}"`
          }
          items.push(
            `<li><a href="#${escape(encodeURIComponent(id))}" class="text-theme-link underline">${escape(contentPlainText(body))}</a></li>`
          )
          return `<h${level}${attributes}>${body}</h${level}>`
        }
      )
      if (items.length < Math.max(1, Number(config.minHeadings) || 2))
        return content
      const title = escape(
        config.title || context?.theme?.dict?.["admin.plugins.toc.title"] || ""
      )
      const list = `<ol class="space-y-2">${items.join("")}</ol>`
      return (
        `<nav class="wp-plugin-toc not-prose my-6 border border-theme-border p-4">${config.collapsible ? `<details open><summary>${title}</summary>${list}</details>` : `<h2>${title}</h2>${list}`}</nav>` +
        article
      )
    },
    8
  )
}
