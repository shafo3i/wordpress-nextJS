"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { MediaSelectModal } from "@/components/admin/media-select-modal"
import { saveShowAction } from "../action"
import { getSafeStudioUrl } from "@/lib/studio/urls"
import type { SelectPodcastShow } from "@/db/schema/cms-podcasts"

export function ShowForm({
  show,
  languages,
  dict,
  artworkUrl = "",
}: {
  show?: SelectPodcastShow
  languages: { code: string; name: string; nativeName: string }[]
  dict: Record<string, string>
  artworkUrl?: string
}) {
  const [library, setLibrary] = useState(false)
  const [artwork, setArtwork] = useState({
    id: show?.artworkId || "",
    url: artworkUrl,
  })
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState("")
  const router = useRouter()
  const t = (key: string) => dict[`admin.podcasts.${key}`] || ""
  const inputClass =
    "h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px]"
  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault()
        if (pending) return
        const data = new FormData(event.currentTarget)
        setPending(true)
        setMessage("")
        try {
          const result = await saveShowAction(data)
          if (result.error) setMessage(dict[result.error] || t("error.failed"))
          else {
            router.replace(`/admincp/podcasts/shows?edit=${result.id}&saved=1`)
            router.refresh()
          }
        } catch {
          setMessage(t("error.failed"))
        } finally {
          setPending(false)
        }
      }}
    >
      <h2 className="text-base font-semibold">
        {t(show ? "edit_show" : "add_show")}
      </h2>
      {message && (
        <p role="alert" className="border-s-4 border-[#d63638] bg-white p-3">
          {message}
        </p>
      )}
      <input type="hidden" name="id" value={show?.id || ""} />
      <input type="hidden" name="artworkId" value={artwork.id} />
      <label className="block space-y-1">
        <span>{t("name")}</span>
        <input
          className={inputClass}
          name="name"
          defaultValue={show?.name || ""}
          maxLength={200}
          required
        />
      </label>
      <label className="block space-y-1">
        <span>{t("slug")}</span>
        <input
          className={inputClass}
          name="slug"
          defaultValue={show?.slug || ""}
          maxLength={200}
        />
      </label>
      <label className="block space-y-1">
        <span>{t("language")}</span>
        <select
          className={inputClass}
          name="languageCode"
          aria-label={t("language")}
          defaultValue={show?.languageCode || languages[0]?.code || ""}
          required
        >
          <option value="">{t("choose_language")}</option>
          {languages.map((language) => (
            <option key={language.code} value={language.code}>
              {language.nativeName || language.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block space-y-1">
        <span>{t("status")}</span>
        <select
          className={inputClass}
          name="status"
          aria-label={t("status")}
          defaultValue={show?.status || "draft"}
        >
          <option value="draft">{t("draft")}</option>
          <option value="published">{t("published")}</option>
        </select>
      </label>
      <label className="block space-y-1">
        <span>{t("description")}</span>
        <textarea
          className="min-h-28 w-full rounded-[3px] border border-[#8c8f94] bg-white p-2"
          name="description"
          defaultValue={show?.description || ""}
          maxLength={10000}
        />
      </label>
      <label className="block space-y-1">
        <span>{t("presenters")}</span>
        <input
          className={inputClass}
          name="presenters"
          defaultValue={show?.presenters || ""}
          maxLength={1000}
        />
      </label>
      <label className="block space-y-1">
        <span>{t("website")}</span>
        <input
          className={inputClass}
          dir="ltr"
          type="url"
          name="website"
          defaultValue={show?.website || ""}
          maxLength={2000}
        />
      </label>
      <fieldset className="space-y-2">
        <legend>{t("artwork")}</legend>
        {artwork.url && (
          <img
            src={artwork.url}
            alt={show?.name || t("artwork")}
            className="size-28 object-contain"
          />
        )}
        <button
          type="button"
          onClick={() => setLibrary(true)}
          className="rounded-[3px] border border-[#2271b1] px-3 py-1 text-[#2271b1]"
        >
          {t("select_artwork")}
        </button>
        {artwork.id && (
          <button
            type="button"
            onClick={() => setArtwork({ id: "", url: "" })}
            className="ms-3 text-[#b32d2e]"
          >
            {t("remove_artwork")}
          </button>
        )}
      </fieldset>
      <button
        type="submit"
        disabled={pending || !languages.length}
        className="rounded-[3px] bg-[#2271b1] px-3 py-1.5 text-white disabled:opacity-50"
      >
        {t(pending ? "saving" : "save")}
      </button>
      {show && (
        <Link className="ms-3 text-[#2271b1]" href="/admincp/podcasts/shows">
          {t("cancel")}
        </Link>
      )}
      {library && (
        <MediaSelectModal
          isOpen
          dict={dict}
          mediaType="image"
          onClose={() => setLibrary(false)}
          onSelect={(item) => {
            const url = getSafeStudioUrl(item.url, true)
            if (item.mimeType.startsWith("image/") && url) {
              setArtwork({ id: String(item.id), url })
              setLibrary(false)
            }
          }}
        />
      )}
    </form>
  )
}
