import { FeaturedVideoPlayer } from "@/components/site/featured-video-player"
import { studioPlayerSource } from "@/lib/studio/media-player"
import type { HomepageBlock } from "@/lib/themes/homepage-types"

export function MultimediaBlock({
  block,
  label = "",
  dict,
}: {
  block: HomepageBlock
  label?: string
  dict?: Record<string, string>
}) {
  const source = studioPlayerSource(block.type, block.mediaUrl)
  if (!source) return null
  return (
    <section className="w-full min-w-0 space-y-3">
      {block.showTitle !== false && block.title && (
        <h2 data-studio-title className="text-xl font-bold text-theme-heading">
          {block.title}
        </h2>
      )}
      {block.subtitle && <p className="text-theme-muted">{block.subtitle}</p>}
      {block.type === "video_player" ? (
        <FeaturedVideoPlayer
          url={source}
          title={block.title || label}
          dict={dict}
        />
      ) : (
        <audio
          src={source}
          controls
          preload="none"
          aria-label={block.title || label || undefined}
          className="w-full"
        />
      )}
    </section>
  )
}
