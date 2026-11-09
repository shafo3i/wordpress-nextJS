import { beforeEach, describe, expect, it, vi } from "vitest"
const mocks = vi.hoisted(() => ({ send: vi.fn(), language: vi.fn() }))
vi.mock("@/lib/email", () => ({ sendEmail: mocks.send }))
vi.mock("@/services/settings.service", () => ({
  getOptions: async () => ({
    blogname: "Site",
    blogdescription: "",
    site_identity_translations: JSON.stringify({
      en: { title: "English publication" },
    }),
  }),
}))
vi.mock("@/services/language.service", async () => ({
  getDefaultLanguage: mocks.language,
  getActiveLanguages: async () => [
    { code: "ar", direction: "rtl" },
    { code: "en", direction: "ltr" },
  ],
  getTranslations: async (code: string) =>
    (await import(`../../../templates/language/${code}.json`)).default,
}))
import { sendAuthEmail } from "@/lib/auth-email"

describe("authentication email delivery", () => {
  it.each(["reset", "verify", "magic", "otp", "existing"] as const)(
    "sends %s in the requested language and preserves tokens",
    async (kind) => {
      for (const locale of ["en", "ar"]) {
        await sendAuthEmail(
          kind,
          "fixture@example.test",
          kind === "otp" ? "123456" : "https://site.test/action?token=fixture",
          "<img src=x onerror=alert(1)>",
          "",
          {
            request: new Request("https://site.test/api/auth", {
              headers: {
                cookie: `site_lang=${locale}; admin_lang=${locale === "en" ? "ar" : "en"}`,
              },
            }),
          }
        )
        const message = mocks.send.mock.lastCall![0]
        expect(message.html).toContain(`lang="${locale}"`)
        expect(message.html).toContain(
          `dir="${locale === "ar" ? "rtl" : "ltr"}"`
        )
        expect(message.html).not.toContain("<img")
        if (locale === "en")
          expect(message.subject).toContain("English publication")
        if (kind !== "otp") {
          const link = new URL(
            message.text.match(/https:\/\/site\.test\/[^\s]+/)![0]
          )
          expect(link.searchParams.get("token")).toBe("fixture")
          expect(link.searchParams.get("lang")).toBe(locale)
        } else expect(message.html).toContain("123456")
      }
    }
  )
  it("uses a link language without a request and ignores inactive language hints", async () => {
    await sendAuthEmail(
      "verify",
      "fixture@example.test",
      "https://site.test/verify?token=t&callbackURL=%2Femail-verified%3Flang%3Den"
    )
    expect(mocks.send.mock.lastCall![0].html).toContain('lang="en"')
    await sendAuthEmail("otp", "fixture@example.test", "123456", "", "", {
      locale: "invalid",
    })
    expect(mocks.send.mock.lastCall![0].html).toContain('lang="ar"')
  })

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
