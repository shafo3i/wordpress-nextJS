import { beforeEach, describe, expect, it, vi } from "vitest"
vi.mock("server-only", () => ({}))
const mocks = vi.hoisted(() => ({ select: vi.fn(), posts: vi.fn() }))
vi.mock("@/db", () => ({ db: { select: mocks.select } }))
vi.mock("@/lib/site-content", () => ({ getPublishedPostsByCategory: mocks.posts }))
import { getWidgetCategoryPosts } from "@/services/widget-posts.service"
beforeEach(() => {
  vi.clearAllMocks()
  const chain = { from: () => chain, innerJoin: () => chain, where: () => chain, limit: async () => [{ slug: "business" }] }
  mocks.select.mockReturnValue(chain)
  mocks.posts.mockResolvedValue({ posts: [{ id: "1", title: "Older matching article", slug: "older", date: new Date("2026-01-01"), categories: ["Business"], content: "PRIVATE BODY MUST NOT BE RETURNED", excerpt: "Public summary", authorName: "Writer", imageUrl: "/uploads/a.jpg", tags: [], postPassword: "secret", studioDocument: {} }] })
})
describe("category widget feed", () => {
  it("queries the selected category directly with language and count instead of filtering a page's recent list", async () => {
    const posts = await getWidgetCategoryPosts({ categoryId: "12", locale: "ar", limit: 5 })
    expect(mocks.posts).toHaveBeenCalledWith("business", 1, 5, "ar")
    expect(posts[0].title).toBe("Older matching article")
    expect(posts[0].date).toBe("2026-01-01T00:00:00.000Z")
    expect(JSON.stringify(posts)).not.toMatch(/PRIVATE BODY|secret|studioDocument|postPassword/)
  })
  it.each([{ categoryId: "0" }, { categoryId: "1", limit: 1000 }, { categoryId: "1", locale: "../../ar" }])("rejects unsafe or unbounded queries before reads", async (query) => {
    await expect(getWidgetCategoryPosts(query)).rejects.toThrow()
    expect(mocks.select).not.toHaveBeenCalled()
    expect(mocks.posts).not.toHaveBeenCalled()
  })
  it("does not fall back to unrelated posts for a removed category", async () => {
    const chain = { from: () => chain, innerJoin: () => chain, where: () => chain, limit: async () => [] }
    mocks.select.mockReturnValue(chain)
    expect(await getWidgetCategoryPosts({ categoryId: "99" })).toEqual([])
    expect(mocks.posts).not.toHaveBeenCalled()
  })
})
