import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  saveSettingsAction,
  removeSettingsLogoAction,
  selectSettingsLogoAction,
  sendTestEmailAction,
} from "@/app/(admin)/admincp/settings/action"

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  set: vi.fn(),
  remove: vi.fn(),
  select: vi.fn(),
  quota: vi.fn(),
  email: vi.fn(),
}))
vi.mock("@/lib/authMIddleware", () => ({ verifyAdmin: mocks.auth }))
vi.mock("@/services/settings.service", () => ({
  saveAdminSettings: mocks.set,
  reserveSettingsTestEmail: mocks.quota,
}))
vi.mock("@/services/site-logo.service", () => ({
  removeSiteLogo: mocks.remove,
  selectSiteLogo: mocks.select,
}))
vi.mock("@/lib/email", () => ({ sendTestEmail: mocks.email }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
beforeEach(() => {
  vi.clearAllMocks()
  mocks.quota.mockResolvedValue(undefined)
  mocks.email.mockResolvedValue({ success: true })
  mocks.auth.mockResolvedValue({ user: { role: "admin" } })
})
describe("Settings logo isolation", () => {
  it("requires authorization before selecting a library logo", async () => {
    mocks.auth.mockRejectedValue(new Error("unauthorized"))
    await expect(selectSettingsLogoAction("42")).rejects.toThrow("unauthorized")
    expect(mocks.select).not.toHaveBeenCalled()
  })
  it("applies the attachment independently of other settings", async () => {
    mocks.select.mockResolvedValue({ id: "42", url: "/uploads/logo.png" })
    expect(await selectSettingsLogoAction("42")).toEqual({
      success: true,
      logo: { id: "42", url: "/uploads/logo.png" },
    })
    expect(mocks.select).toHaveBeenCalledWith("42")
    expect(mocks.set).not.toHaveBeenCalled()
  })
  it("rejects arbitrary options and invalid values before persisting", async () => {
    expect(
      (await saveSettingsAction({ active_plugins: '["unexpected"]' })).success
    ).toBe(false)
    expect(
      (await saveSettingsAction({ google_analytics_id: "<script>" })).success
    ).toBe(false)
    expect(mocks.set).not.toHaveBeenCalled()
  })
  it("updates the public URL fallback and preserves an unchanged SMTP secret", async () => {
    expect(
      (
        await saveSettingsAction({
          siteurl: "https://news.example",
          smtp_pass: "",
        })
      ).success
    ).toBe(true)
    expect(mocks.set).toHaveBeenCalledWith({
      siteurl: "https://news.example",
      home: "https://news.example",
    })
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
    await expect(removeSettingsLogoAction()).rejects.toThrow("unauthorized")
    expect(mocks.remove).not.toHaveBeenCalled()
  })
  it("removes branding separately from other settings", async () => {
    expect((await removeSettingsLogoAction()).success).toBe(true)
    expect(mocks.remove).toHaveBeenCalledOnce()
    expect(mocks.set).not.toHaveBeenCalled()
  })
})

describe("Settings test email action", () => {
  it("rejects invalid recipients and locale input without sending or reserving quota", async () => {
    expect(
      (await sendTestEmailAction("a@example.test,b@example.test", "en")).success
    ).toBe(false)
    expect(
      (await sendTestEmailAction("a@example.test", "../secret")).success
    ).toBe(false)
    expect(mocks.quota).not.toHaveBeenCalled()
    expect(mocks.email).not.toHaveBeenCalled()
  })
  it("requires authorization before saving settings or sending mail", async () => {
    mocks.auth.mockRejectedValue(new Error("unauthorized"))
    await expect(saveSettingsAction({ blogname: "Changed" })).rejects.toThrow(
      "unauthorized"
    )
    await expect(sendTestEmailAction("a@example.test", "en")).rejects.toThrow(
      "unauthorized"
    )
    expect(mocks.set).not.toHaveBeenCalled()
    expect(mocks.email).not.toHaveBeenCalled()
  })
  it("does not send over-quota mail and reports failures without internal details", async () => {
    mocks.quota.mockRejectedValue(new Error("private quota/database details"))
    expect(await sendTestEmailAction("a@example.test", "en")).toEqual({
      success: false,
      error: "admin.settings.test_email_error",
    })
    expect(mocks.email).not.toHaveBeenCalled()
  })
  it("sends valid test messages in the selected locale", async () => {
    expect((await sendTestEmailAction("a@example.test", "ar")).success).toBe(
      true
    )
    expect(mocks.email).toHaveBeenCalledWith("a@example.test", "ar")
  })
})
