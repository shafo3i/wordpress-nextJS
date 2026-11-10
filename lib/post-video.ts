import { videoEmbedUrl, safeMediaUrl } from "./post-media"
/** Detect supported video content without executing markup or requesting remote embeds. */
export function isVideoPost(post: {
  hasVideo?: boolean
  content?: string
  categories?: string[]
  categorySlugs?: string[]
}): boolean {
  if (post.hasVideo) return true
  if (post.categorySlugs?.some((slug) => /^(?:video|videos)$/i.test(slug)))
    return true
  if (
    post.categories?.some((name) =>
      /^(?:video|videos|فيديو|الفيديو|فيديوهات|الفيديوهات)$/iu.test(name.trim())
    )
  )
    return true
  const content = post.content || ""
  if (/<video(?:\s|>)/i.test(content) || /\[video(?:\s|\])/i.test(content))
    return true
  const urls = content.match(/(?:https?:\/\/|\/uploads\/)[^\s<>"']+/gi) || []
  return urls.some(
    (url) =>
      !!videoEmbedUrl(url) ||
      (!!safeMediaUrl(url) && /\.(?:mp4|webm|ogv|m4v)(?:[?#]|$)/i.test(url))
  )
}
