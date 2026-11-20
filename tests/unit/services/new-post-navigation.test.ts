import { beforeEach, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({ redirect: vi.fn(), draft: vi.fn() }))
vi.mock("next/navigation", () => ({
  notFound: () => { throw new Error("not_found") },
  redirect: (url: string) => { mocks.redirect(url); throw new Error("redirect") },
}))
vi.mock("@/lib/authMIddleware", () => ({ verifyPostEditor: async () => ({ user: { id: "editor", role: "editor" } }) }))
vi.mock("@/components/admin/admin-shell", () => ({
  AdminShell: () => null,
  getAdminLanguageContext: async () => ({ code: "en", direction: "ltr", dict: {}, allLanguages: [{ code: "en" }] }),
}))
vi.mock("@/components/admin/posts/editor/classic-post-editor", () => ({ ClassicPostEditor: () => null }))
vi.mock("@/app/(admin)/admincp/posts/query", () => ({ getAllCategoriesQuery: async () => [], getAllTagsQuery: async () => [], getPostByIdQuery: vi.fn() }))
vi.mock("@/app/(admin)/admincp/posts/action", () => ({ savePostAction: vi.fn() }))
vi.mock("@/services/post.service", () => ({ getDocumentDraftId: mocks.draft }))
import NewPostPage from "@/app/(admin)/admincp/posts/new/page"

beforeEach(() => { vi.clearAllMocks(); mocks.draft.mockResolvedValue(null) })

it("renders a new editor immediately without redirecting to allocate a draft key", async () => {
  expect(await NewPostPage({ searchParams: Promise.resolve({}) })).toBeTruthy()
  expect(mocks.redirect).not.toHaveBeenCalled()
})

it("still resumes a saved draft through its existing edit page", async () => {
  mocks.draft.mockResolvedValue("82")
  await expect(NewPostPage({ searchParams: Promise.resolve({ draft: "12345678-1234-4234-8234-123456789abc" }) })).rejects.toThrow("redirect")
  expect(mocks.redirect).toHaveBeenCalledWith("/admincp/posts/82/edit")
})
