import { featuredVideoUrl } from "@/lib/featured-video"
import { videoEmbedUrl } from "@/lib/post-media"

export function FeaturedVideoPlayer({
  url,
  title,
}: {
  url: string
  title: string
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
    <video
      src={safe}
      controls
      playsInline
      preload="metadata"
      aria-label={title}
      className="aspect-video w-full bg-black"
    />
  )
}
