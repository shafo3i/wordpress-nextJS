import { beforeEach, describe, expect, it, vi } from "vitest";
import en from "@/templates/language/en.json";
const mocks = vi.hoisted(() => ({ guard: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn(), bulk: vi.fn(), bulkDelete: vi.fn(), revalidate: vi.fn() }));
vi.mock("@/lib/authMIddleware", () => ({ verifyAdmin: mocks.guard }));
vi.mock("@/components/admin/admin-shell", () => ({ getAdminLanguageContext: async () => ({ dict: en }) }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("next/navigation", () => ({ redirect: () => { throw new Error("redirect"); }, unstable_rethrow: () => {} }));
vi.mock("@/services/comment.service", () => ({ CommentMutationError: class extends Error {}, commentService: { create: mocks.create, update: mocks.update, delete: mocks.remove, bulkUpdateStatus: mocks.bulk, bulkDelete: mocks.bulkDelete } }));
import { createCommentAction, updateCommentAction, deleteCommentAction, updateCommentStatusAction, bulkUpdateCommentStatus, bulkDeleteComments } from "@/app/(admin)/admincp/comments/action";
beforeEach(() => { vi.clearAllMocks(); mocks.guard.mockResolvedValue({ user: { id: "admin", role: "admin" } }); });
function form(values: Record<string, string>) { const data = new FormData(); for (const [key, value] of Object.entries(values)) data.set(key, value); return data; }
describe("comment action boundaries", () => {
  it("denies all actions before invoking any service", async () => {
    mocks.guard.mockRejectedValue(new Error("Forbidden"));
    for (const operation of [() => createCommentAction(new FormData()), () => updateCommentAction(new FormData()), () => deleteCommentAction(new FormData()), () => updateCommentStatusAction(new FormData()), () => bulkUpdateCommentStatus(["1"], "1"), () => bulkDeleteComments(["1"])])
      await expect(operation()).rejects.toThrow("Forbidden");
    for (const service of [mocks.create, mocks.update, mocks.remove, mocks.bulk, mocks.bulkDelete]) expect(service).not.toHaveBeenCalled();
  });
  it("rejects invalid statuses without changing comments", async () => {
    await expect(updateCommentStatusAction(form({ id: "1", status: "invalid" }))).rejects.toThrow(en["admin.comments.error.invalid"]);
    expect(mocks.bulk).not.toHaveBeenCalled();
  });
  it("rejects oversized batches before invoking the service", async () => {
    await expect(bulkDeleteComments(Array(101).fill("1"))).rejects.toThrow(en["admin.comments.error.invalid"]);
    expect(mocks.bulkDelete).not.toHaveBeenCalled();
  });
  it("redacts database errors and does not invalidate failed writes", async () => {
    mocks.bulkDelete.mockRejectedValue(new Error("database credentials and private SQL"));
    await expect(bulkDeleteComments(["1"])).rejects.toThrow(en["admin.comments.error.failed"]);
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
  it("preserves fields omitted by an edit and excludes forged internal fields", async () => {
    await expect(updateCommentAction(form({ id: "1", commentContent: "Edited", userId: "forged", commentKarma: "999", commentAuthorIp: "forged", commentAgent: "forged" }))).rejects.toThrow("redirect");
    expect(mocks.update).toHaveBeenCalledWith(BigInt(1), { commentContent: "Edited" });
    expect(mocks.revalidate).toHaveBeenCalledWith("/admincp/comments");
  });
  it("returns the actual batch result", async () => {
    mocks.bulk.mockResolvedValue({ success: true, count: 1 });
    expect(await bulkUpdateCommentStatus(["1", "1"], "spam")).toEqual({ success: true, count: 1 });
    expect(mocks.bulk).toHaveBeenCalledWith([BigInt(1)], "spam");
  });
});
