import { featuredVideoUrl } from "@/lib/featured-video"
import { safeMediaUrl } from "@/lib/post-media"

/** Pure validation; no remote fetching or user-supplied embed markup. */
export function studioPlayerSource(
  type: string,
  value: unknown
): string | null {
  if (typeof value !== "string" || value.length > 2000) return null
  const source =
    type === "video_player"
      ? featuredVideoUrl(value)
      : safeMediaUrl(value.trim())
  if (!source || (!source.startsWith("/") && !source.startsWith("https://")))
    return null
  if (type === "video_player") return source
  return source &&
    /\.(?:mp3|m4a|aac|wav|ogg|oga|opus|flac)(?:[?#]|$)/i.test(source)
    ? source
    : null
}
