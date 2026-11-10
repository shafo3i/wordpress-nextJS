"use client"
import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { ChevronDown, ChevronUp, Image as ImageIcon } from "lucide-react"
import { MediaSelectModal } from "@/components/admin/media-select-modal"
import { MediaPreview } from "@/components/admin/media-preview"
import { fetchMediaItemAction } from "@/app/(admin)/admincp/media/actions"
import { safeMediaUrl } from "@/lib/post-media"
export function MetaBoxFeaturedImage({
  featuredImageId,
  onChange,
  dict = {},
}: {
  featuredImageId: string
  onChange: (id: string) => void
  dict?: Record<string, string>
}) {
  const [isOpen, setIsOpen] = useState(true),
    [isModalOpen, setIsModalOpen] = useState(false),
    client = useQueryClient()
  const numeric =
    /^[1-9]\d*$/.test(featuredImageId) &&
    Number.isSafeInteger(Number(featuredImageId))
  const query = useQuery({
    queryKey: ["media-item", featuredImageId],
    enabled: !!numeric,
    staleTime: 30000,
    queryFn: async () => {
      const result = await fetchMediaItemAction(Number(featuredImageId))
      if (!result.success || !result.item)
        throw new Error("admin.media.details_load_failed")
      return result.item
    },
  })
  const url = numeric
    ? query.data?.url || ""
    : safeMediaUrl(featuredImageId) || ""
  return (
    <div className="border border-[#c3c4c7] bg-white text-start shadow-sm">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full items-center justify-between border-b border-[#c3c4c7] px-3 py-2 text-sm font-semibold text-[#1d2327]"
      >
        <span>{dict["admin.editor.featured_image"]}</span>
        {isOpen ? (
          <ChevronUp className="size-4" />
        ) : (
          <ChevronDown className="size-4" />
        )}
      </button>
      {isOpen && (
        <div className="space-y-2 p-3 text-xs text-[#50575e]">
          {featuredImageId ? (
            <>
              <button
                type="button"
                aria-label={dict["admin.editor.change_image"]}
                onClick={() => setIsModalOpen(true)}
                className="block aspect-video w-full overflow-hidden rounded border border-[#dcdcde] bg-[#f6f7f7]"
              >
                {numeric && query.isPending ? (
                  <span role="status">
                    {dict["admin.media.details_loading"]}
                  </span>
                ) : (
                  <MediaPreview
                    url={url}
                    thumbnailUrl={query.data?.thumbnailUrl}
                    alt={
                      query.data?.altText ||
                      query.data?.title ||
                      dict["admin.editor.featured_image"]
                    }
                    dict={dict}
                    className="h-full w-full object-contain"
                  />
                )}
              </button>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  className="text-[#2271b1] underline"
                  onClick={() => setIsModalOpen(true)}
                >
                  {dict["admin.editor.change_image"]}
                </button>
                <button
                  type="button"
                  className="text-[#b32d2e] underline"
                  onClick={() => onChange("")}
                >
                  {dict["admin.editor.remove_image"]}
                </button>
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="flex w-full flex-col items-center gap-2 rounded border-2 border-dashed border-[#c3c4c7] px-3 py-4 text-[#2271b1]"
            >
              <ImageIcon className="size-6" />
              <span>{dict["admin.editor.set_featured_image"]}</span>
            </button>
          )}
        </div>
      )}
      <MediaSelectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={(item) => {
          client.setQueryData(["media-item", String(item.id)], item)
          onChange(String(item.id))
        }}
        title={dict["admin.editor.set_featured_image"]}
        selectButtonText={dict["admin.editor.set_featured_image"]}
        dict={dict}
      />
    </div>
  )
}
