import { safeMediaUrl, videoEmbedUrl } from "./post-media"

/** Resolve supported media locally. Never fetch oEmbed/user-provided URLs on the server. */
export function featuredVideoUrl(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 2000) return null
  const input = value.trim()
  const embed = videoEmbedUrl(input)
  if (embed) return embed
  const source = safeMediaUrl(input)
  return source && /\.(?:mp4|webm|ogv|m4v)(?:[?#]|$)/i.test(source)
    ? source
    : null
}

export function postVideoCandidates(content: string): string[] {
  const candidates =
    content
      .slice(0, 2_000_000)
      .match(/(?:https?:\/\/|\/uploads\/)[^\s<>"']+/gi) || []
  return [
    ...new Set(
      candidates
        .map((value) => featuredVideoUrl(value.replaceAll("&amp;", "&")))
        .filter((value): value is string => Boolean(value))
    ),
  ].slice(0, 100)
}

export function resolveFeaturedVideo(
  preferred: unknown,
  content: string
): string | null {
  return featuredVideoUrl(preferred) || postVideoCandidates(content)[0] || null
}

export function featuredVideoThumbnail(value: string | null): string | null {
  const safe = featuredVideoUrl(value)
  const id = safe?.match(
    /^https:\/\/www\.youtube-nocookie\.com\/embed\/([\w-]{11})(?:\?|$)/
  )?.[1]
  if (id) return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
  // Our S3 uploader publishes a poster beside every generated video object.
  if (safe?.startsWith("https://") && /\/pressforge\/[\da-f-]{36}\/\d{4}\/\d{2}\/[^/?#]+\.(?:mp4|webm|ogv|m4v)$/i.test(safe)) return `${safe}.poster.jpg`
  return safe?.startsWith("/uploads/")
    ? `/api/media/video-thumbnail?src=${encodeURIComponent(safe)}`
    : null
}
