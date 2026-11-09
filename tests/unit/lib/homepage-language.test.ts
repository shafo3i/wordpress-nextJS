import { beforeEach, describe, expect, it, vi } from "vitest"
import { PgDialect } from "drizzle-orm/pg-core"

const mocks = vi.hoisted(() => {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {}
  for (const method of ["from", "innerJoin", "leftJoin", "where", "orderBy"])
    chain[method] = vi.fn(() => chain)
  chain.limit = vi.fn()
  return { chain, defaultLanguage: vi.fn() }
})
vi.mock("@/db", () => ({ db: { select: () => mocks.chain } }))
vi.mock("@/services/language.service", () => ({
  getDefaultLanguage: mocks.defaultLanguage,
}))
import { getPublishedPageById } from "@/lib/site-content"

describe("homepage language selection", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.chain.limit.mockReset()
  })
  it.each([
    ["ar", "en"],
    ["en", "ar"],
  ])(
    "resolves the %s default from a configured %s page",
    async (locale, source) => {
      mocks.defaultLanguage.mockResolvedValue({ code: locale })
      mocks.chain.limit
        .mockResolvedValueOnce([
          { translationGroupId: "home", languageCode: source },
        ])
        .mockResolvedValueOnce([{ postId: BigInt(2) }])
        .mockResolvedValueOnce([])
      await getPublishedPageById("1")
      const siblingQuery = new PgDialect().sqlToQuery(
        mocks.chain.where.mock.calls[1][0]
      )
      expect(siblingQuery.params).toContain(locale)
      expect(siblingQuery.params).toContain("page")
      const targetQuery = new PgDialect().sqlToQuery(
        mocks.chain.where.mock.calls[2][0]
      )
      expect(targetQuery.params).toContain(BigInt(2))
    }
  )
  it("honours explicit English when Arabic is default", async () => {
    mocks.defaultLanguage.mockResolvedValue({ code: "ar" })
    mocks.chain.limit
      .mockResolvedValueOnce([
        { translationGroupId: "home", languageCode: "en" },
      ])
      .mockResolvedValueOnce([])
    await getPublishedPageById("1", "en")
    expect(mocks.defaultLanguage).not.toHaveBeenCalled()
    expect(mocks.chain.where).toHaveBeenCalledTimes(2)
  })
  it("does not render a different language when the translation is missing", async () => {
    mocks.chain.limit
      .mockResolvedValueOnce([
        { translationGroupId: "home", languageCode: "en" },
      ])
      .mockResolvedValueOnce([])
    expect(await getPublishedPageById("1", "ar")).toBeNull()
    expect(mocks.chain.where).toHaveBeenCalledTimes(2)
  })
})
