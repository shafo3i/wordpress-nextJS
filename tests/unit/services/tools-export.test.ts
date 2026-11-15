vi.mock("@/lib/rate-limit", async (load) => ({
  ...await load<typeof import("@/lib/rate-limit")>(),
  checkCmsRateLimit: vi.fn().mockResolvedValue({ success: true, remaining: 1, retryAfter: 0 }),
}))
import { afterEach, describe, expect, it, vi } from "vitest"
import { XMLValidator } from "fast-xml-parser"
import { getTableName } from "drizzle-orm"
vi.mock("server-only", () => ({}))
vi.mock("@/lib/authMIddleware", () => ({
  verifyAdmin: async () => ({ user: { id: "admin", role: "admin" } }),
}))
vi.mock("@/db", () => {
  const db = {
    execute: async () => ({ rows: [] }),
    select: () => ({
      from: (table: Parameters<typeof getTableName>[0]) => {
        const rows =
          getTableName(table) === "wp_posts"
            ? [
                {
                  id: BigInt(12),
                  postTitle: "Editor's article",
                  postContent: "safe",
                  postType: "post",
                  postAuthor: "author-a",
                  postName: "article",
                  postParent: BigInt(0),
                  menuOrder: 0,
                  postStatus: "draft",
                },
              ]
            : getTableName(table) === "user"
              ? [
                  {
                    id: "author-a",
                    name: "Author Display",
                    email: "author@example.test",
                  },
                ]
              : []
        const query = {
          where: () => query,
          innerJoin: () => query,
          orderBy: () => query,
          limit: () => query,
          then: (resolve: (value: unknown) => unknown) =>
            Promise.resolve(rows).then(resolve),
        }
        return query
      },
    }),
    transaction: async (work: (tx: unknown) => unknown) => work(db),
  }
  return { db }
})
import {
  exportSqlDump,
  exportJsonArchive,
  exportWxrXml,
} from "@/services/export.service"
describe("Tools content exports", () => {
  it("uses physical PostgreSQL columns and escapes values", async () => {
    const sql = await exportSqlDump()
    expect(sql).toContain('"post_title"')
    expect(sql).not.toContain('"postTitle"')
    expect(sql).toContain("Editor''s article")
    expect(sql).not.toContain("row_security = off")
  })
  it("includes attachment metadata and relationships in its JSON contract", async () => {
    const archive = JSON.parse(await exportJsonArchive())
    expect(archive.data.metadata).toEqual([])
    expect(archive.data.relationships).toEqual([])
    expect(archive.scope).toBe("editorial-content")
  })
})

afterEach(() => vi.unstubAllEnvs())
it("generates valid WXR with matching stable author login references", async () => {
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://publication.test")
  const xml = await exportWxrXml()
  expect(XMLValidator.validate(xml)).toBe(true)
  expect(xml).toContain("<wp:author_id>1</wp:author_id>")
  expect(xml).toContain(
    "<wp:author_login><![CDATA[author-a]]></wp:author_login>"
  )
  expect(xml).toContain("<dc:creator><![CDATA[author-a]]></dc:creator>")
})
