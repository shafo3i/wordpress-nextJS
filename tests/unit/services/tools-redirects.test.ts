vi.mock("@/lib/rate-limit", async (load) => ({
  ...await load<typeof import("@/lib/rate-limit")>(),
  checkCmsRateLimit: vi.fn().mockResolvedValue({ success: true, remaining: 1, retryAfter: 0 }),
}))
﻿import { beforeEach, describe, expect, it, vi } from "vitest"
const mocks = vi.hoisted(() => ({ guard: vi.fn(), raw: "[]", writes: vi.fn() }))
vi.mock("server-only", () => ({}))
vi.mock("@/lib/authMIddleware", () => ({ verifyAdmin: mocks.guard }))
vi.mock("@/db", () => {
  const database = {
    select: () => ({
      from: () => ({
        where: () => ({ limit: async () => [{ optionValue: mocks.raw }] }),
      }),
    }),
    execute: vi.fn(),
    update: () => ({
      set: (data: { optionValue: string }) => ({
        where: async () => {
          mocks.writes(data)
          mocks.raw = data.optionValue
        },
      }),
    }),
    insert: () => ({
      values: (data: { optionValue: string }) => ({
        onConflictDoUpdate: async () => {
          mocks.writes(data)
          mocks.raw = data.optionValue
        },
      }),
    }),
    transaction: async (work: (tx: unknown) => unknown) => work(database),
  }
  return { db: database }
})
import {
  createRedirect,
  findMatchingRedirect,
} from "@/services/redirect.service"
beforeEach(() => {
  mocks.raw = "[]"
  vi.clearAllMocks()
  mocks.guard.mockResolvedValue({ user: { id: "admin", role: "admin" } })
})
describe("redirect security and logic", () => {
  it("public lookup works without administrator login", async () => {
    await createRedirect({
      sourcePath: "/old",
      targetUrl: "/new",
      statusCode: 301,
    })
    mocks.guard.mockRejectedValue(new Error("denied"))
    expect(await findMatchingRedirect("/old")).toMatchObject({
      targetUrl: "/new",
    })
  })
  it("rejects script targets before writing", async () => {
    await expect(
      createRedirect({
        sourcePath: "/old",
        targetUrl: "javascript:alert(1)",
        statusCode: 301,
      })
    ).rejects.toThrow()
    expect(mocks.writes).not.toHaveBeenCalled()
  })
  it("rejects loops and duplicate sources", async () => {
    await createRedirect({ sourcePath: "/a", targetUrl: "/b", statusCode: 301 })
    await expect(
      createRedirect({ sourcePath: "/b", targetUrl: "/a", statusCode: 301 })
    ).rejects.toThrow()
    await expect(
      createRedirect({ sourcePath: "/a/", targetUrl: "/c", statusCode: 301 })
    ).rejects.toThrow()
  })
  it("never serves unsafe legacy redirects", async () => {
    mocks.raw = JSON.stringify([
      {
        id: "legacy",
        sourcePath: "/bad",
        targetUrl: "javascript:alert(1)",
        statusCode: 301,
        hits: 0,
        createdAt: new Date().toISOString(),
      },
    ])
    expect(await findMatchingRedirect("/bad")).toBeNull()
  })
})
