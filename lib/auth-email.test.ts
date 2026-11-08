import { beforeEach, describe, expect, it, vi } from "vitest"
const mocks = vi.hoisted(() => ({ send: vi.fn(), language: vi.fn() }))
vi.mock("@/lib/email", () => ({ sendEmail: mocks.send }))
vi.mock("@/services/settings.service", () => ({
  getOption: async () => "Site",
}))
vi.mock("@/services/language.service", async () => ({
  getDefaultLanguage: mocks.language,
  getTranslations: async (code: string) =>
    (await import(`../templates/language/${code}.json`)).default,
}))
import { sendAuthEmail } from "./auth-email"

describe("authentication email delivery", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.language.mockResolvedValue({ code: "ar", direction: "rtl" })
    mocks.send.mockResolvedValue({ success: true })
  })
  it("uses the site language and escapes user supplied names", async () => {
    await sendAuthEmail(
      "reset",
      "fixture@example.test",
      "https://site.test/password-reset?token=fixture",
      "<script>alert(1)</script>"
    )
    const message = mocks.send.mock.calls[0][0]
    expect(message.subject).toMatch(/\p{Script=Arabic}/u)
    expect(message.html).toContain('dir="rtl"')
    expect(message.html).not.toContain("<script>")
  })
  it("does not silently report success when SMTP delivery fails", async () => {
    mocks.send.mockResolvedValue({ success: false })
    await expect(
      sendAuthEmail("verify", "fixture@example.test", "https://site.test/link")
    ).rejects.toThrow("delivery failed")
  })
})
