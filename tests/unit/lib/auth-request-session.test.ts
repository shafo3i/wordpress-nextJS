import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ session: vi.fn(), headers: new Headers() }));
vi.mock("server-only", () => ({}));
vi.mock("@/auth", () => ({ auth: { api: { getSession: mocks.session } } }));
vi.mock("next/headers", () => ({ headers: async () => mocks.headers }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw Error(`redirect:${path}`); } }));
import { verifyAdmin, verifyPostEditor } from "@/lib/authMIddleware";
beforeEach(() => { vi.clearAllMocks(); mocks.headers = new Headers({ cookie: "session=fixture" }); });
describe("request-scoped session checks", () => {
  it("shares concurrent and nested guards within the same request", async () => {
    mocks.session.mockResolvedValue({ user: { role: "admin", banned: false } });
    await Promise.all([verifyAdmin(), verifyPostEditor()]);
    await verifyPostEditor();
    expect(mocks.session).toHaveBeenCalledTimes(1);
  });
  it("does not reuse authentication across requests with identical cookies", async () => {
    mocks.session.mockResolvedValueOnce({ user: { role: "admin", banned: false } });
    await verifyAdmin();
    mocks.headers = new Headers({ cookie: "session=fixture" });
    mocks.session.mockResolvedValueOnce({ user: { role: "editor", banned: false } });
    await expect(verifyAdmin()).rejects.toThrow("redirect:/admincp/posts");
    expect(mocks.session).toHaveBeenCalledTimes(2);
  });
  it("keeps banned and unauthenticated requests blocked", async () => {
    mocks.session.mockResolvedValueOnce(null);
    await expect(verifyPostEditor()).rejects.toThrow("redirect:/cms-login");
    mocks.headers = new Headers();
    mocks.session.mockResolvedValueOnce({ user: { role: "admin", banned: true } });
    await expect(verifyAdmin()).rejects.toThrow("redirect:/cms-admin");
  });
});
