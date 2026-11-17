import { beforeEach, describe, expect, it, vi } from "vitest"
import type { DB } from "@/db"
vi.mock("server-only", () => ({}))
vi.mock("@/db", () => ({ db: {} }))
const mocks = vi.hoisted(() => ({ guard: vi.fn(), remove: vi.fn() }))
vi.mock("@/lib/authMIddleware", () => ({ verifyPostEditor: mocks.guard }))
vi.mock("@/lib/rate-limit", () => ({ checkCmsRateLimit: vi.fn() }))
vi.mock("@/services/media-object-storage.service", () => ({ deleteS3MediaObjects: mocks.remove }))
import { deleteMediaItems } from "@/services/media-delete.service"
const url = "https://media.example.test/media/pressforge/00000000-0000-4000-8000-000000000001/2026/11/video.mp4"
function databaseWith(shared = false, failCommit = false) {
  const values: unknown[] = [], events: string[] = []
  const storage = { provider: "s3", publicBaseUrl: "https://media.example.test", objects: [url.slice("https://media.example.test/".length), `${url.slice("https://media.example.test/".length)}.poster.jpg`] }
  const responses = [[{ id: BigInt(1) }], [{ id: BigInt(1), key: "_wp_attached_file", value: url }, { id: BigInt(1), key: "_wp_attachment_metadata", value: JSON.stringify({ storage }) }], shared ? [{ file: `${url}.poster.jpg` }] : []]
  const tx = {
    execute: async () => {},
    select: () => {
      const promise = Promise.resolve(responses.shift())
      const chain = { from: () => chain, where: () => chain, for: () => chain, innerJoin: () => chain, then: promise.then.bind(promise) }
      return chain
    },
    insert: () => ({ values: async (value: unknown) => { values.push(value) } }),
    delete: () => ({ where: () => {
      events.push("db-delete")
      const promise = Promise.resolve()
      return { then: promise.then.bind(promise), returning: async () => [{ id: BigInt(1) }] }
    } }),
  }
  const database = { ...tx, transaction: async (fn: (value: typeof tx) => unknown) => { const result = await fn(tx); if (failCommit) throw new Error("commit failed"); events.push("commit"); return result } } as unknown as DB
  mocks.remove.mockImplementation(async () => { events.push("object-delete") })
  return { database, values, events }
}
beforeEach(() => { vi.clearAllMocks(); mocks.guard.mockResolvedValue({ user: { id: "editor" } }) })
describe("S3 deletion recovery", () => {
  it("records cleanup intent in the same DB transaction and removes objects only after commit", async () => {
    const test = databaseWith()
    expect(await deleteMediaItems([1], test.database)).toEqual({ deletedCount: 1 })
    expect(test.values[0]).toMatchObject({ optionName: "cms_media_cleanup_1", autoload: "no" })
    expect(test.events.indexOf("object-delete")).toBeGreaterThan(test.events.indexOf("commit"))
    expect(test.events.at(-1)).toBe("db-delete")
  })
  it("keeps the cleanup intent and reports storage outages without claiming physical deletion", async () => {
    const test = databaseWith()
    mocks.remove.mockRejectedValue(new Error("storage offline"))
    expect(await deleteMediaItems([1], test.database)).toEqual({ deletedCount: 1, cleanupPending: 1 })
    expect(test.values).toHaveLength(1)
    expect(test.events.at(-1)).toBe("commit")
  })
  it("does not delete objects when the DB commit fails or another attachment references a derivative", async () => {
    const failed = databaseWith(false, true)
    await expect(deleteMediaItems([1], failed.database)).rejects.toThrow("commit failed")
    expect(mocks.remove).not.toHaveBeenCalled()
    const shared = databaseWith(true)
    await deleteMediaItems([1], shared.database)
    expect(mocks.remove).not.toHaveBeenCalled()
    expect(shared.values).toEqual([])
  })
})
