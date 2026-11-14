import { describe, expect, it } from "vitest"
import {
  featuredVideoUrl,
  postVideoCandidates,
  resolveFeaturedVideo,
  featuredVideoThumbnail,
} from "@/lib/featured-video"
import { postEditorSnapshotSchema } from "@/db/schema/cms-post-autosave"
import { editorSnapshot } from "../../fixtures/post-autosave"
describe("Featured videos", () => {
  it.each([
    [
      "https://youtu.be/dQw4w9WgXcQ",
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
    ],
    ["https://vimeo.com/1234567", "https://player.vimeo.com/video/1234567"],
    ["/uploads/2026/video.mp4", "/uploads/2026/video.mp4"],
  ])("canonicalizes supported media %s locally", (input, expected) =>
    expect(featuredVideoUrl(input)).toBe(expected)
  )
  it.each([
    "javascript:alert(1)",
    "//evil.test/video.mp4",
    "https://youtube.com.evil.test/watch?v=dQw4w9WgXcQ",
    "https://user:pass@youtube.com/watch?v=dQw4w9WgXcQ",
    "data:video/mp4,bad",
    "https://example.com/iframe",
  ])("rejects unsafe or unsupported source %s", (value) =>
    expect(featuredVideoUrl(value)).toBeNull()
  )
  it("deduplicates videos, automatically selects the first, and honors an explicit selection", () => {
    const content =
      '<p>https://youtu.be/dQw4w9WgXcQ</p><video src="/uploads/movie.webm"></video><iframe src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"></iframe>'
    expect(postVideoCandidates(content)).toEqual([
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
      "/uploads/movie.webm",
    ])
    expect(resolveFeaturedVideo("", content)).toBe(
      postVideoCandidates(content)[0]
    )
    expect(resolveFeaturedVideo("/uploads/movie.webm", content)).toBe(
      "/uploads/movie.webm"
    )
  })
  it("generates provider thumbnails without network lookups", () => {
    expect(featuredVideoThumbnail("https://youtu.be/dQw4w9WgXcQ")).toBe(
      "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg"
    )
    expect(featuredVideoThumbnail("https://vimeo.com/12345")).toBeNull()
  })
  it("keeps old recovery records compatible and can autosave an incomplete video URL", () => {
    expect(postEditorSnapshotSchema.safeParse(editorSnapshot()).success).toBe(
      true
    )
    expect(
      postEditorSnapshotSchema.safeParse(
        editorSnapshot({ featuredVideoUrl: "https://yout" })
      ).success
    ).toBe(true)
  })
})
