import { describe, expect, it } from "vitest"
import { unstable_getResponseFromNextConfig } from "next/experimental/testing/server"
import nextConfig from "../../next.config"

describe("baseline response headers", () => {
  it.each(["/", "/en", "/cms-admin", "/admincp/posts", "/studio", "/api/auth/get-session", "/missing-page"])(
    "protects %s while permitting same-origin previews and outgoing popups",
    async (path) => {
      const response = await unstable_getResponseFromNextConfig({
        url: `https://publication.test${path}`, nextConfig,
      })
      expect(response.headers.get("x-content-type-options")).toBe("nosniff")
      expect(response.headers.get("referrer-policy")).toBe("strict-origin-when-cross-origin")
      expect(response.headers.get("x-frame-options")).toBe("SAMEORIGIN")
      expect(response.headers.get("cross-origin-opener-policy")).toBe("same-origin-allow-popups")
      expect(response.headers.has("content-security-policy")).toBe(false)
      const policy = response.headers.get("content-security-policy-report-only") || ""
      expect(policy).toContain("report-uri /api/security/csp-report")
      expect(policy).toContain("object-src 'none'")
      const script = policy.split(";").find((part) => part.trim().startsWith("script-src ")) || ""
      expect(script).toContain("'self'")
      expect(script).not.toMatch(/unsafe-inline|unsafe-eval|https:;|\*/)
      expect(response.headers.has("strict-transport-security")).toBe(false)
    },
  )

  it("keeps the stricter upload policy after the global rules", async () => {
    const response = await unstable_getResponseFromNextConfig({
      url: "https://publication.test/uploads/2026/report.pdf", nextConfig,
    })
    expect(response.headers.get("referrer-policy")).toBe("no-referrer")
    expect(response.headers.get("x-content-type-options")).toBe("nosniff")
    expect(response.headers.get("content-security-policy")).toContain("frame-ancestors 'none'; sandbox")
  })
})
