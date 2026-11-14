"use client"
import { useMemo, useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { featuredVideoUrl, postVideoCandidates } from "@/lib/featured-video"
import { MediaSelectModal } from "@/components/admin/media-select-modal"
import { FeaturedVideoPlayer } from "@/components/site/featured-video-player"

export function MetaBoxFeaturedVideo({
  value,
  content,
  onChange,
  dict,
}: {
  value: string
  content: string
  onChange: (url: string) => void
  dict: Record<string, string>
}) {
  const [open, setOpen] = useState(true)
  const [library, setLibrary] = useState(false)
  const candidates = useMemo(() => postVideoCandidates(content), [content])
  const selected = featuredVideoUrl(value) || (!value ? candidates[0] : null)
  return (
    <div className="border border-[#c3c4c7] bg-white text-start shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className="flex w-full items-center justify-between border-b border-[#c3c4c7] px-3 py-2 text-sm font-semibold text-[#1d2327]"
      >
        {dict["admin.editor.featured_video"]}
        {open ? (
          <ChevronUp className="size-4" />
        ) : (
          <ChevronDown className="size-4" />
        )}
      </button>
      {open && (
        <div className="space-y-3 p-3 text-xs text-[#50575e]">
          <p>{dict["admin.editor.featured_video_help"]}</p>
          <label className="block space-y-1">
            <span>{dict["admin.editor.featured_video_url"]}</span>
            <input
              type="text"
              inputMode="url"
              autoCapitalize="none"
              spellCheck={false}
              aria-invalid={Boolean(value && !featuredVideoUrl(value))}
              value={value}
              onChange={(event) => onChange(event.target.value)}
              className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] px-2"
            />
          </label>
          {value && !featuredVideoUrl(value) && (
            <p role="alert" className="text-[#d63638]">
              {dict["admin.editor.featured_video_invalid"]}
            </p>
          )}
          {candidates.length > 0 && (
            <label className="block space-y-1">
              <span>{dict["admin.editor.featured_video_from_post"]}</span>
              <select
                value={
                  candidates.includes(featuredVideoUrl(value) || "")
                    ? featuredVideoUrl(value)!
                    : ""
                }
                onChange={(event) => onChange(event.target.value)}
                className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] px-2"
              >
                <option value="">
                  {dict["admin.editor.featured_video_automatic"]}
                </option>
                {candidates.map((url) => (
                  <option key={url} value={url}>
                    {url}
                  </option>
                ))}
              </select>
            </label>
          )}
          <button
            type="button"
            onClick={() => setLibrary(true)}
            className="text-[#2271b1] underline"
          >
            {dict["admin.editor.featured_video_library"]}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="ms-3 text-[#b32d2e] underline"
            >
              {dict["admin.editor.featured_video_reset"]}
            </button>
          )}
          {selected && (
            <FeaturedVideoPlayer
              url={selected}
              title={dict["admin.editor.featured_video"] || ""}
            />
          )}
        </div>
      )}
      {library && (
        <MediaSelectModal
          isOpen
          onClose={() => setLibrary(false)}
          mediaType="video"
          dict={dict}
          title={dict["admin.editor.featured_video_library"]}
          onSelect={(item) => {
            if (
              item.mimeType.startsWith("video/") &&
              featuredVideoUrl(item.url)
            ) {
              onChange(item.url)
              setLibrary(false)
            }
          }}
        />
      )}
    </div>
  )
}
