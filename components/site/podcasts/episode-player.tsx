"use client"
import { useState } from "react"
import { FeaturedVideoPlayer } from "@/components/site/featured-video-player"
import { studioPlayerSource } from "@/lib/studio/media-player"

export function PodcastEpisodePlayer({
  audio,
  video,
  title,
  dict,
}: {
  audio: string
  video: string
  title: string
  dict: Record<string, string>
}) {
  const safeAudio = studioPlayerSource("multimedia", audio)
  const safeVideo = studioPlayerSource("video_player", video)
  const [mode, setMode] = useState<"audio" | "video">(
    safeAudio ? "audio" : "video"
  )
  const t = (key: string) => dict[`site.podcasts.${key}`] || ""
  return (
    <section aria-label={t("player")} className="space-y-4">
      {safeAudio && safeVideo && (
        <div className="flex gap-2" role="group" aria-label={t("media_choice")}>
          {(["audio", "video"] as const).map((kind) => (
            <button
              key={kind}
              type="button"
              aria-pressed={mode === kind}
              onClick={() => setMode(kind)}
              className="border border-[var(--theme-border)] px-5 py-2 aria-pressed:bg-[var(--theme-primary)] aria-pressed:text-[var(--theme-on-primary)]"
            >
              {t(kind === "audio" ? "listen" : "watch")}
            </button>
          ))}
        </div>
      )}
      {/* Unmounting the other player stops playback, including provider iframes. */}
      {mode === "audio" && safeAudio ? (
        <audio
          controls
          preload="none"
          src={safeAudio}
          aria-label={title}
          className="w-full"
        >
          <a href={safeAudio}>{t("open_audio")}</a>
        </audio>
      ) : safeVideo ? (
        <FeaturedVideoPlayer url={safeVideo} title={title} dict={dict} />
      ) : null}
    </section>
  )
}
