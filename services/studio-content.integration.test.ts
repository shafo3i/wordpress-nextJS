import "dotenv/config"
import { beforeAll, afterAll, describe, expect, it, vi } from "vitest"
import { Client } from "pg"
import { drizzle } from "drizzle-orm/node-postgres"
import type { DB } from "@/db"
import {
  getStudioCategories,
  getStudioDocumentContent,
  getStudioWidgetContent,
} from "./studio-content.service"
import type { StudioDocumentData } from "@/lib/studio/types"

vi.mock("@/db", () => ({ db: {} }))
describe.runIf(process.env.STUDIO_INTEGRATION === "1")(
  "seeded Studio feeds (read-only PostgreSQL)",
  () => {
    let client: Client
    let database: DB
    let businessId: string
    beforeAll(async () => {
      client = new Client({
        connectionString: process.env.DATABASE_URL,
        connectionTimeoutMillis: 10_000,
      })
      await client.connect()
      await client.query("BEGIN READ ONLY")
      database = drizzle({ client }) as unknown as DB
      const marker = await client.query(
        "select option_value from wp_options where option_name='studio_seed_version'"
      )
      expect(marker.rows[0]?.option_value).toBe("bilingual-1")
      businessId = (await getStudioCategories(database)).find(
        (category) => category.slug === "business"
      )!.id
    }, 15000)
    afterAll(async () => {
      if (client) {
        await client.query("ROLLBACK")
        await client.end()
      }
    })

    it("finds Business articles beyond the shared latest-25 list", async () => {
      const latest = await getStudioWidgetContent(
        { locale: "en", pageSize: 25 },
        database
      )
      expect(
        latest.items.some((post) => post.slug.startsWith("business-"))
      ).toBe(false)
      const business = await getStudioWidgetContent(
        { locale: "en", categoryId: businessId, pageSize: 100 },
        database
      )
      expect(business.total).toBe(12)
      expect(business.items).toHaveLength(12)
      expect(
        business.items.every(
          (post) => post.locale === "en" && post.categories.includes("Business")
        )
      ).toBe(true)
    })
    it("has balanced translation pairs and language-correct category assignments", async () => {
      const duplicate = await client.query(
        "select translation_group_id,language_code from cms_post_translations group by 1,2 having count(*)>1"
      )
      const mixed = await client.query(
        "select count(*)::int as total from wp_term_relationships r join cms_post_translations p on p.post_id=r.object_id join cms_term_translations t on t.term_taxonomy_id=r.term_taxonomy_id where p.language_code<>t.language_code"
      )
      expect(duplicate.rows).toEqual([])
      expect(mixed.rows[0].total).toBe(0)
    })

    it("uses the English Business selection to fetch only Arabic Business posts", async () => {
      const result = await getStudioWidgetContent(
        { locale: "ar", categoryId: businessId, pageSize: 100 },
        database
      )
      expect(result.total).toBe(12)
      expect(result.direction).toBe("rtl")
      expect(result.category?.name).toBe("الأعمال")
      expect(
        result.items.every(
          (post) => post.locale === "ar" && post.categories.includes("الأعمال")
        )
      ).toBe(true)
    })
    it("resolves translated slugs in the opposite direction", async () => {
      const result = await getStudioWidgetContent(
        { locale: "en", categorySlug: "اعمال" },
        database
      )
      expect(result.category?.name).toBe("Business")
      expect(result.total).toBe(12)
    })
    it("never substitutes other categories for an empty or missing selection", async () => {
      const empty = await getStudioWidgetContent(
        { locale: "ar", categorySlug: "education" },
        database
      )
      expect(empty.items).toEqual([])
      expect(empty.categoryMissing).toBe(false)
      const missing = await getStudioWidgetContent(
        { locale: "ar", categorySlug: "does-not-exist" },
        database
      )
      expect(missing.items).toEqual([])
      expect(missing.categoryMissing).toBe(true)
    })
    it("applies featured-only filtering without falling back to regular posts", async () => {
      const result = await getStudioWidgetContent(
        {
          locale: "ar",
          categoryId: businessId,
          featuredOnly: true,
          pageSize: 100,
        },
        database
      )
      expect(result.items).toHaveLength(2)
      expect(result.items.every((post) => post.isFeatured)).toBe(true)
    })
    it("paginates and sorts while excluding drafts/private/future/pending fixtures", async () => {
      const one = await getStudioWidgetContent(
        { locale: "en", categoryId: businessId, pageSize: 5, sort: "oldest" },
        database
      )
      const two = await getStudioWidgetContent(
        {
          locale: "en",
          categoryId: businessId,
          pageSize: 5,
          sort: "oldest",
          page: 2,
        },
        database
      )
      expect(one.total).toBe(12)
      expect(one.items[0].slug).toBe("business-1-en")
      expect(two.items[0].slug).toBe("business-6-en")
      expect(
        [...one.items, ...two.items].some((post) =>
          post.slug.startsWith("seed-")
        )
      ).toBe(false)
    })
    it("rejects unknown languages without returning default-language content", async () => {
      await expect(
        getStudioWidgetContent({ locale: "zz" }, database)
      ).rejects.toThrow("invalid_locale")
    })

    it("keeps a page editable if one widget refers to an unavailable language", async () => {
      const { createStudioElement } = await import("@/lib/studio/tree-helpers")
      const element = createStudioElement("block_news_list")
      element.settings.blockConfig!.contentLocale = "zz"
      const result = await getStudioDocumentContent(
        { version: "1.0", pageTemplate: "studio_canvas", elements: [element] },
        "en",
        database
      )
      expect(Object.values(result.requests)).toEqual([])
      expect(Object.values(result.errors || {})).toEqual(["invalid_locale"])
    })
    it("prefetches the Arabic homepage using the same per-widget queries", async () => {
      const row = await client.query(
        "select m.meta_value from wp_postmeta m join wp_posts p on p.\"ID\"=m.post_id where p.post_name='home-ar' and m.meta_key='_studio_data'"
      )
      const snapshot = await getStudioDocumentContent(
        JSON.parse(row.rows[0].meta_value) as StudioDocumentData,
        "ar",
        database
      )
      const results = Object.values(snapshot.requests)
      expect(results.length).toBe(5)
      expect(
        results.every(
          (result) =>
            result.locale === "ar" &&
            result.items.every((item) => item.locale === "ar")
        )
      ).toBe(true)
      expect(
        results.find((result) => result.category?.name === "الأعمال")?.total
      ).toBe(12)
      expect(
        results.find((result) => result.category?.name === "التعليم")?.items
      ).toEqual([])
    })
  }
)
