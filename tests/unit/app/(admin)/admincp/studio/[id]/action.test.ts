import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  createNewStudioPageAction,
  saveStudioDocumentAction,
  switchPageEditorModeAction,
} from "@/app/(admin)/admincp/studio/[id]/action"

const mocks = vi.hoisted(() => ({
  guard: vi.fn(),
  save: vi.fn(),
  create: vi.fn(),
  mode: vi.fn(),
}))
vi.mock("@/lib/authMIddleware", () => ({ verifyAdminOrEditor: mocks.guard }))
vi.mock("@/services/page.service", () => ({
  saveStudioPageData: mocks.save,
  createDraftStudioPage: mocks.create,
  setPageStudioMode: mocks.mode,
}))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

describe("Studio mutation authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.guard.mockRejectedValue(new Error("Unauthorized"))
  })

  it("does not save a document when the server guard denies access", async () => {
    const result = await saveStudioDocumentAction({
      pageId: "1",
      document: { version: "1.0", pageTemplate: "studio_canvas", elements: [] },
    })
    expect(result.success).toBe(false)
    expect(mocks.save).not.toHaveBeenCalled()
  })

  it("does not create a page when the server guard denies access", async () => {
    await expect(createNewStudioPageAction({ title: "Test" })).rejects.toThrow(
      "Unauthorized"
    )
    expect(mocks.create).not.toHaveBeenCalled()
  })

  it("does not switch editor modes when the server guard denies access", async () => {
    await expect(
      switchPageEditorModeAction({ pageId: "1", enableStudio: true })
    ).rejects.toThrow("Unauthorized")
    expect(mocks.mode).not.toHaveBeenCalled()
  })

  it("does not let an editor assign the global homepage", async () => {
    mocks.guard.mockResolvedValue({ user: { id: "editor", role: "editor" } })
    const result = await saveStudioDocumentAction({
      pageId: "1",
      setAsFrontPage: true,
      document: { version: "1.0", pageTemplate: "studio_canvas", elements: [] },
    })
    expect(result).toEqual({ success: false, error: "studio_forbidden" })
    expect(mocks.save).not.toHaveBeenCalled()
  })

  it("does not expose storage errors to the browser", async () => {
    mocks.guard.mockResolvedValue({ user: { id: "admin", role: "admin" } })
    mocks.save.mockRejectedValue(
      new Error("Internal database connection details")
    )
    const result = await saveStudioDocumentAction({
      pageId: "1",
      document: { version: "1.0", pageTemplate: "studio_canvas", elements: [] },
    })
    expect(result).toEqual({ success: false, error: "studio_save_failed" })
  })
})
