import { beforeEach, describe, expect, it, vi } from "vitest"
const mocks = vi.hoisted(() => ({
  add: vi.fn(),
  send: vi.fn(),
  allowed: vi.fn(),
  after: vi.fn(),
}))
vi.mock("next/server", () => ({ after: mocks.after }))
vi.mock("@/lib/newsletter/db", () => ({
  addNewsletterSubscriber: mocks.add,
  newsletterRequestAllowed: mocks.allowed,
}))
vi.mock("@/lib/newsletter/email", () => ({
  sendNewsletterConfirmation: mocks.send,
}))
vi.mock("@/services/plugin.service", () => ({
  getActivePluginSlugs: async () => ["newsletter"],
}))
vi.mock("@/lib/plugins/config", () => ({
  getPluginConfig: async () => ({ sendWelcomeEmail: true }),
}))
vi.mock("@/services/settings.service", () => ({
  getOptions: async () => ({ blogname: "Site" }),
}))
vi.mock("@/services/language.service", () => ({
  getDefaultLanguage: async () => ({ code: "ar", direction: "rtl" }),
  getActiveLanguages: async () => [
    { code: "ar", direction: "rtl" },
    { code: "en", direction: "ltr" },
  ],
  getTranslations: async () => ({}),
}))
import { POST } from "@/app/api/newsletter/subscribe/route"
beforeEach(() => {
  vi.clearAllMocks()
  mocks.allowed.mockResolvedValue(true)
  mocks.add.mockResolvedValue({
    success: true,
    alreadySubscribed: false,
    confirmationToken: "token",
  })
  mocks.send.mockResolvedValue({ success: true })
})
describe("newsletter email language", () => {
  it("stores the validated language and sends confirmation rather than a welcome email", async () => {
    const response = await POST(
      new Request("https://site.test/api/newsletter/subscribe", {
        method: "POST",
        body: JSON.stringify({
          email: "reader@example.test",
          name: "Reader",
          locale: "en",
        }),
      })
    )
    expect(response.status).toBe(200)
    expect(mocks.add).toHaveBeenCalledWith(
      "reader@example.test",
      expect.objectContaining({ locale: "en" })
    )
    expect(mocks.send).not.toHaveBeenCalled()
    await mocks.after.mock.calls[0][0]()
    expect(mocks.send).toHaveBeenCalledWith(
      "reader@example.test",
      "token",
      "en"
    )
  })
  it("rejects an inactive language hint and avoids duplicate welcome emails", async () => {
    mocks.add.mockResolvedValue({ success: true, alreadySubscribed: true })
    await POST(
      new Request("https://site.test/api/newsletter/subscribe", {
        method: "POST",
        headers: { cookie: "site_lang=en" },
        body: JSON.stringify({
          email: "reader@example.test",
          locale: "inactive",
        }),
      })
    )
    expect(mocks.add).toHaveBeenCalledWith(
      "reader@example.test",
      expect.objectContaining({ locale: "en" })
    )
    expect(mocks.send).not.toHaveBeenCalled()
  })
})
