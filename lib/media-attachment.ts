import { resolveAttachmentImage } from "./media-images"
import type { MediaItem } from "@/services/media.service"
export type MediaAttachmentRow = {
  id: bigint
  title: string
  caption: string
  description: string
  mimeType: string
  guid: string
  postDate: Date
  postParent: bigint
  authorName?: string | null
}
export function mapMediaAttachment(
  row: MediaAttachmentRow,
  meta: Record<string, string>,
  includeMetadata = false
): MediaItem {
  const file = meta._wp_attached_file || "",
    asset = resolveAttachmentImage(row.guid, file, meta._wp_attachment_metadata)
  let metadata: Record<string, unknown> = {}
  try {
    const parsed: unknown = JSON.parse(meta._wp_attachment_metadata || "{}")
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed))
      metadata = parsed as Record<string, unknown>
  } catch {}
  const sizes = metadata.sizes as Record<string, { file?: string }> | undefined,
    thumb = sizes?.thumbnail?.file
  const folder = file.includes("/")
    ? file.slice(0, file.lastIndexOf("/") + 1)
    : ""
  const thumbnail = thumb ? resolveAttachmentImage("", folder + thumb).url : ""
  const bytes = Number(metadata.filesize || metadata.fileSize || 0)
  let filename = file.split("/").pop() || ""
  if (!filename)
    try {
      filename = decodeURIComponent(
        new URL(asset.url, "https://media.invalid").pathname.split("/").pop() ||
          ""
      )
    } catch {}
  return {
    id: Number(row.id),
    title: row.title || "",
    filename,
    url: asset.url,
    thumbnailUrl: thumbnail || asset.url,
    mimeType: row.mimeType,
    sizeBytes: Number.isSafeInteger(bytes) && bytes > 0 ? bytes : 0,
    width: asset.width,
    height: asset.height,
    altText: meta._wp_attachment_image_alt || "",
    caption: row.caption || "",
    description: row.description || "",
    uploadedAt: row.postDate.toISOString(),
    authorName: row.authorName || "",
    postParent: Number(row.postParent) || undefined,
    imageMetadata: includeMetadata ? metadata : undefined,
  }
}
