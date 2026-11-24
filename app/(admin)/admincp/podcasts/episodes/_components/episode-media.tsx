"use client"
import { useState } from "react"
import { MediaSelectModal } from "@/components/admin/media-select-modal"
import { getSafeStudioUrl } from "@/lib/studio/urls"
import { studioPlayerSource } from "@/lib/studio/media-player"
import type { InsertPodcastEpisodeOutput } from "@/db/schema/cms-podcast-episodes"
export type EpisodeMedia = Pick<
  InsertPodcastEpisodeOutput,
  "audioId" | "audioUrl" | "videoId" | "videoUrl" | "artworkId"
> & { artworkUrl: string }
export function EpisodeMediaFields({
  media,
  onChange,
  dict,
}: {
  media: EpisodeMedia
  onChange: (media: EpisodeMedia) => void
  dict: Record<string, string>
}) {
  const [picker, setPicker] = useState<"audio" | "video" | "image" | null>(null)
  const t = (key: string) => dict[`admin.podcasts.${key}`] || ""
  return (
    <fieldset className="space-y-4 border border-[#c3c4c7] p-4">
      <legend>{t("episode_media")}</legend>
      {(["audio", "video"] as const).map((kind) => (
        <div key={kind} className="space-y-2">
          <input type="hidden" name={`${kind}Id`} value={media[`${kind}Id`]} />
          <label className="block space-y-1">
            <span>{t(`${kind}_url`)}</span>
            <input
              aria-label={t(`${kind}_url`)}
              type="text"
              inputMode="url"
              dir="ltr"
              name={`${kind}Url`}
              value={media[`${kind}Url`]}
              maxLength={2000}
              onChange={(event) =>
                onChange({
                  ...media,
                  [`${kind}Id`]: "",
                  [`${kind}Url`]: event.target.value,
                })
              }
              className="h-[30px] w-full border border-[#8c8f94] px-2"
            />
          </label>
          {media[`${kind}Url`] &&
            !studioPlayerSource(
              kind === "audio" ? "multimedia" : "video_player",
              media[`${kind}Url`]
            ) && (
              <p role="alert" className="text-[#b32d2e]">
                {t("episode_error.media")}
              </p>
            )}
          <button
            type="button"
            onClick={() => setPicker(kind)}
            className="rounded-[3px] border border-[#2271b1] px-3 py-1 text-[#2271b1]"
          >
            {t(`select_${kind}`)}
          </button>
          {media[`${kind}Url`] && (
            <button
              type="button"
              onClick={() =>
                onChange({ ...media, [`${kind}Id`]: "", [`${kind}Url`]: "" })
              }
              className="ms-3 text-[#b32d2e]"
            >
              {t("remove_media")}
            </button>
          )}
        </div>
      ))}
      <p className="text-xs text-[#646970]">{t("episode_media_help")}</p>
      <input type="hidden" name="artworkId" value={media.artworkId} />
      <div className="space-y-2">
        <p>{t("episode_artwork")}</p>
        {media.artworkUrl ? (
          <img
            src={media.artworkUrl}
            alt={t("episode_artwork")}
            className="size-28 object-contain"
          />
        ) : (
          <p className="text-xs text-[#646970]">{t("inherit_artwork")}</p>
        )}
        <button
          type="button"
          onClick={() => setPicker("image")}
          className="rounded-[3px] border border-[#2271b1] px-3 py-1 text-[#2271b1]"
        >
          {t("select_artwork")}
        </button>
        {media.artworkId && (
          <button
            type="button"
            onClick={() =>
              onChange({ ...media, artworkId: "", artworkUrl: "" })
            }
            className="ms-3 text-[#b32d2e]"
          >
            {t("remove_artwork")}
          </button>
        )}
      </div>
      {picker && (
        <MediaSelectModal
          isOpen
          dict={dict}
          mediaType={picker}
          onClose={() => setPicker(null)}
          onSelect={(item) => {
            if (!item.mimeType.startsWith(`${picker}/`)) return
            const url =
              picker === "image"
                ? getSafeStudioUrl(item.url, true)
                : studioPlayerSource(
                    picker === "audio" ? "multimedia" : "video_player",
                    item.url
                  )
            if (!url) return
            onChange(
              picker === "image"
                ? { ...media, artworkId: String(item.id), artworkUrl: url }
                : {
                    ...media,
                    [`${picker}Id`]: String(item.id),
                    [`${picker}Url`]: url,
                  }
            )
            setPicker(null)
          }}
        />
      )}
    </fieldset>
  )
}
