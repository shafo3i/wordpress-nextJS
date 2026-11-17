import { beforeEach, describe, expect, it, vi } from "vitest"
import sharp from "sharp"
import type { DB } from "@/db"
vi.mock("server-only", () => ({}))
vi.mock("@/db", () => ({ db: {} }))
const mocks = vi.hoisted(() => ({ guard: vi.fn(), open: vi.fn(), write: vi.fn(), cleanup: vi.fn(), close: vi.fn(), root: vi.fn() }))
vi.mock("@/lib/authMIddleware", () => ({ verifyPostEditor: mocks.guard }))
vi.mock("@/lib/rate-limit", () => ({ checkCmsRateLimit: vi.fn() }))
vi.mock("@/lib/media-files", () => ({ mediaRoot: mocks.root, checkedMediaPath: vi.fn(), prepareMediaDirectory: vi.fn() }))
vi.mock("@/services/media-tools.service", () => ({ THEME_THUMBNAIL_SIZES: [{ name: "thumbnail", width: 150, height: 150, crop: true }] }))
vi.mock("@/services/media-object-storage.service", () => ({ openS3MediaUpload: mocks.open }))
import { uploadMediaFile } from "@/services/media-upload.service"
beforeEach(() => {
  vi.clearAllMocks()
  mocks.guard.mockResolvedValue({ user: { id: "editor", name: "Editor" } })
  mocks.open.mockImplementation(async (_dir: string, filename: string) => ({ identity: { provider: "s3", key: filename }, url: (name: string) => `https://media.example.test/${name}`, write: mocks.write, cleanup: mocks.cleanup, close: mocks.close }))
})
function databaseWith(fail = false) {
  const writes: unknown[] = []
  const tx = { insert: () => ({ values: (value: unknown) => {
    writes.push(value)
    return { returning: async () => { if (fail) throw new Error("DB failed"); return [{ id: BigInt(42) }] } }
  } }) }
  return { writes, database: { transaction: async (fn: (value: typeof tx) => unknown) => fn(tx) } as unknown as DB }
}
describe("S3 upload integration", () => {
  it("uses the same image normalization and derivatives without touching local storage", async () => {
    const test = databaseWith()
    const bytes = await sharp({ create: { width: 32, height: 24, channels: 3, background: "red" } }).png().toBuffer()
    const item = await uploadMediaFile(bytes, "photo.png", "image/png", "forged", test.database, "s3")
    expect(item).toMatchObject({ id: 42, width: 32, height: 24 })
    expect(item.url).toMatch(/^https:\/\/media.example.test\//)
    expect(mocks.root).not.toHaveBeenCalled()
    expect(mocks.write).toHaveBeenCalledTimes(3)
    expect((await sharp(mocks.write.mock.calls[0][1]).metadata()).format).toBe("png")
    expect(test.writes[0]).toMatchObject({ postAuthor: "editor", guid: item.url })
    const metadata = (test.writes[1] as { metaKey: string; metaValue: string }[]).find(row => row.metaKey === "_wp_attachment_metadata")!
    expect(JSON.parse(metadata.metaValue).storage.provider).toBe("s3")
    expect(mocks.close).toHaveBeenCalledTimes(1)
  })
  it("cleans created objects on DB failure and rejects forged files before opening storage", async () => {
    const test = databaseWith(true)
    await expect(uploadMediaFile(Buffer.from("text"), "file.txt", "text/plain", undefined, test.database, "s3")).rejects.toThrow("DB failed")
    expect(mocks.cleanup).toHaveBeenCalledTimes(1)
    expect(mocks.close).toHaveBeenCalledTimes(1)
    mocks.open.mockClear()
    await expect(uploadMediaFile(Buffer.from("bad"), "image.png", "image/png", undefined, test.database, "s3")).rejects.toThrow("invalid_upload")
    expect(mocks.open).not.toHaveBeenCalled()
    mocks.guard.mockRejectedValue(new Error("denied"))
    await expect(uploadMediaFile(Buffer.from("text"), "file.txt", "text/plain", undefined, test.database, "s3")).rejects.toThrow("denied")
    expect(mocks.open).not.toHaveBeenCalled()
  })
})
