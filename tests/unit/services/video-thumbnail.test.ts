vi.mock("@/lib/rate-limit", async (load) => ({
  ...await load<typeof import("@/lib/rate-limit")>(),
  checkCmsRateLimit: vi.fn().mockResolvedValue({ success: true, remaining: 1, retryAfter: 0 }),
}))
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
const mocks = vi.hoisted(() => ({ root: "", run: vi.fn() }))
vi.mock("server-only", () => ({}))
vi.mock("node:child_process", () => ({ execFile: mocks.run }))
vi.mock("@/lib/media-files", async (original) => {
  const actual = await original<typeof import("@/lib/media-files")>()
  return { ...actual, mediaRoot: () => actual.mediaRoot(false, mocks.root) }
})
import { videoThumbnail } from "@/services/video-thumbnail.service"
import { featuredVideoThumbnail } from "@/lib/featured-video"
const image = Buffer.from([255, 216, 255, 217])
beforeEach(async () => {
  mocks.root = await fs.mkdtemp(path.join(os.tmpdir(), "video-poster-test-"))
  await fs.mkdir(path.join(mocks.root, "2026"))
  await fs.writeFile(
    path.join(mocks.root, "2026", "movie.mp4"),
    "video fixture"
  )
  mocks.run
    .mockReset()
    .mockImplementation((_command, _args, _options, callback) => {
      callback(null, image)
      return {}
    })
})
afterEach(async () => {
  await fs.rm(mocks.root, { recursive: true, force: true })
})
describe("local video posters", () => {
  it("connects MP4 cards to the thumbnail route", () => {
    expect(featuredVideoThumbnail("/uploads/2026/movie.mp4")).toBe(
      "/api/media/video-thumbnail?src=%2Fuploads%2F2026%2Fmovie.mp4"
    )
  })
  it("generates once and reuses the persistent poster", async () => {
    expect(await videoThumbnail("/uploads/2026/movie.mp4")).toEqual(image)
    expect(await videoThumbnail("/uploads/2026/movie.mp4")).toEqual(image)
    expect(mocks.run).toHaveBeenCalledTimes(1)
    const [command, args, options] = mocks.run.mock.calls[0]
    expect(command).toBe("ffmpeg")
    expect(args).toContain(path.join(mocks.root, "2026", "movie.mp4"))
    expect(args).toContain("file,pipe")
    expect(options).toMatchObject({ timeout: 15000, maxBuffer: 2097152 })
  })
  it.each([
    "https://evil.test/video.mp4",
    "//evil.test/video.mp4",
    "/uploads/%2e%2e/secret.mp4",
    "/uploads/2026/movie.mp4?different=1",
    "/uploads/2026/missing.mp4",
    "/uploads/2026/movie.jpg",
  ])(
    "rejects unsafe/missing sources without running ffmpeg: %s",
    async (source) => {
      await expect(videoThumbnail(source)).rejects.toThrow()
      expect(mocks.run).not.toHaveBeenCalled()
    }
  )
  it("does not cache a failed decoder result", async () => {
    mocks.run.mockImplementationOnce((_command, _args, _options, callback) =>
      callback(new Error("invalid media"), Buffer.alloc(0))
    )
    await expect(
      videoThumbnail("/uploads/2026/movie.mp4")
    ).rejects.toMatchObject({ status: 422 })
    expect(await videoThumbnail("/uploads/2026/movie.mp4")).toEqual(image)
  })
})
