import { describe, expect, it, vi } from "vitest"
import fs from "node:fs/promises"
vi.mock("server-only", () => ({}))
const mocks = vi.hoisted(() => ({ exec: vi.fn() }))
vi.mock("node:child_process", () => ({ execFile: mocks.exec }))
import { createUploadedVideoPoster } from "@/services/media-video-poster.service"
describe("S3 video upload poster generation", () => {
  it("uses private temporary files and bounded local-only ffmpeg processing then removes them", async () => {
    let filename = ""
    mocks.exec.mockImplementation((_command, args, options, callback) => {
      filename = args[args.indexOf("-i") + 1]
      expect(args).toContain("file,pipe")
      expect(args).toContain("mov,matroska,webm,ogg")
      expect(options).toMatchObject({ timeout: 15000, maxBuffer: 2 * 1024 * 1024, windowsHide: true })
      callback(null, Buffer.from("poster"))
    })
    expect(await createUploadedVideoPoster(Buffer.from("validated bytes"), "mp4")).toEqual(Buffer.from("poster"))
    await expect(fs.stat(filename)).rejects.toMatchObject({ code: "ENOENT" })
  })
  it("rejects unsafe extensions before invoking a subprocess", async () => {
    mocks.exec.mockClear()
    await expect(createUploadedVideoPoster(Buffer.from("x"), "../url")).rejects.toThrow("poster_failed")
    expect(mocks.exec).not.toHaveBeenCalled()
  })
})
