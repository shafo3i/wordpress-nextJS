import { describe, expect, it } from "vitest"
import { mapMediaAttachment } from "@/lib/media-attachment"
import {
  mediaDetailsPatchSchema,
  mediaItemIdSchema,
} from "@/db/schema/cms-media-details"
const row = {
  id: BigInt(28004),
  title: "Photo",
  caption: "Caption",
  description: "Description",
  mimeType: "image/jpeg",
  guid: "https://old.test/wp-content/uploads/2026/11/photo.jpg",
  postDate: new Date("2026-11-09T12:00:00Z"),
  postParent: BigInt(1),
  authorName: "Editor",
}
describe("attachment details", () => {
  it("resolves imported files, thumbnails, dimensions and actual metadata", () => {
    const metadata = {
      width: 1536,
      height: 1024,
      filesize: 34567,
      sizes: { thumbnail: { file: "photo-150x150.jpg" } },
      image_meta: { credit: "Photographer" },
    }
    const item = mapMediaAttachment(
      row,
      {
        _wp_attached_file: "2026/11/photo.jpg",
        _wp_attachment_metadata: JSON.stringify(metadata),
        _wp_attachment_image_alt: "Alternative text",
      },
      true
    )
    expect(item).toMatchObject({
      url: "/uploads/2026/11/photo.jpg",
      thumbnailUrl: "/uploads/2026/11/photo-150x150.jpg",
      filename: "photo.jpg",
      sizeBytes: 34567,
      width: 1536,
      height: 1024,
      altText: "Alternative text",
      caption: "Caption",
      description: "Description",
      imageMetadata: metadata,
    })
  })
  it("keeps absent size unknown and rejects unsafe media URLs", () => {
    expect(mapMediaAttachment(row, {}).sizeBytes).toBe(0)
    expect(
      mapMediaAttachment({ ...row, guid: "javascript:alert(1)" }, {}).url
    ).toBe("")
  })
  it("validates attachment IDs and editable fields", () => {
    expect(mediaItemIdSchema.safeParse(-1).success).toBe(false)
    expect(
      mediaDetailsPatchSchema.safeParse({ guid: "https://other.test" }).success
    ).toBe(false)
    expect(
      mediaDetailsPatchSchema.parse({
        title: "",
        altText: "Alt",
        caption: "Caption",
        description: "Details",
      })
    ).toHaveProperty("altText", "Alt")
  })
})
