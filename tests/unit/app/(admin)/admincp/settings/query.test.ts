import { describe, expect, it, vi } from "vitest"
const mocks = vi.hoisted(() => ({ guard: vi.fn().mockResolvedValue({ user: { role: "admin" } }), storage: vi.fn().mockResolvedValue({ enabled: false, credentialsConfigured: true }) }))
vi.mock("@/lib/authMIddleware", () => ({
  verifyAdmin: mocks.guard,
}))
vi.mock("@/services/media-storage.service", () => ({ getMediaStorageAdminView: mocks.storage }))
vi.mock("@/services/settings.service", () => ({
  getAllSettings: async () => ({
    blogname: "Publication",
    smtp_pass: "private-stored-password",
  }),
}))
vi.mock("@/services/page.service", () => ({
  getAllParentPageOptions: async () => [],
}))
vi.mock("@/lib/themes/customizer", () => ({
  getCustomizerData: async () => ({ mods: {} }),
}))
import { getSettingsQuery, getSettingsStorageQuery } from "@/app/(admin)/admincp/settings/query"

describe("settings browser boundary", () => {
  it("keeps stored SMTP passwords out of browser props", async () => {
    const settings = await getSettingsQuery()
    expect(settings.blogname).toBe("Publication")
    expect(settings.smtp_pass).toBe("")
    expect(JSON.stringify(settings)).not.toContain("private-stored-password")
  })
  it("guards storage configuration before accessing its redacted view", async () => {
    expect(await getSettingsStorageQuery()).toEqual({ enabled: false, credentialsConfigured: true })
    mocks.storage.mockClear()
    mocks.guard.mockRejectedValueOnce(new Error("denied"))
    await expect(getSettingsStorageQuery()).rejects.toThrow("denied")
    expect(mocks.storage).not.toHaveBeenCalled()
  })
})
