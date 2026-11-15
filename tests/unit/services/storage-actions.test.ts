vi.mock("@/lib/rate-limit", async (load) => ({
  ...await load<typeof import("@/lib/rate-limit")>(),
  checkCmsRateLimit: vi.fn().mockResolvedValue({ success: true, remaining: 1, retryAfter: 0 }),
}))
vi.mock("server-only", () => ({}))
import { beforeEach, expect, it, vi } from "vitest"
const mocks = vi.hoisted(() => ({
  guard: vi.fn(),
  health: vi.fn(),
  media: vi.fn(),
}))
vi.mock("@/lib/authMIddleware", () => ({ verifyAdmin: mocks.guard }))
vi.mock("@/components/admin/admin-shell", () => ({
  getAdminLanguageContext: async () => ({
    dict: { "admin.tools.error.failed": "Safe failure" },
  }),
}))
vi.mock("@/services/database-maintenance.service", () => ({
  getSiteHealthData: mocks.health,
}))
vi.mock("@/services/media-tools.service", () => ({
  getMediaOverviewStats: mocks.media,
}))
vi.mock("next/navigation", () => ({ unstable_rethrow: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
import {
  fetchSiteHealthAction,
  scanSiteStorageAction,
} from "@/app/(admin)/admincp/tools/site-health/actions"
import { getMediaStatsAction } from "@/app/(admin)/admincp/tools/media/actions"
beforeEach(() => {
  vi.clearAllMocks()
  mocks.guard.mockResolvedValue({ user: { role: "admin" } })
  mocks.health.mockResolvedValue({})
  mocks.media.mockResolvedValue({})
})
it("keeps ordinary refresh separate from an explicit storage scan", async () => {
  await fetchSiteHealthAction()
  expect(mocks.health).toHaveBeenCalledWith()
  await scanSiteStorageAction()
  expect(mocks.health).toHaveBeenLastCalledWith({
    includeStorageInventory: true,
  })
  await getMediaStatsAction()
  expect(mocks.media).toHaveBeenCalledWith({ scanFiles: true })
})
it("rejects manual scans before diagnostics when authorization fails", async () => {
  mocks.guard.mockRejectedValue(new Error("Unauthorized"))
  await expect(scanSiteStorageAction()).rejects.toThrow("Unauthorized")
  await expect(getMediaStatsAction()).rejects.toThrow("Unauthorized")
  expect(mocks.health).not.toHaveBeenCalled()
  expect(mocks.media).not.toHaveBeenCalled()
})
it("returns safe errors rather than scan paths or database details", async () => {
  mocks.health.mockRejectedValue(new Error("private storage path"))
  expect(await scanSiteStorageAction()).toEqual({
    success: false,
    error: "Safe failure",
  })
})
