import { safeMediaUrl } from "@/lib/post-media"
import { sanitizePluginMarkup } from "@/lib/plugins/markup"
import { getWidget } from "@/widgets/registry"
import type { WidgetItem } from "@/widgets/types"

/** Normalize persisted widget data before it reaches a renderer, including legacy rows. */
export function sanitizeWidgetItem(raw: WidgetItem): WidgetItem | null {
  if (
    !raw ||
    typeof raw !== "object" ||
    typeof raw.type !== "string" ||
    typeof raw.id !== "string" ||
    !/^[\w-]{1,100}$/.test(raw.id)
  )
    return null
  const widget = getWidget(raw.type)
  if (!widget) return null
  let nodes = 0
  const clean = (value: unknown, key: string, depth: number): unknown => {
    if (++nodes > 300 || depth > 4) return undefined
    if (["__proto__", "constructor", "prototype"].includes(key))
      return undefined
    if (typeof value === "string") {
      const bounded = value.slice(0, 20_000)
      if (/url$|^links$/i.test(key))
        return bounded === "" || /^#[^\s<>]*$/.test(bounded)
          ? bounded
          : safeMediaUrl(bounded) || ""
      if (/html|code/i.test(key)) return sanitizePluginMarkup(bounded)
      return bounded
    }
    if (typeof value === "boolean" || value === null) return value
    if (typeof value === "number") {
      if (!Number.isFinite(value)) return undefined
      if (["count", "limit"].includes(key))
        return Math.min(100, Math.max(1, Math.trunc(value)))
      if (key === "wpm") return Math.min(1000, Math.max(20, Math.trunc(value)))
      return value
    }
    if (Array.isArray(value))
      return value.slice(0, 50).map((child) => clean(child, key, depth + 1))
    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value)
          .slice(0, 100)
          .filter(
            ([name]) =>
              !["__proto__", "constructor", "prototype"].includes(name)
          )
          .map(([name, child]) => [
            name,
            clean(child, key === "links" ? "links" : name, depth + 1),
          ])
      )
    }
    return undefined
  }
  const config = (clean(raw.config || {}, "config", 0) || {}) as Record<
    string,
    unknown
  >
  const booleanKeys = new Set([
    "openNewTab",
    "relSponsored",
    "isLiveStream",
    "enablePulse",
    "showMilestones",
    "showDate",
    "showThumbnail",
    "useLiveApi",
  ])
  const numericKeys = new Set(["count", "limit", "wpm"])
  for (const [key, value] of Object.entries(config)) {
    if (key === "links" || key === "counts") {
      config[key] =
        value && typeof value === "object" && !Array.isArray(value)
          ? Object.fromEntries(
              Object.entries(value).filter(
                ([, item]) => typeof item === "string"
              )
            )
          : {}
    } else if (booleanKeys.has(key)) {
      if (typeof value !== "boolean") delete config[key]
    } else if (numericKeys.has(key)) {
      if (typeof value !== "number") delete config[key]
    } else if (typeof value !== "string") delete config[key]
  }
  return {
    ...raw,
    type: widget.manifest.id,
    pluginSlug: widget.manifest.pluginSlug,
    title: typeof raw.title === "string" ? raw.title.slice(0, 1000) : "",
    content:
      typeof raw.content === "string"
        ? sanitizePluginMarkup(raw.content.slice(0, 100_000))
        : undefined,
    count:
      typeof raw.count === "number" && Number.isFinite(raw.count)
        ? Math.max(1, Math.min(100, Math.trunc(raw.count)))
        : undefined,
    config,
  }
}
