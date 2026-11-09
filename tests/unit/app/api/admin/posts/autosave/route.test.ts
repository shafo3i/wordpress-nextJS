import { beforeEach, describe, expect, it, vi } from "vitest"
import { editorSnapshot } from "../../../../../../fixtures/post-autosave"
const mocks = vi.hoisted(() => ({
  session: vi.fn(),
  load: vi.fn(),
  save: vi.fn(),
}))
vi.mock("next/headers", () => ({ headers: async () => new Headers() }))
vi.mock("@/auth", () => ({ auth: { api: { getSession: mocks.session } } }))
vi.mock("@/services/post-autosave.service", () => ({
  getPostAutosave: mocks.load,
  savePostAutosave: mocks.save,
  PostAutosaveError: class extends Error {
    constructor(
      public code: string,
      public status: number
    ) {
      super(code)
    }
  },
}))
import { GET, POST } from "@/app/api/admin/posts/autosave/route"
import { AUTOSAVE_MAX_BYTES } from "@/db/schema/cms-post-autosave"
import { PostAutosaveError } from "@/services/post-autosave.service"
const packet = () => ({
  ownerId: "editor-a",
  documentKey: "post:1",
  expectedVersion: 0,
  baseModified: "",
  snapshot: editorSnapshot(),
})
const request = (body: unknown, origin = "https://site.test") =>
  new Request("https://site.test/api/admin/posts/autosave", {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
beforeEach(() => {
  vi.clearAllMocks()
  mocks.session.mockResolvedValue({ user: { id: "editor-a", role: "editor" } })
  mocks.load.mockResolvedValue(null)
  mocks.save.mockResolvedValue({ version: 1 })
})
describe("post autosave endpoint", () => {
  it("accepts the configured public origin behind a reverse proxy", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://public.example")
    try {
      const response = await POST(new Request("http://internal:3000/api/admin/posts/autosave", { method: "POST", headers: { Origin: "https://public.example", "Content-Type": "application/json" }, body: JSON.stringify(packet()) }))
      expect(response.status).toBe(200)
    } finally { vi.unstubAllEnvs() }
  })
  it.each([null, { user: { id: "reader", role: "subscriber" } }])(
    "requires an editor session",
    async (session) => {
      mocks.session.mockResolvedValue(session)
      expect((await POST(request(packet()))).status).toBe(401)
      expect(
        (
          await GET(
            new Request(
              "https://site.test/api/admin/posts/autosave?documentKey=post:1&ownerId=editor-a"
            )
          )
        ).status
      ).toBe(401)
      expect(mocks.save).not.toHaveBeenCalled()
    }
  )
  it("rejects cross-origin and account-switched writes", async () => {
    expect((await POST(request(packet(), "https://outside.test"))).status).toBe(
      403
    )
    expect(
      (await POST(request({ ...packet(), ownerId: "editor-b" }))).status
    ).toBe(403)
    expect(mocks.save).not.toHaveBeenCalled()
  })
  it("limits payload size and validates identifiers", async () => {
    expect(
      (await POST(request({ ...packet(), documentKey: "post:abc" }))).status
    ).toBe(400)
    expect(
      (await POST(request({ content: "x".repeat(AUTOSAVE_MAX_BYTES) }))).status
    ).toBe(413)
    expect(mocks.save).not.toHaveBeenCalled()
  })
  it("sends published-post edits only to the private recovery service", async () => {
    const response = await POST(request(packet()))
    expect(response.status).toBe(200)
    expect(response.headers.get("Cache-Control")).toBe("no-store")
    expect(mocks.save).toHaveBeenCalledWith("editor-a", packet())
    expect(
      (
        await GET(
          new Request(
            "https://site.test/api/admin/posts/autosave?documentKey=post:1&ownerId=editor-b"
          )
        )
      ).status
    ).toBe(403)
  })
  it("reports version conflicts without accepting the stale write", async () => {
    mocks.save.mockRejectedValue(new PostAutosaveError("conflict", 409))
    const response = await POST(request(packet()))
    expect(response.status).toBe(409)
    expect(await response.json()).toEqual({ error: "conflict" })
  })
})
