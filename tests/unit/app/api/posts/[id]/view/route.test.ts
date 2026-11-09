import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"

const mocks = vi.hoisted(() => ({
  session: vi.fn(),
  counts: vi.fn(),
  record: vi.fn(),
}))
vi.mock("@/auth", () => ({ auth: { api: { getSession: mocks.session } } }))
vi.mock("@/lib/env", () => ({
  env: {
    NEXT_PUBLIC_APP_URL: "https://news.example",
    BETTER_AUTH_SECRET: "test-only-view-secret",
  },
}))
vi.mock("@/db", () => ({ db: {} }))
vi.mock("@/services/post-views.service", () => ({
  getPostViewCounts: mocks.counts,
  recordPostView: mocks.record,
}))
import { POST } from "@/app/api/posts/[id]/view/route"

describe("public article view endpoint", () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mocks.session.mockResolvedValue(null)
    mocks.counts.mockResolvedValue(new Map([["123", 100]]))
    mocks.record.mockResolvedValue({ views: 101, counted: true })
  })
  const request = (headers: Record<string, string> = {}, id = "123") =>
    POST(
      new NextRequest(`https://news.example/api/posts/${id}/view`, {
        method: "POST",
        headers: {
          origin: "https://news.example",
          "user-agent": "Mozilla/5.0 Chrome/130 Safari/537.36",
          ...headers,
        },
        body: JSON.stringify({ views: 99999999 }),
      }),
      { params: Promise.resolve({ id }) }
    )
  it("rejects malformed IDs and cross-origin submissions before querying", async () => {
    expect((await request({}, "invalid")).status).toBe(400)
    expect((await request({ origin: "https://other.example" })).status).toBe(
      403
    )
    expect((await request({ "sec-fetch-site": "cross-site" })).status).toBe(403)
    expect(mocks.record).not.toHaveBeenCalled()
  })
  it("excludes admin/editor sessions and bot requests", async () => {
    for (const role of ["admin", "editor"]) {
      mocks.session.mockResolvedValue({ user: { role } })
      expect(await (await request()).json()).toEqual({
        views: 100,
        counted: false,
      })
    }
    mocks.session.mockResolvedValue(null)
    expect(
      await (await request({ "user-agent": "Googlebot/2.1" })).json()
    ).toEqual({ views: 100, counted: false })
    expect(mocks.record).not.toHaveBeenCalled()
  })
  it("uses a server-side increment and issues a protected anonymous cookie", async () => {
    const response = await request()
    expect(await response.json()).toEqual({ views: 101, counted: true })
    expect(response.headers.get("set-cookie")).toMatch(/HttpOnly/i)
    expect(response.headers.get("set-cookie")).toMatch(/Secure/i)
    expect(response.headers.get("cache-control")).toBe("no-store")
    expect(mocks.record.mock.calls[0][0]).toBe(BigInt(123))
    expect(mocks.record.mock.calls[0][1]).toMatch(/^[a-f0-9]{64}$/)
  })
  it("does not expose view metadata for unpublished or missing articles", async () => {
    mocks.record.mockResolvedValue(null)
    expect((await request()).status).toBe(404)
    mocks.counts.mockResolvedValue(new Map())
    expect((await request({ "user-agent": "Googlebot/2.1" })).status).toBe(404)
  })
})
