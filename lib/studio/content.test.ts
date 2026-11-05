import { describe, expect, it } from "vitest"
import { QueryClient } from "@tanstack/react-query"
import { studioContentRequestSchema } from "@/db/schema/cms-studio-content"
import {
  getStudioCategoryOptions,
  resolveStudioCategorySelection,
  getStudioBlockTitle,
  getStudioContentRequest,
  studioContentRequestKey,
  getStudioDocumentRequests,
} from "./content"
import { createStudioElement } from "./tree-helpers"
import { studioContentQueryOptions } from "./content-query"
import { vi, afterEach } from "vitest"

const categories = [
  {
    id: "1",
    slug: "business",
    name: "Business",
    locale: "en",
    translationGroupId: "business",
  },
  {
    id: "2",
    slug: "اعمال",
    name: "الأعمال",
    locale: "ar",
    translationGroupId: "business",
  },
]
afterEach(() => vi.unstubAllGlobals())

describe("Studio language/category identity", () => {
  it("resolves an English category selection to its Arabic translation by group", () => {
    const block = createStudioElement("block_news_list").settings.blockConfig!
    block.categorySlug = "business"
    expect(resolveStudioCategorySelection(categories, block, "ar")).toEqual(
      categories[1]
    )
    expect(getStudioCategoryOptions(categories, "ar")).toEqual([categories[1]])
  })
  it("deduplicates category translations without substituting other topics", () => {
    const rows = [...categories, { ...categories[1], id: "3" }]
    expect(getStudioCategoryOptions(rows, "ar")).toEqual([categories[1]])
  })
  it("keeps heading translation tabs independent of article queries", () => {
    const block = createStudioElement("block_news_list").settings.blockConfig!
    const before = getStudioContentRequest(block, "en")
    block.titles = { ar: "أعمال" }
    expect(getStudioContentRequest(block, "en")).toEqual(before)
    expect(getStudioBlockTitle(block, "ar", "en")).toBe("أعمال")
    expect(
      getStudioBlockTitle(
        { ...block, titles: {}, title: "Business" },
        "ar",
        "en"
      )
    ).toBe("")
  })
  it("keys every category/language/count/sort/featured/page combination separately", () => {
    const base = studioContentRequestSchema.parse({ locale: "en" })
    const alternatives = [
      { ...base, locale: "ar" },
      { ...base, categoryId: "1" },
      { ...base, categorySlug: "business" },
      { ...base, pageSize: 10 },
      { ...base, featuredOnly: true },
      { ...base, page: 2 },
      { ...base, sort: "oldest" as const },
    ]
    expect(
      new Set([base, ...alternatives].map(studioContentRequestKey)).size
    ).toBe(8)
  })
  it.each([
    { locale: "en", categoryId: "abc" },
    { locale: "en", pageSize: 5000 },
    { locale: "ar", page: -1 },
    { locale: "all", featuredOnly: "maybe" },
  ])("rejects invalid requests without throwing outside Zod: %s", (request) => {
    expect(studioContentRequestSchema.safeParse(request).success).toBe(false)
  })
  it("deduplicates matching document feeds", () => {
    const one = createStudioElement("block_news_list")
    const two = createStudioElement("block_news_list")
    expect(
      getStudioDocumentRequests(
        { version: "1.0", pageTemplate: "studio_canvas", elements: [one, two] },
        "ar"
      )
    ).toHaveLength(1)
  })
})

describe("TanStack Studio content cache", () => {
  it("deduplicates equal requests and revives HTTP dates", async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        locale: "en",
        items: [{ date: "2026-10-01T08:00:00Z" }],
      }),
    })
    vi.stubGlobal("fetch", fetcher)
    const client = new QueryClient()
    const options = studioContentQueryOptions(
      studioContentRequestSchema.parse({
        locale: "en",
        categorySlug: "business",
      })
    )
    const [one, two] = await Promise.all([
      client.fetchQuery(options),
      client.fetchQuery(options),
    ])
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(one).toBe(two)
    expect(one.items[0].date).toBeInstanceOf(Date)
    expect(fetcher.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal)
    client.clear()
  })
})
