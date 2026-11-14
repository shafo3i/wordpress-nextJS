import { beforeEach, describe, expect, it, vi } from "vitest"
vi.mock("server-only", () => ({}))
const mocks = vi.hoisted(() => ({ session: vi.fn(), read: vi.fn(), details: vi.fn(), upload: vi.fn(), update: vi.fn(), remove: vi.fn() }))
vi.mock("@/auth", () => ({ auth: { api: { getSession: mocks.session } } }))
vi.mock("next/headers", () => ({ headers: async () => new Headers({ "x-cms-pathname": "/admincp/posts/new" }) }))
vi.mock("@/components/admin/admin-shell", () => ({ getAdminLanguageContext: async () => ({ dict: { "admin.media.error_failed":"Media request failed", "admin.media.invalid_upload":"Invalid upload" } }) }));
vi.mock("next/navigation", () => ({ unstable_rethrow: () => {}, redirect: () => { throw new Error("permission_denied") } }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/services/media.service", () => ({ getMediaLibraryItems: mocks.read, uploadMediaFile: mocks.upload, updateMediaItem: mocks.update, deleteMediaItems: mocks.remove }))
vi.mock("@/services/media-details.service", () => ({ getMediaItemDetails: mocks.details }))
import { fetchMediaItemsAction, fetchMediaItemAction, uploadMediaAction, updateMediaAction, deleteMediaAction } from "@/app/(admin)/admincp/media/actions"
beforeEach(() => {
  vi.clearAllMocks()
  mocks.session.mockResolvedValue({ user: { id: "editor-1", role: "editor" } })
  mocks.read.mockResolvedValue({ items: [], total: 0 })
  mocks.details.mockResolvedValue({ id: 1 })
  mocks.upload.mockResolvedValue({ id: 1 })
  mocks.remove.mockResolvedValue({ deletedCount: 1 })
})
describe("media capabilities required by post authoring", () => {
  it("allows an editor to select and upload media", async () => {
    expect((await fetchMediaItemsAction({ page: 1 })).success).toBe(true)
    expect((await fetchMediaItemAction(1)).success).toBe(true)
    const form = new FormData()
    form.set("file", new File([new Uint8Array([255,216,255,224])], "photo.jpg", { type: "image/jpeg" }))
    expect((await uploadMediaAction(form)).success).toBe(true)
    expect(mocks.upload).toHaveBeenCalledWith(expect.any(Buffer), "photo.jpg", "image/jpeg", "editor-1")
  })
  it("allows editors to update and delete media", async () => {
    const logging = vi.spyOn(console, "error").mockImplementation(() => {})
    try {
      expect((await updateMediaAction(1, { title: "Changed" })).success).toBe(true)
      expect((await deleteMediaAction([1])).success).toBe(true)
      expect(mocks.update).toHaveBeenCalledWith(1, { title: "Changed" })
      expect(mocks.remove).toHaveBeenCalledWith([1])
    } finally { logging.mockRestore() }
  })
})

it.each(["subscriber", "author", "user"])("denies media changes for %s", async role => { mocks.session.mockResolvedValue({ user: { id: "other", role } }); await expect(updateMediaAction(1, { title: "No" })).rejects.toThrow("permission_denied"); await expect(deleteMediaAction([1])).rejects.toThrow("permission_denied"); expect(mocks.update).not.toHaveBeenCalled(); expect(mocks.remove).not.toHaveBeenCalled(); });
