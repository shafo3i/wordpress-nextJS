import { beforeEach, describe, expect, it, vi } from "vitest";
import en from "@/templates/language/en.json";
const mocks = vi.hoisted(() => ({
  guard: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  quick: vi.fn(),
  remove: vi.fn(),
  revalidate: vi.fn(),
}));
vi.mock("@/lib/authMIddleware", () => ({ verifyPostEditor: mocks.guard }));
vi.mock("@/components/admin/admin-shell", () => ({
  getAdminLanguageContext: async () => ({ dict: en }),
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("next/navigation", () => ({
  redirect: () => {
    throw new Error("redirect");
  },
  unstable_rethrow: () => {},
}));
vi.mock("@/services/tag.service", () => ({
  createTag: mocks.create,
  updateTag: mocks.update,
  quickUpdateTag: mocks.quick,
  bulkDeleteTags: mocks.remove,
}));
import {
  createTag,
  updateTag,
  quickUpdateTag,
  deleteTags,
} from "@/app/(admin)/admincp/tags/action";
beforeEach(() => {
  vi.clearAllMocks();
  mocks.guard.mockResolvedValue({ user: { role: "editor" } });
});
describe("tag server action boundaries", () => {
  it("rejects unauthenticated/non-editor callers before invoking a service", async () => {
    mocks.guard.mockRejectedValue(new Error("Forbidden"));
    for (const operation of [
      () => createTag(new FormData()),
      () => updateTag(new FormData()),
      () => quickUpdateTag({ id: "1", name: "News" }),
      () => deleteTags(["1"]),
    ])
      await expect(operation()).rejects.toThrow("Forbidden");
    for (const service of [
      mocks.create,
      mocks.update,
      mocks.quick,
      mocks.remove,
    ])
      expect(service).not.toHaveBeenCalled();
  });
  it("returns only the identifier needed after creation", async () => {
    mocks.create.mockResolvedValue({
      id: "1",
      name: "News",
      translationGroupId: "internal",
      extra: "private",
    });
    const form = new FormData();
    form.set("name", "News");
    form.set("languageCode", "en");
    expect(await createTag(form)).toEqual({ success: true, id: "1" });
    expect(mocks.create.mock.calls[0][0]).toMatchObject({
      name: "News",
      languageCode: "en",
    });
  });
  it("validates quick edit payloads at the action boundary", async () => {
    await expect(
      quickUpdateTag({ id: "1", name: "x".repeat(201) })
    ).rejects.toThrow(en["admin.tags.error.invalid"]);
    expect(mocks.quick).not.toHaveBeenCalled();
  });
  it("reports bounded bulk input failures without deleting anything", async () => {
    expect(await deleteTags(Array(101).fill("1"))).toEqual({
      error: en["admin.tags.error.invalid"],
    });
    expect(mocks.remove).not.toHaveBeenCalled();
  });
  it("does not disclose database errors or invalidate caches on failure", async () => {
    mocks.remove.mockRejectedValue(
      new Error("database credentials or SQL internals")
    );
    expect(await deleteTags(["1"])).toEqual({
      error: en["admin.tags.error.failed"],
    });
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
});
