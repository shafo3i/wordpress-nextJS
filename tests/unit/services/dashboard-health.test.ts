import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  guard: vi.fn(),
  execute: vi.fn(),
  access: vi.fn(),
  statfs: vi.fn(),
  inventory: vi.fn(),
}))
vi.mock("server-only", () => ({}))
vi.mock("@/lib/authMIddleware", () => ({ verifyAdmin: mocks.guard }))
vi.mock("@/db", () => ({ db: { execute: mocks.execute } }))
vi.mock("node:fs/promises", () => ({
  default: {
    access: mocks.access,
    statfs: mocks.statfs,
    constants: { W_OK: 2 },
  },
}))
vi.mock("@/services/media-tools.service", () => ({
  getMediaOverviewStats: mocks.inventory,
  getStoredStorageInventory: async () => null,
}))
import { getSiteHealthData } from "@/services/database-maintenance.service"

beforeEach(() => {
  vi.clearAllMocks()
  mocks.guard.mockResolvedValue({ user: { role: "admin" } })
  mocks.execute.mockResolvedValue({ rows: [] })
  mocks.access.mockResolvedValue(undefined)
  mocks.statfs.mockResolvedValue({ bavail: 1024, bsize: 1024, blocks: 2048 })
  mocks.inventory.mockResolvedValue({
    uploadsDirWritable: true,
    physicalFilesCount: 42000,
    totalDiskUsageBytes: 1024,
  })
})

describe("Dashboard health without a recursive upload inventory", () => {
  it("does not start an inventory even if that inventory would stall", async () => {
    mocks.inventory.mockImplementation(() => new Promise(() => {}))
    const result = await getSiteHealthData({ includeStorageInventory: false })
    expect(mocks.inventory).not.toHaveBeenCalled()
    expect(mocks.access).toHaveBeenCalledTimes(2)
    expect(result.storage).toMatchObject({
      exists: true,
      writable: true,
      fileCount: null,
      totalSize: null,
    })
  })

  it("does not scan on an ordinary Site Health request", async () => {
    const result = await getSiteHealthData()
    expect(mocks.inventory).not.toHaveBeenCalled()
    expect(result.storage.diskFree).toBe("1 MB")
    expect(result.storage.diskTotal).toBe("2 MB")
  })

  it("keeps the full accurate inventory for an explicit manual scan", async () => {
    const result = await getSiteHealthData({ includeStorageInventory: true })
    expect(mocks.inventory).toHaveBeenCalledOnce()
    expect(mocks.inventory).toHaveBeenCalledWith({ scanFiles: true })
    expect(result.storage.fileCount).toBe(42000)
    expect(result.storage.totalSize).toBe("1 KB")
  })

  it("reports non-writable storage without performing a scan", async () => {
    mocks.access
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(
        Object.assign(new Error("Denied"), { code: "EACCES" })
      )
    const result = await getSiteHealthData({ includeStorageInventory: false })
    expect(result.storage.exists).toBe(true)
    expect(result.storage.writable).toBe(false)
    expect(result.storage.fileCount).toBeNull()
    expect(mocks.inventory).not.toHaveBeenCalled()
  })

  it("denies access before diagnostics or filesystem work", async () => {
    mocks.guard.mockRejectedValue(new Error("Unauthorized"))
    await expect(
      getSiteHealthData({ includeStorageInventory: false })
    ).rejects.toThrow("Unauthorized")
    expect(mocks.execute).not.toHaveBeenCalled()
    expect(mocks.access).not.toHaveBeenCalled()
    expect(mocks.inventory).not.toHaveBeenCalled()
  })

  it("does not fall back to an inventory when disk capacity is unavailable", async () => {
    mocks.statfs.mockRejectedValue(new Error("Unsupported filesystem"))
    const result = await getSiteHealthData()
    expect(result.storage.diskFree).toBeNull()
    expect(result.storage.diskTotal).toBeNull()
    expect(result.storage.writable).toBe(true)
    expect(mocks.inventory).not.toHaveBeenCalled()
  })
})
