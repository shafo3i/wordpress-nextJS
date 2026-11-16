import { describe, expect, it, vi } from "vitest"
import { PgDialect } from "drizzle-orm/pg-core"
vi.mock("server-only", () => ({}))
vi.mock("@/lib/authMIddleware", () => ({ verifyAdmin: vi.fn(), verifyAdminOrEditor: vi.fn() }))
const mocks = vi.hoisted(() => ({ select: vi.fn(), where: vi.fn() }))
vi.mock("@/db", () => ({ db: { select: mocks.select } }))
vi.mock("@/services/media-images.service", () => ({ getPostImageAssets: async () => new Map() }))
import { getPublishedPostsByCategory } from "@/lib/site-content"

describe("category publication boundary", () => {
  it("rechecks publication, password, scheduling and language when loading the selected article rows", async () => {
    const results = [[{ termId: BigInt(1), termTaxonomyId: BigInt(11), name: "News", slug: "news", count: 1 }], [], [{ total: 1 }], [{ id: BigInt(7), date: new Date() }]]
    mocks.select.mockImplementation(() => {
      const rows = results.shift() || []
      const chain = {
        from: () => chain, innerJoin: () => chain, leftJoin: () => chain,
        where: (condition: unknown) => { mocks.where(condition); return chain },
        groupBy: () => chain, orderBy: () => chain, limit: () => chain, offset: () => chain,
        then: Promise.resolve(rows).then.bind(Promise.resolve(rows)),
      }
      return chain
    })
    const result = await getPublishedPostsByCategory("news", 1, 5, "ar")
    expect(result.posts).toEqual([])
    const queries = mocks.where.mock.calls.map(([condition]) => new PgDialect().sqlToQuery(condition))
    const hydration = queries.find((query) => query.params.includes(BigInt(7)) && query.sql.includes('"wp_posts"."post_status"'))
    expect(hydration?.params).toContain("publish")
    expect(hydration?.params).toContain("")
    expect(hydration?.params).toContain("ar")
    expect(hydration?.sql).toContain("post_date_gmt")
  })
})
