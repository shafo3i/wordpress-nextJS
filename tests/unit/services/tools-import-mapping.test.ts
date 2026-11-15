vi.mock("@/lib/rate-limit", async (load) => ({
  ...await load<typeof import("@/lib/rate-limit")>(),
  checkCmsRateLimit: vi.fn().mockResolvedValue({ success: true, remaining: 1, retryAfter: 0 }),
}))
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getTableName } from "drizzle-orm"
const mocks = vi.hoisted(() => ({
  writes: [] as Array<{ table: string; value: Record<string, unknown> }>,
  next: 100,
  fail: false,
}))
vi.mock("server-only", () => ({}))
vi.mock("@/lib/authMIddleware", () => ({
  verifyAdmin: async () => ({ user: { id: "verified-admin", role: "admin" } }),
}))
vi.mock("@/db", () => {
  const db = {
    execute: async () => ({ rows: [], rowCount: 0 }),
    select: () => ({
      from: (table: Parameters<typeof getTableName>[0]) => {
        const rows =
          getTableName(table) === "cms_languages"
            ? [{ code: "ar", isDefault: true, isActive: true }]
            : []
        const q = {
          where: () => q,
          limit: () => q,
          then: (resolve: (value: unknown) => unknown) =>
            Promise.resolve(rows).then(resolve),
        }
        return q
      },
    }),
    insert: (table: Parameters<typeof getTableName>[0]) => ({
      values: (value: Record<string, unknown>) => {
        if (mocks.fail && getTableName(table) === "wp_comments")
          throw new Error("write failure")
        mocks.writes.push({ table: getTableName(table), value })
        const q = {
          returning: async (shape: Record<string, unknown>) => [
            Object.fromEntries(
              Object.keys(shape).map((key) => [key, BigInt(++mocks.next)])
            ),
          ],
          onConflictDoNothing: async () => undefined,
          then: (resolve: (value: unknown) => unknown) =>
            Promise.resolve(undefined).then(resolve),
        }
        return q
      },
    }),
    update: () => ({ set: () => ({ where: async () => undefined }) }),
    transaction: async (work: (tx: unknown) => unknown) => {
      const snapshot = [...mocks.writes]
      try {
        return await work(db)
      } catch (error) {
        mocks.writes = snapshot
        throw error
      }
    },
  }
  return { db }
})
import { importJsonArchive, importWxrXml } from "@/services/import.service"
const archive = () =>
  JSON.stringify({
    data: {
      posts: [
        {
          id: "1",
          postTitle: "<b>Headline</b>",
          postName: "headline",
          postType: "post",
          postContent:
            "<p>Body</p><script>alert(1)</script><img src=x onerror=alert(1)>",
          postStatus: "draft",
        },
        {
          id: "2",
          postTitle: "Image",
          postName: "cover",
          postType: "attachment",
          postMimeType: "image/jpeg",
          guid: "/uploads/cover.jpg",
          postStatus: "inherit",
        },
      ],
      terms: [{ termId: "3", name: "Reports", slug: "reports" }],
      taxonomies: [{ termTaxonomyId: "4", termId: "3", taxonomy: "category" }],
      relationships: [{ objectId: "1", termTaxonomyId: "4" }],
      metadata: [{ postId: "1", metaKey: "_thumbnail_id", metaValue: "2" }],
      comments: [
        {
          commentId: "5",
          commentPostId: "1",
          commentContent: "Comment",
          commentApproved: "1",
        },
      ],
    },
  })
beforeEach(() => {
  mocks.writes = []
  mocks.next = 100
  mocks.fail = false
})
describe("editorial archive import mappings", () => {
  it("sanitizes content and remaps category/image/comment links to new IDs", async () => {
    const result = await importJsonArchive(archive(), "forged-author")
    expect(result).toMatchObject({
      postsImported: 1,
      categoriesImported: 1,
      commentsImported: 1,
    })
    const posts = mocks.writes.filter((item) => item.table === "wp_posts")
    expect(posts[0].value.postAuthor).toBe("verified-admin")
    expect(posts[0].value.postContent).not.toMatch(/<script|onerror/)
    expect(
      mocks.writes.find((item) => item.table === "wp_term_relationships")?.value
        .objectId
    ).not.toBe(BigInt(1))
    expect(
      mocks.writes.find((item) => item.table === "wp_postmeta")?.value.metaValue
    ).not.toBe("2")
    expect(
      mocks.writes.find((item) => item.table === "wp_comments")?.value
        .commentPostId
    ).not.toBe(BigInt(1))
    expect(
      mocks.writes.filter((item) => item.table === "cms_post_translations")
    ).toHaveLength(1)
  })
  it("rolls back all prior content on a later comment write failure", async () => {
    mocks.fail = true
    await expect(importJsonArchive(archive(), "admin")).rejects.toThrow(
      "write failure"
    )
    expect(mocks.writes).toEqual([])
  })
})

it("imports WXR category descriptions and original comment dates", async () => {
  const xml = `<?xml version="1.0"?><rss xmlns:wp="http://wordpress.org/export/1.2/" xmlns:content="http://purl.org/rss/1.0/modules/content/"><channel><wp:wxr_version>1.2</wp:wxr_version><wp:category><wp:term_id>3</wp:term_id><wp:cat_name>Reports</wp:cat_name><wp:category_nicename>reports</wp:category_nicename><wp:category_description>Section description</wp:category_description></wp:category><item><wp:post_id>10</wp:post_id><wp:post_type>post</wp:post_type><wp:status>draft</wp:status><title>Headline</title><wp:post_name>headline</wp:post_name><content:encoded><![CDATA[<p>Safe body</p>]]></content:encoded><category domain="category" nicename="reports">Reports</category><wp:comment><wp:comment_id>11</wp:comment_id><wp:comment_content>Original comment</wp:comment_content><wp:comment_date>2024-01-02 03:04:05</wp:comment_date><wp:comment_date_gmt>2024-01-02 03:04:05</wp:comment_date_gmt></wp:comment></item></channel></rss>`
  const result = await importWxrXml(xml, "forged-author")
  expect(result).toMatchObject({
    postsImported: 1,
    categoriesImported: 1,
    commentsImported: 1,
  })
  expect(
    mocks.writes.find((item) => item.table === "wp_term_taxonomy")?.value
      .description
  ).toBe("Section description")
  const date = mocks.writes.find((item) => item.table === "wp_comments")?.value
    .commentDate as Date
  expect(date.toISOString()).toBe("2024-01-02T03:04:05.000Z")
})
