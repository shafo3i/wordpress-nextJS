import { useState } from "react"
import { MediaSelectModal } from "@/components/admin/media-select-modal"
import { studioPlayerSource } from "@/lib/studio/media-player"
import type { HomepageBlock } from "@/lib/themes/homepage-types"

export function StudioPlayerControls({
  block,
  onChange,
  dict,
}: {
  block: HomepageBlock
  onChange: (patch: Partial<HomepageBlock>) => void
  dict?: Record<string, string>
}) {
  const [open, setOpen] = useState(false)
  const video = block.type === "video_player"
  const invalid = Boolean(
    block.mediaUrl && !studioPlayerSource(block.type, block.mediaUrl)
  )
  return (
    <div className="space-y-3">
      <label className="block space-y-1">
        <span>
          {
            dict?.[
              video
                ? "admin.studio.media.video_url"
                : "admin.studio.media.audio_url"
            ]
          }
        </span>
        <input
          type="text"
          inputMode="url"
          dir="ltr"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={2000}
          value={block.mediaUrl || ""}
          aria-invalid={invalid}
          onChange={(event) => onChange({ mediaUrl: event.target.value })}
          className="w-full rounded border border-slate-300 px-2.5 py-1.5"
        />
      </label>
      {invalid && (
        <p role="alert">{dict?.["admin.studio.media.invalid_source"]}</p>
      )}
      <p className="text-xs text-slate-500">
        {dict?.["admin.studio.media.help"]}
      </p>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-blue-600 underline"
      >
        {dict?.["admin.studio.media.select"]}
      </button>
      {open && (
        <MediaSelectModal
          isOpen
          onClose={() => setOpen(false)}
          dict={dict || {}}
          mediaType={video ? "video" : "audio"}
          onSelect={(item) => {
            if (
              item.mimeType.startsWith(video ? "video/" : "audio/") &&
              studioPlayerSource(block.type, item.url)
            ) {
              onChange({ mediaUrl: item.url })
              setOpen(false)
            }
          }}
        />
      )}
    </div>
  )
}
