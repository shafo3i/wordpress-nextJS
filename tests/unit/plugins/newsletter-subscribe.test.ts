import { beforeEach, describe, expect, it, vi } from "vitest"
const mocks = vi.hoisted(() => ({
  active: vi.fn(),
  allowed: vi.fn(),
  add: vi.fn(),
  send: vi.fn(),
  after: vi.fn(),
}))
vi.mock("next/server", () => ({ after: mocks.after }))
vi.mock("@/services/plugin.service", () => ({
  getActivePluginSlugs: mocks.active,
}))
vi.mock("@/lib/newsletter/db", () => ({
  newsletterRequestAllowed: mocks.allowed,
  addNewsletterSubscriber: mocks.add,
}))
vi.mock("@/lib/newsletter/email", () => ({
  sendNewsletterConfirmation: mocks.send,
}))
vi.mock("@/lib/email-language", () => ({
  getEmailLanguage: async () => ({
    code: "en",
    dict: { "site.newsletter.check_email": "Check your email" },
  }),
}))
import { POST } from "@/app/api/newsletter/subscribe/route"
beforeEach(() => {
  vi.clearAllMocks()
  mocks.active.mockResolvedValue(["newsletter"])
  mocks.allowed.mockResolvedValue(true)
  mocks.add.mockResolvedValue({ confirmationToken: "a".repeat(43) })
  mocks.send.mockResolvedValue({ success: true })
})
const request = (input: unknown, headers: Record<string, string> = {}) =>
  new Request("https://site.test/api/newsletter/subscribe", {
    method: "POST",
    headers,
    body: JSON.stringify(input),
  })
describe("public newsletter subscription boundary", () => {
  it("returns the same response without waiting for conditional SMTP delivery", async () => {
    const fresh = await POST(
      request({ email: "reader@example.test", locale: "en" })
    )
    expect(fresh.status).toBe(200)
    expect(mocks.send).not.toHaveBeenCalled()
    expect(mocks.after).toHaveBeenCalledOnce()
    await mocks.after.mock.calls[0][0]()
    expect(mocks.send).toHaveBeenCalledWith(
      "reader@example.test",
      "a".repeat(43),
      "en"
    )
    const body = await fresh.json()
    mocks.add.mockResolvedValue({ confirmationToken: null })
    const active = await POST(request({ email: "reader@example.test" }))
    expect(await active.json()).toEqual(body)
    expect(active.headers.get("cache-control")).toBe("no-store")
  })
  it("rejects cross-site browser requests before reading or writing subscribers", async () => {
    expect(
      (
        await POST(
          request(
            { email: "reader@example.test" },
            { "sec-fetch-site": "cross-site" }
          )
        )
      ).status
    ).toBe(403)
    expect(mocks.add).not.toHaveBeenCalled()
  })
  it("rejects invalid, overlarge, disabled and rate-limited requests without email", async () => {
    expect((await POST(request({ email: "not an email" }))).status).toBe(400)
    expect(
      (
        await POST(
          request({ email: "reader@example.test", name: "x".repeat(5000) })
        )
      ).status
    ).toBe(413)
    mocks.active.mockResolvedValue([])
    expect((await POST(request({ email: "reader@example.test" }))).status).toBe(
      403
    )
    mocks.active.mockResolvedValue(["newsletter"])
    mocks.allowed.mockResolvedValue(false)
    expect((await POST(request({ email: "reader@example.test" }))).status).toBe(
      429
    )
    expect(mocks.add).not.toHaveBeenCalled()
    expect(mocks.after).not.toHaveBeenCalled()
  })
  it("ignores honeypot submissions without state or email changes", async () => {
    expect(
      (await POST(request({ email: "reader@example.test", website: "bot" })))
        .status
    ).toBe(200)
    expect(mocks.add).not.toHaveBeenCalled()
    expect(mocks.after).not.toHaveBeenCalled()
  })
})
