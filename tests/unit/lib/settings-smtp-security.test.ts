import { beforeEach, afterEach, describe, expect, it, vi } from "vitest"
const mocks = vi.hoisted(() => ({
  transport: vi.fn(),
  send: vi.fn(),
  options: {} as Record<string, string>,
}))
vi.mock("nodemailer", () => ({ default: { createTransport: mocks.transport } }))
vi.mock("@/services/settings.service", () => ({
  getOptions: async () => mocks.options,
}))
import { sendEmail, sendNewPostNotification } from "@/lib/email"
vi.mock("@/services/language.service", () => ({
  getDefaultLanguage: async () => ({ code: "en", direction: "ltr" }),
}))
beforeEach(() => {
  vi.clearAllMocks()
  mocks.options = {
    smtp_host: "smtp.example.test",
    smtp_user: "user",
    smtp_pass: " password ",
    smtp_port: "587",
    smtp_secure: "tls",
    smtp_from_email: "sender@example.test",
    smtp_from_name: 'Name" <evil@example.test>',
  }
  mocks.transport.mockReturnValue({ sendMail: mocks.send })
  mocks.send.mockResolvedValue({ messageId: "fixture" })
})
afterEach(() => vi.unstubAllEnvs())
const message = {
  to: "reader@example.test",
  subject: "Hello\r\nBcc: injected",
  html: "<p>Hello</p>",
}
describe("SMTP security", () => {
  it("requires STARTTLS, validates certificates and disables file/URL content access", async () => {
    expect((await sendEmail(message)).success).toBe(true)
    expect(mocks.transport).toHaveBeenCalledWith(
      expect.objectContaining({
        secure: false,
        requireTLS: true,
        disableFileAccess: true,
        disableUrlAccess: true,
        tls: { rejectUnauthorized: true, minVersion: "TLSv1.2" },
        auth: { user: "user", pass: " password " },
      })
    )
    expect(mocks.send.mock.lastCall![0].from).toEqual({
      name: mocks.options.smtp_from_name,
      address: "sender@example.test",
    })
    expect(mocks.send.mock.lastCall![0].subject).not.toMatch(/[\r\n]/)
  })
  it("uses implicit TLS when configured", async () => {
    mocks.options.smtp_secure = "ssl"
    mocks.options.smtp_port = "465"
    await sendEmail(message)
    expect(mocks.transport.mock.lastCall![0]).toMatchObject({
      secure: true,
      requireTLS: false,
    })
  })
  it("does not disclose SMTP authentication failures", async () => {
    mocks.send.mockRejectedValue(new Error("secret-password server-response"))
    const log = vi.spyOn(console, "error").mockImplementation(() => {})
    try {
      expect(await sendEmail(message)).toEqual({
        success: false,
        error: "Email delivery failed",
      })
      expect(JSON.stringify(log.mock.calls)).not.toContain("secret-password")
    } finally {
      log.mockRestore()
    }
  })
  it("escapes legacy enabled notification settings and rejects executable links", async () => {
    Object.assign(mocks.options, {
      enable_new_post_notifications: "1",
      admin_email: "admin@example.test",
      blogname: "<img src=x>",
      email_new_post_heading: "<script>alert(1)</script>",
      email_footer_text: "<svg onload=alert(1)>",
    })
    expect(
      (
        await sendNewPostNotification(
          "<img src=x>",
          "https://example.test/post",
          "<b>Author</b>"
        )
      ).success
    ).toBe(true)
    const html = mocks.send.mock.lastCall![0].html
    expect(html).not.toContain("<img")
    expect(html).not.toContain("<script")
    expect(html).not.toContain("<svg")
    mocks.send.mockClear()
    const log = vi.spyOn(console, "error").mockImplementation(() => {})
    try {
      expect(
        (
          await sendNewPostNotification(
            "Title",
            "javascript:alert(1)",
            "Author"
          )
        ).success
      ).toBe(false)
      expect(mocks.send).not.toHaveBeenCalled()
    } finally {
      log.mockRestore()
    }
  })
})
