import { beforeEach, describe, expect, it, vi } from "vitest"
vi.mock("server-only", () => ({}))
const mocks = vi.hoisted(() => ({
  session: vi.fn(),
  create: vi.fn(),
  read: vi.fn(),
  health: vi.fn(),
}))
vi.mock("@/auth", () => ({ auth: { api: { getSession: mocks.session } } }))
vi.mock("next/headers", () => ({ headers: async () => new Headers() }))
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error("redirect:" + path)
  },
}))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/services/post.service", () => ({ createPost: mocks.create }))
vi.mock("@/db", () => ({ db: { select: mocks.read } }))
vi.mock("@/services/database-maintenance.service", () => ({
  getSiteHealthData: mocks.health,
}))
import { saveQuickDraftAction } from "@/app/(admin)/admincp/actions"
import { getDashboardData } from "@/app/(admin)/admincp/query"
beforeEach(() => {
  vi.clearAllMocks()
  mocks.session.mockResolvedValue({ user: { id: "admin-1", role: "admin" } })
  mocks.create.mockResolvedValue("42")
})
function form(values: Record<string, string | undefined>) {
  const data = new FormData()
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined) data.set(key, value)
  }
  return data
}
describe("Dashboard security", () => {
  it.each(["editor", "author", "subscriber", "custom"])(
    "blocks %s before reads or draft writes",
    async (role) => {
      mocks.session.mockResolvedValue({ user: { id: "other", role } })
      await expect(getDashboardData()).rejects.toThrow("redirect:")
      await expect(
        saveQuickDraftAction(form({ title: "Title", content: "Text" }))
      ).rejects.toThrow("redirect:")
      expect(mocks.read).not.toHaveBeenCalled()
      expect(mocks.health).not.toHaveBeenCalled()
      expect(mocks.create).not.toHaveBeenCalled()
    }
  )
  it.each([
    { title: "", content: "" },
    { title: "x".repeat(301), content: "" },
    { title: "Title", content: "x".repeat(100001) },
    { title: "Title", content: "", status: "publish" },
    { title: "Title", content: "", authorId: "someone" },
  ])("rejects invalid or forged drafts", async (values) => {
    expect((await saveQuickDraftAction(form(values))).success).toBe(false)
    expect(mocks.create).not.toHaveBeenCalled()
  })
  it("treats quick-draft content as text and derives draft status and author on the server", async () => {
    expect(
      (
        await saveQuickDraftAction(
          form({
            title: "<script>Title</script>",
            content: "<img src=x onerror=alert(1)>\n<script>bad()</script>",
          })
        )
      ).success
    ).toBe(true)
    expect(mocks.create).toHaveBeenCalledWith({
      title: "<script>Title</script>",
      content:
        "&lt;img src=x onerror=alert(1)&gt;<br>&lt;script&gt;bad()&lt;/script&gt;",
      status: "draft",
      authorId: "admin-1",
    })
  })
  it("does not disclose database errors", async () => {
    mocks.create.mockRejectedValue(new Error("private SQL parameters"))
    expect(
      await saveQuickDraftAction(form({ title: "Title", content: "Text" }))
    ).toEqual({ success: false, error: "admin.dashboard.draft_error" })
  })
  it("does not turn stored executable post GUIDs into Dashboard links", async () => {
    let index = 0
    mocks.health.mockResolvedValue(null)
    mocks.read.mockImplementation(() => {
      const rows =
        index++ === 7
          ? [
              {
                id: BigInt(42),
                title: "<script>title</script>",
                date: new Date(),
                guid: "javascript:alert(1)",
              },
            ]
          : []
      const chain = {
        from: () => chain,
        where: () => chain,
        orderBy: () => chain,
        limit: () => chain,
        then: (resolve: (value: unknown[]) => unknown) =>
          Promise.resolve(rows).then(resolve),
      }
      return chain
    })
    const result = await getDashboardData()
    expect(result.recentPosts[0].guid).toBeUndefined()
    expect(result.recentPosts[0].title).toBe("<script>title</script>")
  })
})
