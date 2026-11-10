"use client"
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { MediaItem } from "@/services/media.service"
import {
  fetchMediaItemAction,
  updateMediaAction,
} from "@/app/(admin)/admincp/media/actions"
import { MediaPreview } from "./media-preview"

export function MediaAttachmentDetails({
  item,
  dict,
  onUpdated,
}: {
  item: MediaItem
  dict: Record<string, string>
  onUpdated: (item: MediaItem) => void
}) {
  const query = useQuery({
    queryKey: ["media-item", String(item.id)],
    queryFn: async () => {
      const result = await fetchMediaItemAction(item.id)
      if (!result.success || !result.item)
        throw new Error("admin.media.details_load_failed")
      return result.item
    },
    staleTime: 0,
  })
  const value = query.data || item
  const locale =
    typeof document !== "undefined" ? document.documentElement.lang : undefined
  const facts = [
    ["admin.media.filename", value.filename],
    ["admin.media.file_type", value.mimeType],
    [
      "admin.media.file_size",
      value.sizeBytes
        ? `${(value.sizeBytes / 1024).toLocaleString(locale, { maximumFractionDigits: 1 })} KB`
        : dict["admin.media.unknown"],
    ],
    [
      "admin.media.dimensions",
      value.width && value.height
        ? `${value.width} × ${value.height}`
        : dict["admin.media.unknown"],
    ],
    [
      "admin.media.uploaded_on",
      new Date(value.uploadedAt).toLocaleString(locale),
    ],
    [
      "admin.media.uploaded_by",
      value.authorName || dict["admin.media.unknown"],
    ],
    ["admin.media.attachment_id", String(value.id)],
    [
      "admin.media.attached_to",
      value.postParent
        ? String(value.postParent)
        : dict["admin.media.unattached"],
    ],
  ]
  return (
    <div className="space-y-4 p-4 text-start">
      <h3 className="text-xs font-semibold text-[#1d2327] uppercase">
        {dict["admin.media.details_title"]}
      </h3>
      {value.mimeType.startsWith("image/") && (
        <MediaPreview
          url={value.url}
          thumbnailUrl={value.thumbnailUrl}
          alt={value.altText || value.title}
          dict={dict}
          className="max-h-44 w-full rounded border border-[#dcdcde] object-contain"
        />
      )}
      {value.mimeType.startsWith("video/") && (
        <video controls preload="metadata" src={value.url} className="w-full" />
      )}
      {value.mimeType.startsWith("audio/") && (
        <audio controls preload="metadata" src={value.url} className="w-full" />
      )}
      <dl className="space-y-2 text-xs text-[#50575e]">
        {facts.map(([label, value]) => (
          <div key={label}>
            <dt className="font-semibold">{dict[label]}</dt>
            <dd className="break-words">{value}</dd>
          </div>
        ))}
      </dl>
      <label className="block text-xs font-semibold">
        {dict["admin.media.file_url"]}
        <input
          readOnly
          value={value.url}
          className="mt-1 h-[30px] w-full border border-[#8c8f94] bg-white px-2 font-normal"
          onFocus={(e) => e.target.select()}
        />
      </label>
      {query.isPending && (
        <p role="status">{dict["admin.media.details_loading"]}</p>
      )}
      {query.isError && (
        <p role="alert">{dict["admin.media.details_load_failed"]}</p>
      )}
      {query.data && (
        <AttachmentFields
          key={String(item.id)}
          item={query.data}
          dict={dict}
          onUpdated={onUpdated}
        />
      )}
      {value.imageMetadata && Object.keys(value.imageMetadata).length > 0 && (
        <details className="text-xs">
          <summary>{dict["admin.media.image_metadata"]}</summary>
          <pre
            dir="ltr"
            className="max-h-48 overflow-auto break-all whitespace-pre-wrap"
          >
            {JSON.stringify(value.imageMetadata, null, 2)}
          </pre>
        </details>
      )}
    </div>
  )
}
function AttachmentFields({
  item,
  dict,
  onUpdated,
}: {
  item: MediaItem
  dict: Record<string, string>
  onUpdated: (item: MediaItem) => void
}) {
  const client = useQueryClient(),
    [values, setValues] = useState({
      title: item.title,
      altText: item.altText,
      caption: item.caption,
      description: item.description,
    }),
    [message, setMessage] = useState("")
  const save = useMutation({
    mutationFn: () => updateMediaAction(item.id, values),
    onSuccess: async (result) => {
      if (!result.success || !result.item) {
        setMessage("admin.media.details_save_failed")
        return
      }
      client.setQueryData(["media-item", String(item.id)], result.item)
      onUpdated(result.item)
      setMessage("admin.media.details_saved")
      await Promise.all([
        client.invalidateQueries({ queryKey: ["media-picker"] }),
        client.invalidateQueries({ queryKey: ["media-library"] }),
      ])
    },
    onError: () => setMessage("admin.media.details_save_failed"),
  })
  return (
    <div className="space-y-3">
      <p className="text-xs text-[#646970]">
        {dict["admin.media.details_shared_help"]}
      </p>
      <fieldset disabled={save.isPending} className="space-y-3">
        {(
          [
            ["title", "admin.media.title_label"],
            ["altText", "admin.media.alt_text"],
            ["caption", "admin.media.caption"],
            ["description", "admin.media.description"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="block text-xs font-semibold">
            {dict[label]}
            {key === "title" || key === "altText" ? (
              <input
                aria-label={dict[label]}
                value={values[key]}
                onChange={(e) =>
                  setValues((previous) => ({
                    ...previous,
                    [key]: e.target.value,
                  }))
                }
                className="mt-1 h-[30px] w-full border border-[#8c8f94] bg-white px-2 font-normal"
              />
            ) : (
              <textarea
                aria-label={dict[label]}
                value={values[key]}
                onChange={(e) =>
                  setValues((previous) => ({
                    ...previous,
                    [key]: e.target.value,
                  }))
                }
                rows={3}
                className="mt-1 w-full border border-[#8c8f94] bg-white p-2 font-normal"
              />
            )}
          </label>
        ))}
        <button
          type="button"
          onClick={() => {
            setMessage("")
            save.mutate()
          }}
          className="h-[30px] rounded-[3px] border border-[#2271b1] bg-[#2271b1] px-3 text-xs text-white"
        >
          {dict["admin.media.details_save"]}
        </button>
      </fieldset>
      {message && (
        <p role="status" className="text-xs">
          {dict[message]}
        </p>
      )}
    </div>
  )
}
