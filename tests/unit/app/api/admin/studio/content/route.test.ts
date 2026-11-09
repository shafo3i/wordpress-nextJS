import { describe, expect, it, vi, beforeEach } from "vitest"
import { GET } from "@/app/api/admin/studio/content/route"
const mocks = vi.hoisted(() => ({ guard: vi.fn(), content: vi.fn() }))
vi.mock("@/lib/authMIddleware", () => ({ verifyAdminOrEditor: mocks.guard }))
vi.mock("@/services/studio-content.service", () => ({
  getStudioWidgetContent: mocks.content,
  StudioContentError: class extends Error {},
}))
beforeEach(() => {
  vi.resetAllMocks()
  mocks.guard.mockResolvedValue({ user: { role: "admin" } })
})
describe("Studio content endpoint", () => {
  it("requires authorization before querying content", async () => {
    mocks.guard.mockRejectedValue(new Error("redirect"))
    const response = await GET(
      new Request("http://localhost/api/admin/studio/content?locale=en")
    )
    expect(response.status).toBe(401)
    expect(mocks.content).not.toHaveBeenCalled()
  })
  it("rejects invalid limits and IDs without querying the database", async () => {
    const response = await GET(
      new Request(
        "http://localhost/api/admin/studio/content?locale=ar&categoryId=abc&pageSize=99999"
      )
    )
    expect(response.status).toBe(400)
    expect(mocks.content).not.toHaveBeenCalled()
  })
  it("keeps authenticated responses private and includes the selected locale/category", async () => {
    mocks.content.mockResolvedValue({ items: [], locale: "ar" })
    const response = await GET(
      new Request(
        "http://localhost/api/admin/studio/content?locale=ar&categoryId=1"
      )
    )
    expect(mocks.content.mock.calls[0][0]).toMatchObject({
      locale: "ar",
      categoryId: "1",
    })
    expect(response.headers.get("Cache-Control")).toBe("private, no-store")
    expect(response.headers.get("Vary")).toBe("Cookie")
  })
  it("does not leak database errors", async () => {
    mocks.content.mockRejectedValue(new Error("connection credentials"))
    const response = await GET(
      new Request("http://localhost/api/admin/studio/content?locale=en")
    )
    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({ error: "studio_content_failed" })
  })
})
