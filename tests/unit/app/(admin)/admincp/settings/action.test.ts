import { beforeEach, describe, expect, it, vi } from "vitest"
import { saveSettingsAction, removeSettingsLogoAction } from "@/app/(admin)/admincp/settings/action"

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  set: vi.fn(),
  remove: vi.fn(),
}))
vi.mock("@/lib/authMIddleware", () => ({ verifyAdminOrEditor: mocks.auth }))
vi.mock("@/services/settings.service", () => ({ setOptions: mocks.set }))
vi.mock("@/services/site-logo.service", () => ({
  removeSiteLogo: mocks.remove,
}))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
beforeEach(() => {
  vi.clearAllMocks()
  mocks.auth.mockResolvedValue({ user: { role: "editor" } })
})
describe("Settings logo isolation", () => {
  it("rejects arbitrary options and invalid values before persisting", async () => {
    expect((await saveSettingsAction({ active_plugins: '["unexpected"]' })).success).toBe(false)
    expect((await saveSettingsAction({ google_analytics_id: "<script>" })).success).toBe(false)
    expect(mocks.set).not.toHaveBeenCalled()
  })
  it("updates the public URL fallback and preserves an unchanged SMTP secret", async () => {
    expect((await saveSettingsAction({ siteurl: "https://news.example", smtp_pass: "" })).success).toBe(true)
    expect(mocks.set).toHaveBeenCalledWith({ siteurl: "https://news.example", home: "https://news.example" })
  })
  it("does not overwrite a newer logo from stale general-form state", async () => {
    expect(
      (
        await saveSettingsAction({
          blogname: "Updated site",
          site_logo_id: "stale",
        })
      ).success
    ).toBe(true)
    expect(mocks.set).toHaveBeenCalledWith({ blogname: "Updated site" })
  })
  it("requires authorization before removing a logo", async () => {
    mocks.auth.mockRejectedValue(new Error("unauthorized"))
    expect((await removeSettingsLogoAction()).success).toBe(false)
    expect(mocks.remove).not.toHaveBeenCalled()
  })
  it("removes branding separately from other settings", async () => {
    expect((await removeSettingsLogoAction()).success).toBe(true)
    expect(mocks.remove).toHaveBeenCalledOnce()
    expect(mocks.set).not.toHaveBeenCalled()
  })
})
