import { beforeEach, describe, expect, it, vi } from "vitest"
import { POST } from "./route"

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  upload: vi.fn(),
  revalidate: vi.fn(),
}))
vi.mock("@/lib/authMIddleware", () => ({ verifyAdminOrEditor: mocks.auth }))
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }))
vi.mock("@/services/site-logo.service", () => ({
  uploadSiteLogo: mocks.upload,
  SiteLogoError: class SiteLogoError extends Error {},
}))
beforeEach(() => {
  vi.clearAllMocks()
  mocks.auth.mockResolvedValue({ user: { id: "editor" } })
  mocks.upload.mockResolvedValue({ id: "900", url: "/uploads/logo.webp" })
})
function request(files = 1, origin = "http://localhost:3000") {
  const data = new FormData()
  for (let index = 0; index < files; index++)
    data.append("file", new File(["image"], "logo.png", { type: "image/png" }))
  return new Request("http://localhost:3000/api/admin/settings/logo", {
    method: "POST",
    headers: { Origin: origin },
    body: data,
  })
}
describe("Settings logo upload endpoint", () => {
  it("rejects an unauthorized request before reading or uploading files", async () => {
    mocks.auth.mockRejectedValue(new Error("unauthorized"))
    expect((await POST(request())).status).toBe(401)
    expect(mocks.upload).not.toHaveBeenCalled()
  })
  it("rejects cross-origin uploads", async () => {
    expect((await POST(request(1, "https://external.test"))).status).toBe(403)
    expect(mocks.upload).not.toHaveBeenCalled()
  })
  it.each([0, 2])("requires exactly one file: %s", async (count) => {
    expect((await POST(request(count))).status).toBe(400)
    expect(mocks.upload).not.toHaveBeenCalled()
  })
  it("limits request bytes even without Content-Length", async () => {
    const result = await POST(
      new Request("http://localhost:3000/api/admin/settings/logo", {
        method: "POST",
        body: new Uint8Array(3 * 1024 * 1024),
      })
    )
    expect(result.status).toBe(400)
    expect(mocks.upload).not.toHaveBeenCalled()
  })
  it("returns a validation error for malformed multipart data", async () => {
    const result = await POST(
      new Request("http://localhost:3000/api/admin/settings/logo", {
        method: "POST",
        headers: { "Content-Type": "multipart/form-data; boundary=missing" },
        body: "not multipart",
      })
    )
    expect(result.status).toBe(400)
    expect(mocks.upload).not.toHaveBeenCalled()
  })
  it("returns private JSON and revalidates the published site", async () => {
    const result = await POST(request())
    expect(result.status).toBe(200)
    expect(result.headers.get("Cache-Control")).toBe("private, no-store")
    expect(await result.json()).toEqual({
      logo: { id: "900", url: "/uploads/logo.webp" },
    })
    expect(mocks.revalidate).toHaveBeenCalledWith("/", "layout")
  })
  it("does not expose internal storage errors", async () => {
    mocks.upload.mockRejectedValue(new Error("private database details"))
    expect(await (await POST(request())).json()).toEqual({
      error: "admin.settings.logo.upload_error",
    })
  })
})
