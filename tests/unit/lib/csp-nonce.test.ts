import { describe, expect, it, vi, afterEach } from "vitest"
import { NextRequest } from "next/server"
import { proxy } from "@/proxy"
import { buildReportOnlyCsp, createCspNonce } from "@/lib/security/csp"
afterEach(() => vi.unstubAllGlobals())
describe("report-only nonce CSP", () => {
  it("generates unpredictable 128-bit nonces and rejects malformed policy input", () => {
    const values = Array.from({ length: 30 }, createCspNonce)
    expect(new Set(values).size).toBe(30)
    for (const value of values)
      expect(Buffer.from(value, "base64").byteLength).toBe(16)
    expect(() => buildReportOnlyCsp("bad'; script-src *")).toThrow()
  })
  it("uses a strict production script policy while retaining editable styles and local fonts", () => {
    const policy = buildReportOnlyCsp(createCspNonce())
    expect(policy).toContain("'strict-dynamic'")
    expect(policy).not.toMatch(
      /unsafe-inline.*script|unsafe-eval|fonts\.googleapis|fonts\.gstatic/
    )
    expect(policy).toContain("style-src 'self' 'unsafe-inline'")
    expect(policy).toContain("font-src 'self' data:")
    expect(policy).toContain("object-src 'none'")
    expect(policy).toContain("script-src-attr 'none'")
    expect(policy).toContain("frame-ancestors 'self'")
    expect(policy).toContain("report-uri /api/security/csp-report")
    expect(buildReportOnlyCsp(createCspNonce(), true)).toContain(
      "'unsafe-eval'"
    )
  })
  it.each([
    "/",
    "/admincp/posts",
    "/admincp/studio/1",
    "/cms-admin",
    "/customize-preview?theme=pressforge-newsroom",
  ])(
    "replaces untrusted request CSP/nonce and sends only diagnostics for %s",
    async (path) => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(Response.json({ matched: false }))
      )
      const request = () =>
        new NextRequest(`https://site.test${path}`, {
          headers: {
            "x-nonce": "attacker",
            "content-security-policy": "script-src 'nonce-attacker'",
            "content-security-policy-report-only": "script-src *",
          },
        })
      const first = await proxy(request())
      const nonce = first.headers.get("x-middleware-request-x-nonce")!
      expect(nonce).not.toBe("attacker")
      const policy = first.headers.get("content-security-policy-report-only")!
      expect(policy).toContain(`'nonce-${nonce}'`)
      expect(
        first.headers.get("x-middleware-request-content-security-policy")
      ).toBe(policy)
      expect(first.headers.has("content-security-policy")).toBe(false)
      expect(first.headers.get("cache-control")).toContain("no-store")
      expect(
        (await proxy(request())).headers.get("x-middleware-request-x-nonce")
      ).not.toBe(nonce)
    }
  )
  it.each([
    "/api/media",
    "/uploads/image.jpg",
    "/_next/static/chunk.js",
    "/fonts/inter/font.css",
    "/opengraph-image",
  ])(
    "does not attach page nonces or disable asset caching on %s",
    async (path) => {
      const result = await proxy(
        new NextRequest(`https://site.test${path}`, {
          headers: { "x-nonce": "attacker" },
        })
      )
      expect(result.headers.has("content-security-policy-report-only")).toBe(
        false
      )
      expect(result.headers.has("cache-control")).toBe(false)
      expect(result.headers.get("x-middleware-request-x-nonce")).not.toBe(
        "attacker"
      )
    }
  )
})
