import { describe, it, expect } from "vitest"
import { isVideoPost } from "@/lib/post-video"
import { getStudioContentRequest } from "@/lib/studio/content"
import { createDefaultBlockConfig } from "@/lib/studio/block-defaults"
describe("video thumbnail eligibility", () => {
  it.each([
    '<video controls src="/uploads/news.mp4"></video>',
    '<iframe src="https://www.youtube.com/embed/abcdefghijk"></iframe>',
    "https://vimeo.com/123456789",
    '[video src="/uploads/news.webm"]',
  ])("detects supported video content: %s", (content) =>
    expect(isVideoPost({ content })).toBe(true)
  )
  it("recognizes category names/slugs and precomputed flags", () => {
    for (const post of [
      { categories: ["فيديو"] },
      { categories: ["Video"] },
      { categorySlugs: ["videos"] },
      { hasVideo: true },
    ])
      expect(isVideoPost(post)).toBe(true)
  })
  it("does not mark normal articles or unrelated providers as video", () => {
    expect(
      isVideoPost({
        content: '<p>News</p><a href="https://example.test/watch">link</a>',
        categories: ["News"],
      })
    ).toBe(false)
  })
})
describe("featured layout feed filtering", () => {
  it("leaves filtering under the explicit checkbox control", () => {
    const block = createDefaultBlockConfig("featured_hero_slider")
    expect(getStudioContentRequest(block, "ar").featuredOnly).toBe(false)
    expect(
      getStudioContentRequest({ ...block, featuredOnly: true }, "en")
        .featuredOnly
    ).toBe(true)
    expect(
      getStudioContentRequest({ ...block, featuredOnly: false }, "en")
        .featuredOnly
    ).toBe(false)
  })
})
