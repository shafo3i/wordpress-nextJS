import { beforeEach, describe, expect, it, vi } from "vitest"
import type { DB } from "@/db"
vi.mock("server-only", () => ({}))
vi.mock("@/db", () => ({ db: {} }))
const mocks = vi.hoisted(() => ({ guard: vi.fn(), editor: vi.fn(), rate: vi.fn(), remove: vi.fn(), encrypt: vi.fn((value: string) => `encrypted:${value}`), decrypt: vi.fn((value: string) => value.replace("encrypted:", "")) }))
vi.mock("@/lib/authMIddleware", () => ({ verifyAdmin: mocks.guard, verifyPostEditor: mocks.editor }))
vi.mock("@/lib/rate-limit", () => ({ checkCmsRateLimit: mocks.rate }))
vi.mock("@/lib/encryption", () => ({ encryptValue: mocks.encrypt, decryptValue: mocks.decrypt }))
vi.mock("@/services/media-object-storage.service", () => ({ deleteS3MediaObjects: mocks.remove }))
import { getMediaStorageAdminView, saveMediaStorage, isS3UploadAvailable, retryMediaStorageCleanup } from "@/services/media-storage.service"
const settings = { enabled: true, endpoint: "https://s3.eu-central-1.wasabisys.com", region: "eu-central-1", bucket: "news-media", prefix: "media", publicBaseUrl: "https://media.example.test" }
function databaseWith(value?: string) {
  let stored = value
  const tx = {
    execute: async () => {},
    select: (selection: Record<string, unknown>) => ({ from: () => ({ where: () => ({ limit: async () => stored ? [selection.id ? { id: BigInt(1) } : { value: stored }] : [] }) }) }),
    insert: () => ({ values: async (row: { optionValue: string }) => { stored = row.optionValue } }),
    update: () => ({ set: (row: { optionValue: string }) => ({ where: async () => { stored = row.optionValue } }) }),
  }
  const database = { ...tx, transaction: async (fn: (value: typeof tx) => unknown) => fn(tx) } as unknown as DB
  return { database, stored: () => stored }
}
beforeEach(() => { vi.clearAllMocks(); mocks.guard.mockResolvedValue({ user: { id: "admin" } }); mocks.editor.mockResolvedValue({ user: { id: "editor" } }) })
describe("media storage configuration", () => {
  it("requires admin permission for reads and mutations before database access", async () => {
    mocks.guard.mockRejectedValue(new Error("denied"))
    await expect(getMediaStorageAdminView({} as DB)).rejects.toThrow("denied")
    await expect(saveMediaStorage({}, {} as DB)).rejects.toThrow("denied")
    expect(mocks.encrypt).not.toHaveBeenCalled()
  })
  it("encrypts both credentials, redacts browser responses and preserves blank credentials", async () => {
    const test = databaseWith()
    const view = await saveMediaStorage({ settings, accessKeyId: "private-id", secretAccessKey: "private-secret" }, test.database)
    expect(test.stored()).toContain("encrypted:private-id")
    expect(test.stored()).toContain("encrypted:private-secret")
    expect(JSON.stringify(view)).not.toContain("private-")
    expect(view.credentialsConfigured).toBe(true)
    await saveMediaStorage({ settings: { ...settings, prefix: "other" } }, test.database)
    expect(mocks.encrypt).toHaveBeenCalledTimes(2)
    expect(test.stored()).toContain("encrypted:private-secret")
    expect(await isS3UploadAvailable(test.database)).toBe(true)
  })
  it("keeps unconfigured installations usable locally and rejects enabling without credentials", async () => {
    const test = databaseWith()
    expect(await isS3UploadAvailable(test.database)).toBe(false)
    await expect(saveMediaStorage({ settings }, test.database)).rejects.toThrow("credentials_required")
    expect(test.stored()).toBeUndefined()
    expect((await getMediaStorageAdminView(test.database)).enabled).toBe(false)
  })
  it("retries a bounded cleanup batch and retains invalid or failed records", async () => {
    const deleted: unknown[] = []
    const limit = vi.fn().mockResolvedValue([{ id: BigInt(1), value: "invalid" }, { id: BigInt(2), value: JSON.stringify({ storage: { provider: "s3" }, url: "https://media.example.test/file.jpg" }) }])
    const database = { select: () => ({ from: () => ({ where: () => ({ orderBy: () => ({ limit }) }) }) }), delete: () => ({ where: async (condition: unknown) => { deleted.push(condition) } }) } as unknown as DB
    expect(await retryMediaStorageCleanup(database)).toEqual({ completed: 1, failed: 1 })
    expect(limit).toHaveBeenCalledWith(20)
    expect(deleted).toHaveLength(1)
    expect(mocks.remove).toHaveBeenCalledTimes(1)
  })
})
