import { beforeEach, describe, expect, it, vi } from "vitest"
const mocks = vi.hoisted(() => ({
  limit: vi.fn(), site: vi.fn(), guard: vi.fn(),
  database: vi.fn(() => { throw new Error("unexpected database work") }),
  files: vi.fn(() => { throw new Error("unexpected filesystem work") }),
  sharp: vi.fn(() => { throw new Error("unexpected image decoding") }),
}))
vi.mock("server-only", () => ({}))

vi.mock("@/lib/authMIddleware", () => ({ verifyAdmin: mocks.guard, verifyPostEditor: mocks.guard }))
vi.mock("@/db", () => ({
  db: { select: mocks.database, insert: mocks.database, update: mocks.database, delete: mocks.database, execute: mocks.database, transaction: mocks.database },
  pool: { connect: mocks.database },
}))
vi.mock("node:fs/promises", () => ({ default: new Proxy({}, { get: () => mocks.files }) }))
vi.mock("fs/promises", () => ({ default: new Proxy({}, { get: () => mocks.files }) }))
vi.mock("node:fs", () => ({ default: { existsSync: mocks.files } }))
vi.mock("sharp", () => ({ default: mocks.sharp }))
vi.mock("@/lib/content-text", () => ({ contentPlainText: (value: string) => value }))
vi.mock("@/lib/post-content-media", () => ({ renderPostMedia: (value: string) => value }))
vi.mock("@/services/language.service", () => ({ getTemplateTranslations: () => ({}) }))

vi.mock("@/lib/rate-limit", () => ({ checkCmsRateLimit: mocks.limit,
  RateLimitError: class extends Error { constructor(readonly status: number, readonly retryAfter: number) { super("rate_limited") } }
}))
import { RateLimitError } from "@/lib/rate-limit"
import { importWxrXml, importJsonArchive } from "@/services/import.service"
import { exportWxrXml, exportSqlDump, exportJsonArchive } from "@/services/export.service"
import { searchAndReplace, runDatabaseCleanup } from "@/services/database-maintenance.service"
import { getMediaOverviewStats, regenerateThumbnails, scanOrphanMedia, cleanOrphanMedia } from "@/services/media-tools.service"
import { uploadMediaFile } from "@/services/media-upload.service"
import { savePostAutosave } from "@/services/post-autosave.service"
import { syncMissingTranslations } from "@/services/language-sync.service"
import { editorSnapshot } from "../../fixtures/post-autosave"

const denied = new RateLimitError(429, 19)
beforeEach(() => {
  vi.clearAllMocks()
  mocks.guard.mockResolvedValue({ user: { id: "valid-actor", role: "admin" } })
  mocks.limit.mockReset().mockRejectedValue(denied)
  mocks.site.mockReset().mockResolvedValue(undefined)
})

const operations: Array<[string, string, () => Promise<unknown>]> = [
  ["WXR import", "import", () => importWxrXml("<rss><channel /></rss>", "valid-actor")],
  ["JSON import", "import", () => importJsonArchive('{"data":{}}', "valid-actor")],
  ["WXR export", "export", () => exportWxrXml()],
  ["SQL export", "export", () => exportSqlDump()],
  ["JSON export", "export", () => exportJsonArchive()],
  ["manual inventory scan", "scan", () => getMediaOverviewStats({ scanFiles: true })],
  ["orphan scan", "scan", () => scanOrphanMedia()],
  ["thumbnail regeneration", "regenerate", () => regenerateThumbnails({})],
  ["orphan cleanup", "cleanup", () => cleanOrphanMedia([], "delete")],
  ["database cleanup", "cleanup", () => runDatabaseCleanup(["revisions"])],
  ["search and replace", "replace", () => searchAndReplace({ search: "old", replace: "new" })],
  ["upload", "upload", () => uploadMediaFile(Buffer.from([137,80,78,71,13,10,26,10]), "image.png", "image/png")],
  ["autosave", "autosave", () => savePostAutosave("valid-actor", { ownerId: "valid-actor", documentKey: "post:1", expectedVersion: 0, baseModified: "2026-11-09T12:00:00.000Z", snapshot: editorSnapshot() })],
  ["language synchronization", "sync", () => syncMissingTranslations()],
]

describe("direct service quota boundaries for authorized actors", () => {
  it("checks authorization before reserving any Valkey allowance", async () => {
    const unauthorized = new Error("authorization required")
    mocks.guard.mockRejectedValueOnce(unauthorized)
    await expect(importJsonArchive("{}", "submitted-user")).rejects.toBe(unauthorized)
    expect(mocks.limit).not.toHaveBeenCalled()
    expect(mocks.database).not.toHaveBeenCalled()
  })
  it.each(operations)("denies %s before database, filesystem, transaction or Sharp work", async (_name, policy, invoke) => {
    await expect(invoke()).rejects.toBe(denied)
    expect(mocks.guard).toHaveBeenCalled()
    expect(mocks.limit).toHaveBeenCalledWith("valid-actor", policy)
    expect(mocks.database).not.toHaveBeenCalled()
    expect(mocks.files).not.toHaveBeenCalled()
    expect(mocks.sharp).not.toHaveBeenCalled()
  })

  it("stops upload decoding when the byte budget is denied after request budget acceptance", async () => {
    mocks.limit.mockResolvedValueOnce(undefined)
    const bytes = Buffer.alloc(1048577)
    Buffer.from([137,80,78,71,13,10,26,10]).copy(bytes)
    await expect(uploadMediaFile(bytes, "image.png", "image/png")).rejects.toBe(denied)
    expect(mocks.limit).toHaveBeenNthCalledWith(2, "valid-actor", "upload-bytes", 2)
    expect(mocks.database).not.toHaveBeenCalled()
    expect(mocks.files).not.toHaveBeenCalled()
    expect(mocks.sharp).not.toHaveBeenCalled()
  })
})
