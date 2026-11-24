"use client"
import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { FeaturedVideoPlayer } from "@/components/site/featured-video-player"
import { studioPlayerSource } from "@/lib/studio/media-player"
import type { SelectPodcastEpisode } from "@/db/schema/cms-podcast-episodes"
import { saveEpisodeAction } from "../action"
import { EpisodeShowSelect } from "./episode-show-select"
import { EpisodeMediaFields, type EpisodeMedia } from "./episode-media"

export function EpisodeForm({
  episode,
  languages,
  defaultLanguage,
  dict,
}: {
  episode?: SelectPodcastEpisode
  languages: { code: string; name: string; nativeName: string }[]
  defaultLanguage: string
  dict: Record<string, string>
}) {
  const [language, setLanguage] = useState(
    episode?.languageCode || defaultLanguage
  )
  const [show, setShow] = useState({
    id: episode?.showId || "",
    name: episode?.showName || "",
  })
  const [media, setMedia] = useState<EpisodeMedia>({
    audioId: episode?.audioId || "",
    audioUrl: episode?.audioUrl || "",
    videoId: episode?.videoId || "",
    videoUrl: episode?.videoUrl || "",
    artworkId: episode?.artworkId || "",
    artworkUrl: episode?.artworkUrl || "",
  })
  const [preview, setPreview] = useState<"audio" | "video" | "">("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const t = (key: string) => dict[`admin.podcasts.${key}`] || ""
  const inputClass =
    "h-[32px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2"
  return (
    <form
      className="space-y-5 text-[13px]"
      onSubmit={async (event) => {
        event.preventDefault()
        if (pending) return
        const data = new FormData(event.currentTarget)
        setPending(true)
        setError("")
        try {
          const result = await saveEpisodeAction(data)
          if (result.error)
            setError(dict[result.error] || t("episode_error.failed"))
          else {
            router.replace(
              `/admincp/podcasts/episodes/${result.id}/edit?saved=1`
            )
            router.refresh()
          }
        } catch {
          setError(t("episode_error.failed"))
        } finally {
          setPending(false)
        }
      }}
    >
      <input type="hidden" name="id" value={episode?.id || ""} />
      {error && (
        <p role="alert" className="border-s-4 border-[#d63638] bg-white p-3">
          {error}
        </p>
      )}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-4">
          <label className="block space-y-1">
            <span>{t("episode_title")}</span>
            <input
              name="postTitle"
              defaultValue={episode?.postTitle || ""}
              maxLength={300}
              required
              className={inputClass}
            />
          </label>
          <label className="block space-y-1">
            <span>{t("slug")}</span>
            <input
              name="postName"
              defaultValue={episode?.postName || ""}
              maxLength={200}
              className={inputClass}
            />
          </label>
          {(
            [
              { key: "postExcerpt", label: "episode_summary", limit: 2000 },
              {
                key: "postContent",
                label: "episode_description",
                limit: 100000,
              },
              { key: "transcript", label: "transcript", limit: 100000 },
              { key: "credits", label: "credits", limit: 10000 },
            ] as const
          ).map((field) => (
            <label key={field.key} className="block space-y-1">
              <span>{t(field.label)}</span>
              <textarea
                name={field.key}
                defaultValue={episode?.[field.key] || ""}
                maxLength={field.limit}
                className="min-h-28 w-full rounded-[3px] border border-[#8c8f94] bg-white p-2"
              />
            </label>
          ))}
          <EpisodeMediaFields media={media} onChange={setMedia} dict={dict} />
          <div className="space-y-3">
            {(["audio", "video"] as const)
              .filter((kind) =>
                studioPlayerSource(
                  kind === "audio" ? "multimedia" : "video_player",
                  media[`${kind}Url`]
                )
              )
              .map((kind) => (
                <button
                  key={kind}
                  type="button"
                  className="me-3 text-[#2271b1] underline"
                  onClick={() => setPreview(preview === kind ? "" : kind)}
                >
                  {t(`preview_${kind}`)}
                </button>
              ))}
            {preview === "audio" &&
              studioPlayerSource("multimedia", media.audioUrl) && (
                <audio
                  key={media.audioUrl}
                  controls
                  preload="none"
                  src={studioPlayerSource("multimedia", media.audioUrl)!}
                  className="w-full"
                  aria-label={t("preview_audio")}
                />
              )}
            {preview === "video" &&
              studioPlayerSource("video_player", media.videoUrl) && (
                <FeaturedVideoPlayer
                  key={media.videoUrl}
                  url={studioPlayerSource("video_player", media.videoUrl)!}
                  title={t("preview_video")}
                  dict={dict}
                />
              )}
          </div>
        </div>
        <div className="space-y-4">
          <label className="block space-y-1">
            <span>{t("language")}</span>
            <select
              aria-label={t("language")}
              name="languageCode"
              required
              value={language}
              onChange={(event) => {
                setLanguage(event.target.value)
                setShow({ id: "", name: "" })
              }}
              className={inputClass}
            >
              <option value="">{t("choose_language")}</option>
              {languages.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.nativeName || item.name}
                </option>
              ))}
            </select>
          </label>
          <EpisodeShowSelect
            key={language}
            language={language}
            value={show.id}
            selectedName={show.name}
            onChange={(id, name) => setShow({ id, name })}
            dict={dict}
          />
          <label className="block space-y-1">
            <span>{t("status")}</span>
            <select
              name="status"
              aria-label={t("status")}
              defaultValue={episode?.status || "draft"}
              className={inputClass}
            >
              <option value="draft">{t("draft")}</option>
              <option value="publish">{t("published")}</option>
            </select>
          </label>
          {(["duration", "season", "episodeNumber"] as const).map((field) => (
            <label key={field} className="block space-y-1">
              <span>{t(field)}</span>
              <input
                type="number"
                name={field}
                min={field === "duration" ? 0 : 1}
                max={field === "duration" ? 604800 : 100000}
                step={1}
                defaultValue={episode?.[field] ?? ""}
                className={inputClass}
              />
            </label>
          ))}
          <p className="text-xs text-[#646970]">{t("episode_save_help")}</p>
          <button
            type="submit"
            disabled={pending || !languages.length}
            className="rounded-[3px] bg-[#2271b1] px-3 py-2 text-white disabled:opacity-50"
          >
            {t(pending ? "saving" : "save_episode")}
          </button>
          <Link
            href="/admincp/podcasts/episodes"
            className="ms-3 text-[#2271b1]"
          >
            {t("cancel")}
          </Link>
        </div>
      </div>
    </form>
  )
}
