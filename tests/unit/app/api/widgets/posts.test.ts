import { describe, expect, it, vi, beforeEach } from "vitest"
vi.mock("server-only", () => ({}))
vi.mock("@/services/widget-posts.service", () => ({ getWidgetCategoryPosts: vi.fn() }))
import { getWidgetCategoryPosts } from "@/services/widget-posts.service"
import { GET } from "@/app/api/widgets/posts/route"
beforeEach(() => { vi.clearAllMocks(); vi.mocked(getWidgetCategoryPosts).mockResolvedValue([]) })
describe("public category widget route", () => {
  it("returns only the category service result without setting cookies or caching it", async () => {
    const response = await GET(new Request("https://site.test/api/widgets/posts?categoryId=22&locale=ar&limit=5"))
    expect(response.status).toBe(200)
    expect(response.headers.get("cache-control")).toBe("no-store")
    expect(response.headers.has("set-cookie")).toBe(false)
    expect(await response.json()).toEqual({ posts: [] })
    expect(getWidgetCategoryPosts).toHaveBeenCalledWith({ categoryId: BigInt(22), locale: "ar", limit: 5 })
  })
  it.each(["categoryId=0", "categoryId=22&limit=1000", "categoryId=22&locale=../ar", "categoryId=99999999999999999999999"])("rejects invalid query %s before service calls", async (query) => {
    expect((await GET(new Request(`https://site.test/api/widgets/posts?${query}`))).status).toBe(400)
    expect(getWidgetCategoryPosts).not.toHaveBeenCalled()
  })
  it("does not expose database error details", async () => {
    vi.mocked(getWidgetCategoryPosts).mockRejectedValue(new Error("secret connection information"))
    const response = await GET(new Request("https://site.test/api/widgets/posts?categoryId=22"))
    expect(response.status).toBe(503)
    expect(await response.json()).toEqual({ error: "unavailable" })
  })
})
