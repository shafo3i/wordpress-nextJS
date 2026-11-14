vi.mock("@/lib/authMIddleware", () => ({ verifyAdmin: async () => ({ user: { role: "admin", id: "admin" } }), verifyPostEditor: async () => ({ user: { role: "admin", id: "admin" } }) }));
vi.mock("server-only", () => ({}))
import { beforeEach, describe, expect, it, vi } from "vitest"
import { PgDialect } from "drizzle-orm/pg-core"

const query = vi.hoisted(() => {
  const chain = {
    from: vi.fn(),
    innerJoin: vi.fn(),
    leftJoin: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
  }
  for (const key of [
    "from",
    "innerJoin",
    "leftJoin",
    "where",
    "orderBy",
  ] as const)
    chain[key].mockReturnValue(chain)
  chain.limit.mockResolvedValue([])
  return chain
})
vi.mock("@/db", () => ({ db: { select: () => query } }))
import {
  getPublishedPostBySlug,
  getPublishedPageBySlug,
  getPublishedPostsByCategory,
} from "@/lib/site-content"

describe("localized content slug lookup", () => {
  beforeEach(() => vi.clearAllMocks())
  const parameters = () =>
    new PgDialect().sqlToQuery(query.where.mock.calls[0][0]).params
  for (const [name, lookup] of [
    ["post", getPublishedPostBySlug],
    ["page", getPublishedPageBySlug],
  ] as const)
    it(`looks up decoded Arabic ${name} slugs from encoded route parameters`, async () => {
      const slug = "خبر-عربي"
      await lookup(encodeURIComponent(slug), "ar")
      expect(parameters()).toContain(slug)
      expect(parameters()).not.toContain(encodeURIComponent(slug))
    })
  it("decodes category route slugs", async () => {
    await getPublishedPostsByCategory(encodeURIComponent("أخبار"), 1, 10, "ar")
    expect(parameters()).toContain("أخبار")
  })
  it("handles malformed percent encoding without throwing", async () => {
    await getPublishedPostBySlug("news-%zz", "ar")
    expect(parameters()).toContain("news-%zz")
  })
})
