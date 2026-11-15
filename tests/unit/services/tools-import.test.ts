import { beforeEach, describe, expect, it, vi } from "vitest"
const mocks = vi.hoisted(() => ({
  guard: vi.fn(),
  execute: vi.fn(),
  select: vi.fn(),
  insert: vi.fn(),
}))
vi.mock("server-only", () => ({}))
vi.mock("@/lib/authMIddleware", () => ({ verifyAdmin: mocks.guard }))
vi.mock("@/db", () => ({
  db: {
    select: mocks.select,
    execute: mocks.execute,
    insert: mocks.insert,
    transaction: async (fn: (tx: unknown) => unknown) =>
      fn({
        select: mocks.select,
        execute: mocks.execute,
        insert: mocks.insert,
      }),
  },
}))
import { importJsonArchive, importWxrXml } from "@/services/import.service"
beforeEach(() => {
  vi.clearAllMocks()
  mocks.guard.mockResolvedValue({ user: { id: "admin", role: "admin" } })
  mocks.select.mockImplementation(() => {
    throw new Error("database touched")
  })
})
describe("import file validation", () => {
  it.each([
    JSON.stringify({
      data: { posts: [{ postType: "nav_menu_item", postName: "evil" }] },
    }),
    JSON.stringify({
      data: {
        posts: [{ postType: "post", postName: "evil", postDate: "not-date" }],
      },
    }),
  ])(
    "rejects unsupported archive rows before database access",
    async (value) => {
      await expect(importJsonArchive(value, "forged")).rejects.toThrow()
      expect(mocks.select).not.toHaveBeenCalled()
      expect(mocks.insert).not.toHaveBeenCalled()
    }
  )
  it("rejects DTD/entity XML before database access", async () => {
    await expect(
      importWxrXml(
        '<!DOCTYPE rss [<!ENTITY exploit "bad">]><rss><channel/></rss>',
        "admin"
      )
    ).rejects.toThrow()
    expect(mocks.select).not.toHaveBeenCalled()
  })
  it("rejects non-WXR XML before database access", async () => {
    await expect(
      importWxrXml(
        "<rss><channel><item><title>fake</title></item></channel></rss>",
        "admin"
      )
    ).rejects.toThrow()
    expect(mocks.select).not.toHaveBeenCalled()
  })
})
