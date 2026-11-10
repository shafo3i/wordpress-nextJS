import { describe, it, expect } from "vitest"
import {
  newsletterTokenHash,
  unsubscribeToken,
  validUnsubscribeToken,
} from "@/lib/newsletter/tokens"
import { newsletterSubscribeSchema } from "@/db/schema/cms-newsletter"
import {
  readNewsletterBody,
  newsletterOriginAllowed,
} from "@/lib/newsletter/request"
describe("newsletter boundaries", () => {
  it("binds unsubscribe signatures to subscriber identity and secret", () => {
    const token = unsubscribeToken("one", "test-secret")
    expect(validUnsubscribeToken("one", token, "test-secret")).toBe(true)
    expect(validUnsubscribeToken("two", token, "test-secret")).toBe(false)
    expect(validUnsubscribeToken("one", token, "other-secret")).toBe(false)
    expect(validUnsubscribeToken("one", "invalid", "test-secret")).toBe(false)
    expect(newsletterTokenHash(token)).not.toBe(token)
  })
  it("normalizes email and bounds input", () => {
    expect(
      newsletterSubscribeSchema.parse({ email: " Reader@Example.org " }).email
    ).toBe("reader@example.org")
    expect(newsletterSubscribeSchema.safeParse({ email: "bad" }).success).toBe(
      false
    )
    expect(
      newsletterSubscribeSchema.safeParse({
        email: "a@example.org",
        name: "x".repeat(151),
      }).success
    ).toBe(false)
  })
  it("rejects cross-origin browser requests and oversized bodies", async () => {
    expect(
      newsletterOriginAllowed(
        new Request("https://site.test/api/newsletter/subscribe", {
          headers: { origin: "https://evil.test" },
        })
      )
    ).toBe(false)
    await expect(
      readNewsletterBody(
        new Request("https://site.test", {
          method: "POST",
          body: "x".repeat(4097),
        })
      )
    ).rejects.toThrow("too_large")
  })
})
