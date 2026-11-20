import { beforeEach, describe, expect, it, vi } from "vitest"
vi.mock("server-only", () => ({}))
vi.mock("@/lib/rate-limit", async (load) => ({
  ...await load<typeof import("@/lib/rate-limit")>(), enforceRateLimit: vi.fn(),
}))
import { enforceRateLimit, RateLimitError } from "@/lib/rate-limit"
import { POST } from "@/app/api/security/csp-report/route"

const log = vi.spyOn(console, "warn").mockImplementation(() => {})
const request = (body: string, headers: Record<string, string> = {}) => new Request("https://site.test/api/security/csp-report", {
  method: "POST", headers: { "content-type": "application/csp-report", ...headers }, body,
})
const report = {
  "csp-report": { "effective-directive": "script-src-elem", "blocked-uri": "inline",
    "document-uri": "https://site.test/admincp/posts/12/edit?token=secret", "script-sample": "secret-content",
    "source-file": "https://evil.test/private?password=secret" },
}
beforeEach(() => { vi.clearAllMocks(); vi.mocked(enforceRateLimit).mockResolvedValue({ success: true, remaining: 1, retryAfter: 0 }) })

describe("CSP diagnostic report boundary", () => {
  it("logs page paths but never query strings, external URLs, samples or tokens", async () => {
    const response = await POST(request(JSON.stringify(report)))
    expect(response.status).toBe(204)
    expect(response.headers.get("cache-control")).toBe("no-store")
    expect(log).toHaveBeenCalledWith("CSP report-only violation", { directive: "script-src-elem", source: "inline", area: "admin", page: "/admincp/posts/12/edit" })
    expect(JSON.stringify(log.mock.calls)).not.toMatch(/secret|evil|token|password/)
    expect(enforceRateLimit).toHaveBeenCalledWith({ namespace: "csp-report", identifier: "site", max: 60, window: 60 })
  })
  it("identifies same-origin static scripts and validated source positions", async () => {
    const input = { "csp-report": { ...report["csp-report"],
      "blocked-uri": "https://site.test/_next/static/chunks/app.js?secret=1#private",
      "source-file": "https://site.test/cdn-cgi/scripts/loader.js?secret=2",
      "line-number": 12, "column-number": 7,
    } }
    expect((await POST(request(JSON.stringify(input)))).status).toBe(204)
    expect(log).toHaveBeenCalledWith("CSP report-only violation", expect.objectContaining({
      page: "/admincp/posts/12/edit", blockedScript: "/_next/static/chunks/app.js",
      sourceFile: "/cdn-cgi/scripts/loader.js", line: 12, column: 7,
    }))
    expect(JSON.stringify(log.mock.calls)).not.toMatch(/secret|private|https:/)
  })
  it("does not log arbitrary script paths or invalid positions", async () => {
    const input = { "csp-report": { ...report["csp-report"], "blocked-uri": "https://site.test/api/auth/secret", "line-number": "secret", "column-number": -1 } }
    await POST(request(JSON.stringify(input)))
    expect(JSON.stringify(log.mock.calls)).not.toMatch(/secret|blockedScript|sourceFile|column|line/)
  })
  it("redacts opaque page IDs and drops query strings and fragments", async () => {
    const input = { "csp-report": { ...report["csp-report"], "document-uri": "https://site.test/admincp/posts/12345678-1234-4234-8234-123456789abc?draft=secret#password" } }
    await POST(request(JSON.stringify(input)))
    expect(log).toHaveBeenCalledWith("CSP report-only violation", expect.objectContaining({ page: "/admincp/posts/[redacted]" }))
    expect(JSON.stringify(log.mock.calls)).not.toMatch(/12345678|secret|password/)
  })
  it.each(["https://evil.test/private?secret=1", "data:text/plain,secret", "blob:https://site.test/secret"])("does not log the blocked URL %s", async (url) => {
    const input = structuredClone(report); input["csp-report"]["blocked-uri"] = url
    expect((await POST(request(JSON.stringify(input)))).status).toBe(204)
    expect(JSON.stringify(log.mock.calls)).not.toContain("secret")
  })
  it.each(["{}", "null", "[]", "not json", JSON.stringify({ "csp-report": { "effective-directive": "injected\nlog", "blocked-uri": "inline" } })])("rejects malformed reports", async (body) => {
    expect((await POST(request(body))).status).toBe(400)
    expect(log).not.toHaveBeenCalled()
  })
  it("rejects oversized requests both with and without Content-Length", async () => {
    expect((await POST(request("x", { "content-length": "20000" }))).status).toBe(413)
    expect(enforceRateLimit).not.toHaveBeenCalled()
    expect((await POST(request("x".repeat(20000)))).status).toBe(413)
    expect(log).not.toHaveBeenCalled()
  })
  it("rejects unsupported content and cross-site browser requests before work", async () => {
    expect((await POST(request("{}", { "content-type": "text/plain" }))).status).toBe(415)
    expect((await POST(request("{}", { "sec-fetch-site": "cross-site" }))).status).toBe(403)
    expect(enforceRateLimit).not.toHaveBeenCalled()
  })
  it("cancels a stalled body after two seconds", async () => {
    vi.useFakeTimers()
    try {
      const cancel = vi.fn()
      const stream = new ReadableStream<Uint8Array>({ cancel })
      const input = new Request("https://site.test/api/security/csp-report", {
        method: "POST", headers: { "content-type": "application/csp-report" }, body: stream, duplex: "half",
      } as RequestInit & { duplex: "half" })
      const result = POST(input)
      await vi.advanceTimersByTimeAsync(2001)
      expect((await result).status).toBe(408)
      expect(cancel).toHaveBeenCalled()
      expect(log).not.toHaveBeenCalled()
    } finally { vi.useRealTimers() }
  })
  it.each([429, 503] as const)("caps report ingestion when the limiter returns %s", async (status) => {
    vi.mocked(enforceRateLimit).mockRejectedValue(new RateLimitError(status, 30))
    const response = await POST(request(JSON.stringify(report)))
    expect(response.status).toBe(status)
    expect(response.headers.get("retry-after")).toBe("30")
    expect(log).not.toHaveBeenCalled()
  })
})
