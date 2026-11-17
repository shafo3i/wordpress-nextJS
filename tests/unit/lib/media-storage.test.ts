import { describe, expect, it } from "vitest"
import { mediaStorageSettingsSchema, mediaUploadDestinationSchema } from "@/db/schema/cms-media-storage"
import { resolveAttachmentImage } from "@/lib/media-images"
import { mapMediaAttachment } from "@/lib/media-attachment"
import { featuredVideoThumbnail } from "@/lib/featured-video"

describe("optional object storage contract", () => {
  const config = { enabled: true, endpoint: "https://s3.eu-central-1.wasabisys.com", region: "eu-central-1", bucket: "news-media", prefix: "media", publicBaseUrl: "https://media.example.test" }
  it("validates configuration and rejects unsafe endpoints, paths and unknown destinations", () => {
    expect(mediaStorageSettingsSchema.parse(config).bucket).toBe("news-media")
    for (const endpoint of ["http://localhost:9000", "https://user:pass@example.test", "https://127.0.0.1", "https://[::1]", "https://example.test/path"]) expect(mediaStorageSettingsSchema.safeParse({ ...config, endpoint }).success).toBe(false)
    expect(mediaStorageSettingsSchema.safeParse({ ...config, prefix: "../other" }).success).toBe(false)
    expect(mediaUploadDestinationSchema.parse(undefined)).toBe("local")
    expect(mediaUploadDestinationSchema.safeParse("other-bucket").success).toBe(false)
  })
  it("resolves S3 originals and derivatives without rewriting them to local uploads", () => {
    const file = "https://media.example.test/media/pressforge/object/image.jpg"
    const metadata = JSON.stringify({ width: 1200, height: 600, sizes: { medium: { file: "image-600x300.jpg", width: 600, height: 300 }, thumbnail: { file: "image-150x150.jpg", width: 150, height: 150 } } })
    const asset = resolveAttachmentImage(file, file, metadata)
    expect(asset.url).toBe(file)
    expect(asset.srcSet).toContain("https://media.example.test/media/pressforge/object/image-600x300.jpg 600w")
    const item = mapMediaAttachment({ id: BigInt(1), title: "Image", caption: "", description: "", guid: file, mimeType: "image/jpeg", postDate: new Date(), postParent: BigInt(0) }, { _wp_attached_file: file, _wp_attachment_metadata: metadata })
    expect(item.thumbnailUrl).toBe("https://media.example.test/media/pressforge/object/image-150x150.jpg")
    expect(resolveAttachmentImage(file, file, JSON.stringify({ sizes: { bad: { file: "../../escape.jpg", width: 100, height: 50 } }, width: 1200, height: 600 })).srcSet).toBeUndefined()
  })
  it("uses generated S3 video posters without enabling arbitrary remote video extraction", () => {
    const video = "https://media.example.test/media/pressforge/00000000-0000-4000-8000-000000000001/2026/11/video.mp4"
    expect(featuredVideoThumbnail(video)).toBe(`${video}.poster.jpg`)
    expect(featuredVideoThumbnail("https://other.example.test/video.mp4")).toBeNull()
    const item = mapMediaAttachment({ id: BigInt(1), title: "Video", caption: "", description: "", guid: video, mimeType: "video/mp4", postDate: new Date(), postParent: BigInt(0) }, { _wp_attached_file: video, _wp_attachment_metadata: JSON.stringify({ storage: { provider: "s3" } }) })
    expect(item.thumbnailUrl).toBe(`${video}.poster.jpg`)
  })
})
