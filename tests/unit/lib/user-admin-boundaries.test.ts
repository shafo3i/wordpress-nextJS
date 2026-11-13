import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ getSession: vi.fn(), handler: vi.fn(), requestHeaders: new Headers() }));
vi.mock("@/auth", () => ({ auth: { api: { getSession: mocks.getSession } } }));
vi.mock("next/headers", () => ({ headers: async () => mocks.requestHeaders }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`redirect:${url}`);
  },
}));
vi.mock("better-auth/next-js", () => ({
  toNextJsHandler: () => ({ GET: mocks.handler, POST: mocks.handler }),
}));
import { verifyAdmin, verifyPostEditor, verifyAdminOrEditor, verifyAdminArea } from "@/lib/authMIddleware";
import { canAccessAdminPath } from "@/lib/admin-permissions";
import { GET, POST } from "@/app/api/auth/[...all]/route";
beforeEach(() => {
  vi.clearAllMocks();
  mocks.handler.mockResolvedValue(new Response("ok"));
  mocks.requestHeaders = new Headers({ "x-cms-pathname": "/admincp/posts" });
});
describe("administrator guard", () => {
  it.each(["editor", "author", "subscriber", "user", "admin,user", "custom"])(
    "denies user administration to %s",
    async (role) => {
      mocks.getSession.mockResolvedValue({
        user: { id: "user-2", role, banned: false },
      });
      await expect(verifyAdmin()).rejects.toThrow(role === "editor" ? "redirect:/admincp/posts" : "redirect:/cms-admin");
    }
  );
  it("denies anonymous and banned callers but permits administrators", async () => {
    mocks.getSession.mockResolvedValue(null);
    await expect(verifyAdmin()).rejects.toThrow("redirect:/cms-login");
    mocks.getSession.mockResolvedValue({
      user: { id: "admin-1", role: "admin", banned: true },
    });
    await expect(verifyAdmin()).rejects.toThrow("redirect:/cms-admin");
    mocks.getSession.mockResolvedValue({
      user: { id: "admin-1", role: "admin", banned: false },
    });
    expect((await verifyAdmin()).user.id).toBe("admin-1");
  });
});
describe("editor access is limited to post authoring", () => {
  it.each(["/admincp/posts", "/admincp/posts/new", "/admincp/posts/12/edit", "/admincp/media", "/admincp/tags", "/admincp/tags/12/edit", "/admincp/categories"])("allows %s", async pathname => {
    mocks.getSession.mockResolvedValue({ user: { id: "editor-1", role: "editor" } });
    mocks.requestHeaders.set("x-cms-pathname", pathname);
    expect((await verifyAdminArea()).user.id).toBe("editor-1");
    expect((await verifyPostEditor()).user.id).toBe("editor-1");
  });
  it.each(["/admincp", "/admincp/users", "/admincp/settings", "/admincp/pages/new", "/admincp/plugins", "/admincp/studio/1", "/admincp/themes", "/admincp/widgets", "/admincp/menus", "/admincp/tools", "/admincp/languages", "/admincp/profile", "/admincp/categories/12/edit", "/admincp/media/other", "/admincp/tags/invalid/edit"])("blocks %s", async pathname => {
    mocks.getSession.mockResolvedValue({ user: { id: "editor-1", role: "editor" } });
    mocks.requestHeaders.set("x-cms-pathname", pathname);
    expect(canAccessAdminPath("editor", pathname)).toBe(false);
    await expect(verifyAdminArea()).rejects.toThrow("redirect:/admincp/posts");
  });
  it("denies privileged actions even when invoked from an allowed posts URL", async () => {
    mocks.getSession.mockResolvedValue({ user: { id: "editor-1", role: "editor" } });
    await expect(verifyAdminOrEditor()).rejects.toThrow("redirect:/admincp/posts");
  });
});
describe("auth plugin bypass prevention", () => {
  it.each([
    "/admin/create-user",
    "/admin/set-role",
    "/admin/update-user",
    "/admin/remove-user",
    "/admin/ban-user",
    "/admin/set-user-password",
    "/admin/impersonate-user",
    "/%61dmin/set-role",
    "/admin%2fset-role",
    "//admin/set-role",
  ])("blocks direct plugin endpoint %s", async (path) => {
    for (const handler of [GET, POST]) {
      const result = await handler(
        new Request(`https://site.test/api/auth${path}`)
      );
      expect(result.status).toBe(403);
    }
    expect(mocks.handler).not.toHaveBeenCalled();
  });
  it("preserves the normal login and MFA endpoints", async () => {
    await GET(new Request("https://site.test/api/auth/get-session"));
    await POST(
      new Request("https://site.test/api/auth/sign-in/email", {
        method: "POST",
      })
    );
    await POST(
      new Request("https://site.test/api/auth/two-factor/verify-totp", {
        method: "POST",
      })
    );
    expect(mocks.handler).toHaveBeenCalledTimes(3);
  });
});
