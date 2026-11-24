"use client"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { deleteEpisodeAction } from "../action"
import type { listPodcastEpisodes } from "@/services/podcast-episode-query.service"
import { EpisodePagination } from "./episode-pagination"
export function EpisodeTable({
  items,
  page,
  total,
  search,
  language,
  status,
  dict,
}: Awaited<ReturnType<typeof listPodcastEpisodes>> & {
  search: string
  language: string
  status: string
  dict: Record<string, string>
}) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const t = (key: string) => dict[`admin.podcasts.${key}`] || ""
  const pagination = { page, total, search, language, status, dict }
  return (
    <div>
      {error && (
        <p role="alert" className="border-s-4 border-[#d63638] bg-white p-3">
          {error}
        </p>
      )}
      <EpisodePagination {...pagination} />
      <div className="overflow-x-auto">
        <table className="w-full border border-[#c3c4c7] bg-white text-[13px]">
          <thead className="bg-[#f6f7f7]">
            <tr>
              {["episode_title", "language", "status", "episode_date"].map(
                (key) => (
                  <th key={key} className="p-3 text-start font-normal">
                    {t(key)}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {items.map((episode, index) => (
              <tr key={episode.id} className={index % 2 ? "" : "bg-[#f6f7f7]"}>
                <td className="p-3 align-top">
                  <Link
                    href={`/admincp/podcasts/episodes/${episode.id}/edit`}
                    className="font-semibold text-[#2271b1]"
                  >
                    {episode.postTitle}
                  </Link>
                  <div className="mt-1 flex gap-2">
                    <Link
                      href={`/admincp/podcasts/episodes/${episode.id}/edit`}
                      className="text-[#2271b1]"
                    >
                      {t("edit")}
                    </Link>
                    <button
                      type="button"
                      disabled={pending}
                      className="text-[#b32d2e] disabled:opacity-50"
                      onClick={async () => {
                        if (!window.confirm(t("confirm_delete_episode"))) return
                        setPending(true)
                        setError("")
                        try {
                          const result = await deleteEpisodeAction(episode.id)
                          if (result.error)
                            setError(
                              dict[result.error] || t("episode_error.failed")
                            )
                          else router.refresh()
                        } catch {
                          setError(t("episode_error.failed"))
                        } finally {
                          setPending(false)
                        }
                      }}
                    >
                      {t("delete")}
                    </button>
                  </div>
                </td>
                <td className="p-3 align-top">{episode.languageCode}</td>
                <td className="p-3 align-top">
                  {t(episode.status === "publish" ? "published" : "draft")}
                </td>
                <td className="p-3 align-top">
                  <time dateTime={episode.date}>
                    {episode.date.slice(0, 10)}
                  </time>
                </td>
              </tr>
            ))}
            {!items.length && (
              <tr>
                <td colSpan={4} className="p-3">
                  {t("empty_episodes")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <EpisodePagination {...pagination} />
    </div>
  )
}
