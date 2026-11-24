"use client"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { searchEpisodeShowsAction } from "../action"

export function EpisodeShowSelect({
  value,
  selectedName,
  language,
  onChange,
  dict,
}: {
  value: string
  selectedName: string
  language: string
  onChange: (id: string, name: string) => void
  dict: Record<string, string>
}) {
  const [input, setInput] = useState("")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const query = useQuery({
    queryKey: ["podcast-show-options", language, search, page],
    queryFn: () => searchEpisodeShowsAction({ language, search, page }),
    enabled: Boolean(language),
    staleTime: 60000,
    retry: false,
  })
  const t = (key: string) => dict[`admin.podcasts.${key}`] || ""
  const items = query.data?.items || []
  return (
    <fieldset className="space-y-2 border border-[#c3c4c7] p-3">
      <legend>{t("episode_show")}</legend>
      <div className="flex gap-2">
        <input
          aria-label={t("search")}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault()
              setSearch(input)
              setPage(1)
            }
          }}
          maxLength={200}
          className="h-[30px] min-w-0 flex-1 border border-[#8c8f94] px-2"
        />
        <button
          type="button"
          onClick={() => {
            setSearch(input)
            setPage(1)
          }}
          className="border border-[#2271b1] px-2 text-[#2271b1]"
        >
          {t("search")}
        </button>
      </div>
      <select
        name="showId"
        value={value}
        aria-label={t("episode_show")}
        required
        onChange={(event) =>
          onChange(
            event.target.value,
            items.find((item) => item.id === event.target.value)?.name || ""
          )
        }
        className="h-[30px] w-full border border-[#8c8f94] bg-white px-2"
      >
        <option value="">{t("choose_show")}</option>
        {value && !items.some((item) => item.id === value) && (
          <option value={value}>{selectedName}</option>
        )}
        {items.map((show) => (
          <option key={show.id} value={show.id}>
            {show.name}
          </option>
        ))}
      </select>
      {query.isPending && language && <p role="status">{t("loading_shows")}</p>}
      {query.isError && (
        <p role="alert">
          {t("episode_error.show_load")}{" "}
          <button
            type="button"
            onClick={() => void query.refetch()}
            className="text-[#2271b1]"
          >
            {dict["admin.studio.content.retry"]}
          </button>
        </p>
      )}
      {!query.isPending && !query.isError && !items.length && (
        <p>{t("empty")}</p>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
          className="text-[#2271b1] disabled:opacity-50"
        >
          {t("previous")}
        </button>
        <span>
          {query.data?.page || page} /{" "}
          {Math.max(1, Math.ceil((query.data?.total || 0) / 20))}
        </span>
        <button
          type="button"
          disabled={!query.data || page >= Math.ceil(query.data.total / 20)}
          onClick={() => setPage(page + 1)}
          className="text-[#2271b1] disabled:opacity-50"
        >
          {t("next")}
        </button>
      </div>
    </fieldset>
  )
}
