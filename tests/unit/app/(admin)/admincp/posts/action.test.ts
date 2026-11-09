import { beforeEach, describe, expect, it, vi } from "vitest"
const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  clear: vi.fn(),
}))
vi.mock("@/lib/authMIddleware", () => ({ verifyAdminOrEditor: mocks.auth }))
vi.mock("@/services/post.service", () => ({
  createPost: mocks.create,
  updatePost: mocks.update,
  trashPosts: vi.fn(),
  restorePosts: vi.fn(),
  deletePosts: vi.fn(),
  PostChangedError: class extends Error {},
}))
vi.mock("@/services/post-autosave.service", () => ({
  deletePostAutosave: mocks.clear,
}))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
import {
  savePostAction,
  updatePostAction,
} from "@/app/(admin)/admincp/posts/action"
import { PostChangedError } from "@/services/post.service"
const form = () => {
  const value = new FormData()
  value.set("title", "Saved title")
  value.set("content", "<p>Current content</p>")
  value.set("autosaveDocument", "post:1")
  value.set("autosaveVersion", "7")
  value.set("id", "1")
  return value
}
beforeEach(() => {
  vi.clearAllMocks()
  mocks.auth.mockResolvedValue({ user: { id: "editor-a", role: "editor" } })
  mocks.create.mockResolvedValue("2")
  mocks.update.mockResolvedValue(undefined)
  mocks.clear.mockResolvedValue(undefined)
})
describe("manual saves acknowledge recovery only after successful writes", () => {
  it("retains recovery data when saving fails", async () => {
    mocks.update.mockRejectedValue(new Error("database failed"))
    expect(await updatePostAction(form())).toEqual({
      success: false,
      error: "admin.editor.save_failed",
    })
    expect(mocks.clear).not.toHaveBeenCalled()
  })
  it("passes the source version and reports concurrent edits", async () => {
    const values = form()
    values.set("expectedModifiedAt", "2026-11-09T12:00:00.000Z")
    mocks.update.mockRejectedValue(new PostChangedError())
    expect(await updatePostAction(values)).toEqual({
      success: false,
      error: "admin.editor.post_changed",
    })
    expect(mocks.update).toHaveBeenCalledWith(
      "1",
      expect.objectContaining({ expectedModified: "2026-11-09T12:00:00.000Z" })
    )
    expect(mocks.clear).not.toHaveBeenCalled()
  })
  it("cleans the acknowledged account-specific version after updating", async () => {
    expect(await updatePostAction(form())).toEqual({
      success: true,
      postId: "1",
    })
    expect(mocks.clear).toHaveBeenCalledWith("editor-a", "post:1", 7)
  })
  it("cannot clear an unrelated document's recovery", async () => {
    const values = form()
    values.set("autosaveDocument", "post:2")
    expect((await updatePostAction(values)).success).toBe(true)
    expect(mocks.clear).not.toHaveBeenCalled()
  })
  it("preserves successful creation even if recovery cleanup fails", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    const values = form()
    values.set("autosaveDocument", "new:12345678-1234-4234-8234-123456789abc")
    mocks.clear.mockRejectedValue(new Error("cleanup failed"))
    expect(await savePostAction(values)).toEqual({ success: true, postId: "2" })
    warn.mockRestore()
  })
})
