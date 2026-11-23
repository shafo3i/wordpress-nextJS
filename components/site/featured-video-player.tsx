import { featuredVideoUrl, featuredVideoThumbnail } from "@/lib/featured-video"
import { videoEmbedUrl } from "@/lib/post-media"
import { LocalVideoPlayer } from "./video-player"

export function FeaturedVideoPlayer({
  url,
  title,
  dict = {},
}: {
  url: string
  title: string
  dict?: Record<string, string>
}) {
  const safe = featuredVideoUrl(url)
  if (!safe) return null
  return videoEmbedUrl(safe) ? (
    <iframe
      src={safe}
      title={title}
      className="aspect-video w-full border-0"
      loading="lazy"
      allow="fullscreen; picture-in-picture; encrypted-media"
      allowFullScreen
      sandbox="allow-scripts allow-same-origin allow-presentation"
      referrerPolicy="strict-origin-when-cross-origin"
    />
  ) : (
    <LocalVideoPlayer
      key={safe}
      url={safe}
      poster={featuredVideoThumbnail(safe) || undefined}
      title={title}
      dict={dict}
    />
  )
}
