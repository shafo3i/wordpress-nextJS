import { beforeEach, describe, expect, it, vi } from "vitest"
const mocks = vi.hoisted(() => ({
  send: vi.fn(),
  settings: {} as Record<string, string>,
}))
vi.mock("nodemailer", () => ({
  default: { createTransport: () => ({ sendMail: mocks.send }) },
}))
vi.mock("@/services/settings.service", () => ({
  getOptions: async () => mocks.settings,
}))
vi.mock("@/services/language.service", () => ({
  getDefaultLanguage: async () => ({ code: "ar", direction: "rtl" }),
  getActiveLanguages: async () => [
    { code: "ar", direction: "rtl" },
    { code: "en", direction: "ltr" },
  ],
  getTranslations: async (code: string) =>
    (await import(`../../../templates/language/${code}.json`)).default,
}))
import { sendNewsletterWelcomeEmail, sendTestEmail } from "@/lib/email"
import { localizedEmailTemplates } from "@/lib/email-template-settings"
import { settingsPatchSchema } from "@/db/schema/cms-settings"

beforeEach(() => {
  vi.clearAllMocks()
  mocks.send.mockResolvedValue({ messageId: "fixture" })
  mocks.settings = {
    blogname: "Publication",
    smtp_host: "mail.test",
    smtp_user: "fixture",
    smtp_pass: "fixture",
    smtp_from_email: "sender@example.test",
    enable_newsletter_notifications: "1",
    email_welcome_subject: "Default custom subject",
    email_welcome_heading: "Default custom heading",
    email_template_translations: JSON.stringify({
      en: {
        email_welcome_subject: "Hello {{name}} from {{siteName}}",
        email_welcome_body: "Custom English body for {{name}}",
      },
    }),
  }
})
describe("email language and delivery boundary", () => {
  it("uses translated defaults when no wording has been authored", async () => {
    mocks.settings.email_welcome_subject = ""
    mocks.settings.email_welcome_heading = ""
    await sendNewsletterWelcomeEmail("reader@example.test", "Reader", "ar")
    expect(mocks.send.mock.lastCall![0].subject).toMatch(/\p{Script=Arabic}/u)
  })

  it("renders custom English newsletter wording without mixing default-language content", async () => {
    expect(
      (
        await sendNewsletterWelcomeEmail(
          "reader@example.test",
          "<img src=x>",
          "en"
        )
      ).success
    ).toBe(true)
    const mail = mocks.send.mock.lastCall![0]
    expect(mail.html).toContain('lang="en"')
    expect(mail.html).toContain("Custom English body")
    expect(mail.html).not.toContain("<img")
    expect(mail.html).not.toContain("Default custom heading")
  })
  it("retains authored default-language wording", async () => {
    await sendNewsletterWelcomeEmail("reader@example.test", "Reader", "ar")
    expect(mocks.send.mock.lastCall![0].subject).toBe("Default custom subject")
    expect(mocks.send.mock.lastCall![0].html).toContain('dir="rtl"')
  })
  it("uses selected language for test mail", async () => {
    await sendTestEmail("reader@example.test", "en")
    expect(mocks.send.mock.lastCall![0].html).toContain('lang="en"')
    await sendTestEmail("reader@example.test", "ar")
    expect(mocks.send.mock.lastCall![0].html).toContain('lang="ar"')
  })
  it("does not send disabled welcome messages or falsely report SMTP failures", async () => {
    mocks.settings.enable_newsletter_notifications = "0"
    expect(
      (await sendNewsletterWelcomeEmail("reader@example.test", "Reader", "en"))
        .success
    ).toBe(false)
    expect(mocks.send).not.toHaveBeenCalled()
    mocks.settings.enable_newsletter_notifications = "1"
    mocks.send.mockRejectedValue(new Error("SMTP rejected"))
    expect(
      (await sendNewsletterWelcomeEmail("reader@example.test", "Reader", "en"))
        .success
    ).toBe(false)
  })
  it("rejects invalid per-language settings and never borrows another language's authored copy", () => {
    expect(
      settingsPatchSchema.safeParse({
        email_template_translations: '{"en":{"script":"bad"}}',
      }).success
    ).toBe(false)
    expect(
      settingsPatchSchema.safeParse({
        email_template_translations: mocks.settings.email_template_translations,
      }).success
    ).toBe(true)
    expect(
      localizedEmailTemplates(
        { email_welcome_body: "Default", email_template_translations: "{}" },
        "en",
        "ar"
      )
    ).toEqual({})
  })
})
