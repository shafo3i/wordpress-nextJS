import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { expect, it } from "vitest"
import { studioSettingsSchema } from "@/db/schema/cms-studio"
import { createStudioElement } from "@/lib/studio/tree-helpers"
import { getStudioElementContentRequest } from "@/lib/studio/content"
import { MultimediaBlock } from "@/components/site/blocks/multimedia"

it("saves standalone players without requesting posts", () => {
  for (const type of ["multimedia", "video_player"] as const) {
    const element = createStudioElement(`block_${type}`)
    expect(studioSettingsSchema.safeParse(element.settings).success).toBe(true)
    expect(getStudioElementContentRequest(element, "en")).toBeUndefined()
  }
})

it("rejects script URLs and arbitrary frame hosts at the save boundary and renderer", () => {
  for (const mediaUrl of [
    "javascript:alert(1)",
    "data:text/html,test",
    "https://evil.test/embed/123",
    "//evil.test/video.mp4",
    "https://www.youtube.com.evil.test/watch?v=4vOhXPaGsH0",
    "https://user:password@example.test/video.mp4",
    "http://example.test/video.mp4",
    "/uploads/video.mp4\n<script>alert(1)</script>",
  ]) {
    const element = createStudioElement("block_video_player")
    element.settings.blockConfig!.mediaUrl = mediaUrl
    expect(studioSettingsSchema.safeParse(element.settings).success).toBe(false)
    expect(
      renderToStaticMarkup(
        createElement(MultimediaBlock, { block: element.settings.blockConfig! })
      )
    ).toBe("")
  }
})

it("rejects unsafe audio and escapes editable text as React text", () => {
  const element = createStudioElement("block_multimedia")
  const block = element.settings.blockConfig!
  for (const mediaUrl of [
    "javascript:alert(1).mp3",
    "data:audio/mp3;base64,AA",
    "//evil.test/audio.mp3",
    "http://evil.test/audio.mp3",
  ]) {
    block.mediaUrl = mediaUrl
    expect(studioSettingsSchema.safeParse(element.settings).success).toBe(false)
    expect(
      renderToStaticMarkup(createElement(MultimediaBlock, { block }))
    ).toBe("")
  }
  block.mediaUrl = "/uploads/audio.mp3"
  block.title = '<img src=x onerror="alert(1)">'
  const html = renderToStaticMarkup(createElement(MultimediaBlock, { block }))
  expect(html).not.toContain("<img")
  expect(html).toContain("&lt;img")
})

it("renders native file players and canonical provider embeds without raw HTML", () => {
  for (const [type, mediaUrl, tag] of [
    ["multimedia", "/uploads/2026/11/audio.mp3", "<audio"],
    ["video_player", "https://media.example.test/video.mp4", "<video"],
    [
      "video_player",
      "https://youtu.be/4vOhXPaGsH0",
      "https://www.youtube-nocookie.com/embed/4vOhXPaGsH0",
    ],
    [
      "video_player",
      "https://vimeo.com/12345",
      "https://player.vimeo.com/video/12345",
    ],
  ] as const) {
    const element = createStudioElement(`block_${type}`)
    element.settings.blockConfig!.mediaUrl = mediaUrl
    expect(studioSettingsSchema.safeParse(element.settings).success).toBe(true)
    const html = renderToStaticMarkup(
      createElement(MultimediaBlock, { block: element.settings.blockConfig! })
    )
    expect(html).toContain(tag)
    expect(html).not.toContain("autoplay")
  }
})
