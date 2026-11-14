import { beforeEach, describe, it, expect, vi } from "vitest"
const mocks = vi.hoisted(() => ({
  confirm: vi.fn(),
  unsubscribe: vi.fn(),
  welcome: vi.fn(),
}))
vi.mock("@/lib/newsletter/db", () => ({
  confirmNewsletterSubscriber: mocks.confirm,
  unsubscribeNewsletterSubscriber: mocks.unsubscribe,
}))
vi.mock("@/lib/newsletter/email", () => ({
  sendConfirmedNewsletterWelcome: mocks.welcome,
}))
vi.mock("@/lib/email-language", () => ({
  getEmailLanguage: async () => ({
    code: "en",
    direction: "ltr",
    dict: {
      "site.newsletter.confirm": "Confirm",
      "site.newsletter.confirmed": "Confirmed",
      "site.newsletter.unsubscribe": "Unsubscribe",
      "site.newsletter.unsubscribed": "Unsubscribed",
      "site.newsletter.invalid_token": "Invalid",
    },
  }),
}))
import {
  GET as confirmationPage,
  POST as confirm,
} from "@/app/api/newsletter/confirm/route"
import {
  GET as unsubscribePage,
  POST as unsubscribe,
} from "@/app/api/newsletter/unsubscribe/route"
import { unsubscribeToken } from "@/lib/newsletter/tokens"
const token = "a".repeat(43),
  id = "c83a61a1-f5dd-4c5d-b061-c4c3412cfac3"
beforeEach(() => {
  vi.clearAllMocks()
  mocks.welcome.mockResolvedValue({ success: true })
  vi.stubEnv("BETTER_AUTH_SECRET", "newsletter-test-secret")
  mocks.confirm.mockResolvedValue({
    id,
    email: "reader@example.org",
    name: "Reader",
    locale: "en",
  })
})
describe("newsletter confirmation and unsubscribe", () => {
  it("GET links never change subscriptions or send email", async () => {
    const response = await confirmationPage(
      new Request(`https://site.test/api/newsletter/confirm?token=${token}`)
    )
    expect(await response.text()).toContain('method="post"')
    expect(response.headers.get("referrer-policy")).toBe("same-origin")
    await unsubscribePage(
      new Request("https://site.test/api/newsletter/unsubscribe")
    )
    expect(mocks.confirm).not.toHaveBeenCalled()
    expect(mocks.unsubscribe).not.toHaveBeenCalled()
    expect(mocks.welcome).not.toHaveBeenCalled()
  })
  it("confirms once, rejects replay, and does not send a duplicate welcome", async () => {
    const url = `https://site.test/api/newsletter/confirm?token=${token}`
    expect((await confirm(new Request(url, { method: "POST" }))).status).toBe(
      200
    )
    mocks.confirm.mockResolvedValueOnce(null)
    expect((await confirm(new Request(url, { method: "POST" }))).status).toBe(
      400
    )
    expect(mocks.welcome).toHaveBeenCalledTimes(1)
  })
  it("accepts the same-origin browser confirmation and rejects opaque origins", async () => {
    const url = `https://site.test/api/newsletter/confirm?token=${token}&lang=ar`
    expect(
      (
        await confirm(
          new Request(url, {
            method: "POST",
            headers: { origin: "https://site.test" },
          })
        )
      ).status
    ).toBe(200)
    mocks.confirm.mockClear()
    expect(
      (
        await confirm(
          new Request(url, {
            method: "POST",
            headers: { origin: "null" },
          })
        )
      ).status
    ).toBe(403)
    expect(mocks.confirm).not.toHaveBeenCalled()
  })
  it("requires a subscriber-bound signature and rejects cross-origin POST", async () => {
    const bad = `https://site.test/api/newsletter/unsubscribe?id=${id}&token=${token}`
    expect(
      (await unsubscribe(new Request(bad, { method: "POST" }))).status
    ).toBe(400)
    expect(mocks.unsubscribe).not.toHaveBeenCalled()
    const url = `https://site.test/api/newsletter/unsubscribe?id=${id}&token=${unsubscribeToken(id)}`
    expect(
      (
        await unsubscribe(
          new Request(url, {
            method: "POST",
            headers: { origin: "https://evil.test" },
          })
        )
      ).status
    ).toBe(403)
    expect(
      (await unsubscribe(new Request(url, { method: "POST" }))).status
    ).toBe(200)
    expect(mocks.unsubscribe).toHaveBeenCalledWith(id)
  })
})

it("hardens token pages against embedding and injected base URLs", async () => {
  const result = await confirmationPage(
    new Request("https://site.test/api/newsletter/confirm")
  )
  expect(result.headers.get("content-security-policy")).toContain(
    "base-uri 'none'"
  )
  expect(result.headers.get("cross-origin-opener-policy")).toBe("same-origin")
  expect(result.headers.get("x-frame-options")).toBe("DENY")
  expect(result.headers.get("cache-control")).toBe("no-store")
})
it("rejects cross-site POSTs even when Origin is missing", async () => {
  const result = await confirm(
    new Request("https://site.test/api/newsletter/confirm?token=" + token, {
      method: "POST",
      headers: { "sec-fetch-site": "cross-site" },
    })
  )
  expect(result.status).toBe(403)
  expect(mocks.confirm).not.toHaveBeenCalled()
})
it("fails safely when the unsubscribe signing secret is unavailable", async () => {
  vi.stubEnv("BETTER_AUTH_SECRET", "")
  const result = await unsubscribe(
    new Request(
      `https://site.test/api/newsletter/unsubscribe?id=${id}&token=${token}`,
      { method: "POST" }
    )
  )
  expect(result.status).toBe(503)
  expect(mocks.unsubscribe).not.toHaveBeenCalled()
})
