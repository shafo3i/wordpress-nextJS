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
vi.mock("@/lib/authMIddleware", () => ({ verifyAdminOrEditor: mocks.guard }));
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
vi.mock("@/services/category.service", () => ({
  CategoryMutationError: class extends Error {},
  createCategory: mocks.create,
  updateCategory: mocks.update,
  quickUpdateCategory: mocks.quick,
  bulkDeleteCategories: mocks.remove,
}));
import {
  createCategory,
  updateCategory,
  quickUpdateCategory,
  deleteCategories,
} from "@/app/(admin)/admincp/categories/action";
beforeEach(() => {
  vi.clearAllMocks();
  mocks.guard.mockResolvedValue({ user: { role: "editor" } });
});
describe("category server action boundaries", () => {
  it("rejects unauthenticated/non-editor callers before invoking a service", async () => {
    mocks.guard.mockRejectedValue(new Error("Forbidden"));
    for (const operation of [
      () => createCategory(new FormData()),
      () => updateCategory(new FormData()),
      () => quickUpdateCategory({ id: "1", name: "News" }),
      () => deleteCategories(["1"]),
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
    expect(await createCategory(form)).toEqual({ success: true, id: "1" });
    expect(mocks.create.mock.calls[0][0]).toMatchObject({
      name: "News",
      parent: BigInt(0),
      languageCode: "en",
    });
  });
  it("validates quick edit payloads at the action boundary", async () => {
    await expect(
      quickUpdateCategory({ id: "1", name: "x".repeat(201) })
    ).rejects.toThrow(en["admin.categories.error.invalid"]);
    expect(mocks.quick).not.toHaveBeenCalled();
  });
  it("reports bounded bulk input failures without deleting anything", async () => {
    expect(await deleteCategories(Array(101).fill("1"))).toEqual({
      error: en["admin.categories.error.invalid"],
    });
    expect(mocks.remove).not.toHaveBeenCalled();
  });
  it("does not disclose database errors or invalidate caches on failure", async () => {
    mocks.remove.mockRejectedValue(
      new Error("database credentials or SQL internals")
    );
    expect(await deleteCategories(["1"])).toEqual({
      error: en["admin.categories.error.failed"],
    });
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
});
