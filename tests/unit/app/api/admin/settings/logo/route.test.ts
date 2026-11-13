import { beforeEach, describe, expect, it, vi } from "vitest"
import { POST } from "@/app/api/admin/settings/logo/route"

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  upload: vi.fn(),
  revalidate: vi.fn(),
}))
vi.mock("@/auth", () => ({ auth: { api: { getSession: mocks.auth } } }))
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }))
vi.mock("@/services/site-logo.service", () => ({
  SiteLogoError: class SiteLogoError extends Error {},
}))
vi.mock("@/services/site-logo-upload.service", () => ({
  uploadSiteLogo: mocks.upload,
}))
beforeEach(() => {
  vi.clearAllMocks()
  vi.unstubAllEnvs()
  mocks.auth.mockResolvedValue({ user: { id: "admin", role: "admin" } })
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
  it("denies editors access to site identity changes", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "editor", role: "editor" } })
    expect((await POST(request())).status).toBe(403)
    expect(mocks.upload).not.toHaveBeenCalled()
  })
  it("rejects an unauthorized request before reading or uploading files", async () => {
    mocks.auth.mockResolvedValue(null)
    expect((await POST(request())).status).toBe(401)
    expect(mocks.upload).not.toHaveBeenCalled()
  })
  it("rejects cross-origin uploads", async () => {
    const response = await POST(request(1, "https://external.test"))
    expect(response.status).toBe(403)
    expect(await response.json()).toEqual({
      error: "admin.settings.logo.origin_rejected",
    })
    expect(mocks.upload).not.toHaveBeenCalled()
  })
  it("does not describe a session-service failure as being signed out", async () => {
    mocks.auth.mockRejectedValue(new Error("Database unavailable"))
    const response = await POST(request())
    expect(response.status).toBe(503)
    expect(await response.json()).toEqual({
      error: "admin.settings.logo.session_unavailable",
    })
    expect(mocks.upload).not.toHaveBeenCalled()
  })
  it("rejects a signed-in subscriber with a permission error", async () => {
    mocks.auth.mockResolvedValue({
      user: { id: "subscriber", role: "subscriber" },
    })
    const response = await POST(request())
    expect(response.status).toBe(403)
    expect(await response.json()).toEqual({
      error: "admin.settings.logo.forbidden",
    })
    expect(mocks.upload).not.toHaveBeenCalled()
  })
  it.each(["admin"])(
    "accepts %s uploads behind a reverse proxy using the configured public URL",
    async (role) => {
      vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://news.example.test")
      mocks.auth.mockResolvedValue({ user: { id: "user", role } })
      const form = new FormData()
      form.append(
        "file",
        new File(["image"], "logo.png", { type: "image/png" })
      )
      const uploadRequest = new Request(
        "http://internal-app:3000/api/admin/settings/logo",
        {
          method: "POST",
          headers: {
            Origin: "https://news.example.test",
            Cookie: "session=test",
            "Sec-Fetch-Site": "same-origin",
          },
          body: form,
        }
      )
      expect((await POST(uploadRequest)).status).toBe(200)
      expect(mocks.auth).toHaveBeenCalledWith({
        headers: uploadRequest.headers,
      })
      expect(mocks.upload).toHaveBeenCalledWith(expect.any(File), "user")
    }
  )
  it("does not trust forged forwarded headers or cross-site requests", async () => {
    const forged = request(1, "https://external.test")
    forged.headers.set("x-forwarded-host", "external.test")
    forged.headers.set("x-forwarded-proto", "https")
    expect((await POST(forged)).status).toBe(403)
    const crossSite = request()
    crossSite.headers.set("sec-fetch-site", "cross-site")
    expect((await POST(crossSite)).status).toBe(403)
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
