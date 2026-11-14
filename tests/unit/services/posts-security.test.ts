import { beforeEach, describe, expect, it, vi } from "vitest"
import { PgDialect } from "drizzle-orm/pg-core"
import type { SQL } from "drizzle-orm"
import type { DB } from "@/db"
import { wpPosts, wpPostmeta } from "@/db/schema"
const mocks = vi.hoisted(() => ({
  guard: vi.fn(),
  admin: vi.fn(),
  language: vi.fn(),
}))
vi.mock("server-only", () => ({}))
vi.mock("@/db", () => ({ db: {} }))
vi.mock("@/lib/authMIddleware", () => ({
  verifyPostEditor: mocks.guard,
  verifyAdmin: mocks.admin,
}))
vi.mock("@/services/language.service", () => ({
  getDefaultLanguage: async () => ({ code: "en" }),
  getPostLanguage: async () => null,
  setPostLanguage: mocks.language,
}))
import {
  createPost,
  updatePost,
  deletePosts,
  trashPosts,
  restorePosts,
  getPosts,
  getPostById,
  getPostCounts,
  getAllCategoriesOptions,
  getAllTagOptions,
  getPostMonths,
  uniquePostSlug,
} from "@/services/post.service"
import {
  getPostAutosave,
  savePostAutosave,
  deletePostAutosave,
} from "@/services/post-autosave.service"
import { editorSnapshot } from "../../fixtures/post-autosave"
import {
  createPostEditorSchema,
  postIdsSchema,
} from "@/db/schema/cms-post-editor"
function databaseWith(selects: unknown[][], inserted: unknown[][] = []) {
  const dialect = new PgDialect()
  const predicates: { sql: string; params: unknown[] }[] = []
  const writes: {
    table: unknown
    values?: Record<string, unknown> | unknown[]
    sql?: string
    params?: unknown[]
  }[] = []
  const tx = {
    execute: vi.fn().mockResolvedValue(undefined),
    select: vi.fn(() => {
      const rows = selects.shift()
      if (!rows) throw new Error("Unexpected query")
      const pending = Promise.resolve(rows)
      const chain = {
        from: () => chain,
        innerJoin: () => chain,
        leftJoin: () => chain,
        orderBy: () => chain,
        offset: () => chain,
        groupBy: () => chain,
        limit: () => chain,
        for: () => chain,
        where: (condition: SQL) => {
          predicates.push(dialect.sqlToQuery(condition))
          return chain
        },
        then: pending.then.bind(pending),
      }
      return chain
    }),
    insert: vi.fn((table) => ({
      values: (values: Record<string, unknown> | unknown[]) => {
        writes.push({ table, values })
        const result = Promise.resolve(inserted.shift() || [])
        return { then: result.then.bind(result), returning: () => result }
      },
    })),
    update: vi.fn((table) => ({
      set: (values: Record<string, unknown>) => ({
        where: async (condition: SQL) => {
          writes.push({ table, values, ...dialect.sqlToQuery(condition) })
        },
      }),
    })),
    delete: vi.fn((table) => ({
      where: async (condition: SQL) => {
        writes.push({ table, ...dialect.sqlToQuery(condition) })
      },
    })),
  }
  let committed = false
  const transaction = vi.fn(async (callback: (tx: unknown) => unknown) => {
    const result = await callback(tx)
    committed = true
    return result
  })
  const database = { ...tx, transaction } as unknown as DB
  return {
    database,
    tx,
    predicates,
    writes,
    transaction,
    committed: () => committed,
  }
}

const existing = {
  id: BigInt(1),
  status: "draft",
  postTitle: "Old title",
  slug: "original-slug",
  modified: new Date("2026-01-01T00:00:00Z"),
}
beforeEach(() => {
  vi.resetAllMocks()
  mocks.guard.mockResolvedValue({ user: { id: "staff", role: "admin" } })
  mocks.admin.mockResolvedValue({ user: { id: "staff", role: "admin" } })
  mocks.language.mockResolvedValue(undefined)
})
describe("Posts service boundaries", () => {
  it("requires staff/admin authorization before all protected service calls", async () => {
    mocks.guard.mockRejectedValue(Error("Forbidden"))
    mocks.admin.mockRejectedValue(Error("Forbidden"))
    const test = databaseWith([])
    for (const run of [
      () => createPost({ title: "Title" }, test.database),
      () => updatePost("1", {}, test.database),
      () => deletePosts(["1"], test.database),
      () => trashPosts(["1"], test.database),
      () => restorePosts(["1"], test.database),
      () => getPosts({}, test.database),
      () => getPostById("1", test.database),
      () => getPostCounts({}, test.database),
      () => getAllCategoriesOptions(undefined, test.database),
      () => getAllTagOptions(test.database),
      () => getPostMonths(test.database),
      () => uniquePostSlug("title", undefined, test.database),
    ])
      await expect(run()).rejects.toThrow("Forbidden")
    expect(test.tx.select).not.toHaveBeenCalled()
    expect(test.transaction).not.toHaveBeenCalled()
  })
  it.each([
    "javascript:alert(1)",
    "https://youtube.com.evil.test/watch?v=dQw4w9WgXcQ",
    "data:text/html,bad",
    "//evil.test/video.mp4",
  ])(
    "rejects invalid featured video %s before writes",
    async (featuredVideoUrl) => {
      const test = databaseWith([])
      await expect(
        createPost({ title: "Title", featuredVideoUrl }, test.database)
      ).rejects.toThrow()
      expect(test.transaction).not.toHaveBeenCalled()
    }
  )
  it("bounds bodies, batches, statuses and metadata", () => {
    expect(
      createPostEditorSchema.safeParse({
        title: "Title",
        content: "a".repeat(2_000_001),
      }).success
    ).toBe(false)
    expect(
      createPostEditorSchema.safeParse({
        title: "Title",
        status: "administrator",
      }).success
    ).toBe(false)
    expect(postIdsSchema.safeParse(Array(101).fill("1")).success).toBe(false)
    expect(
      createPostEditorSchema.safeParse({
        title: "Title",
        seo: { seoCanonical: "javascript:alert(1)" },
      }).success
    ).toBe(false)
  })
  it("takes authorship and permission restrictions from the session, ignoring forged flags", async () => {
    const test = databaseWith([[], []], [[{ id: BigInt(9) }]])
    await createPost(
      {
        title: "Title",
        authorId: "victim",
        editorRestricted: false,
        content: '<p onclick="alert(1)">Safe</p><script>alert(1)</script>',
        featuredVideoUrl: "https://youtu.be/dQw4w9WgXcQ",
        languageCode: "en",
      },
      test.database
    )
    const insert = test.writes.find((write) => write.table === wpPosts)
      ?.values as Record<string, unknown>
    expect(insert.postAuthor).toBe("staff")
    expect(insert.postContent).toBe("<p>Safe</p>")
    expect(test.committed()).toBe(true)
    const video = test.writes.find(
      (write) =>
        write.table === wpPostmeta &&
        (write.values as Record<string, unknown>)?.metaKey ===
          "_featured_video_url"
    )?.values as Record<string, unknown>
    expect(video.metaValue).toBe(
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"
    )
  })
  it("cannot disable editor lifecycle restrictions with caller flags", async () => {
    mocks.guard.mockResolvedValue({ user: { id: "editor", role: "editor" } })
    const test = databaseWith([])
    await expect(
      createPost(
        { title: "Title", status: "trash", editorRestricted: false },
        test.database
      )
    ).rejects.toThrow()
    expect(test.transaction).not.toHaveBeenCalled()
  })
  it.each(["delete", "update"])(
    "rejects non-post %s IDs before related mutations",
    async (kind) => {
      const test = databaseWith([[]])
      await expect(
        kind === "delete"
          ? deletePosts(["5"], test.database)
          : updatePost(
              "5",
              { title: "Title", featuredVideoUrl: "" },
              test.database
            )
      ).rejects.toThrow()
      expect(test.writes).toHaveLength(0)
      expect(test.predicates[0].params).toContain("post")
    }
  )
  it("rejects mixed destructive batches atomically", async () => {
    const test = databaseWith([[{ id: BigInt(1), status: "trash" }]])
    await expect(deletePosts(["1", "2"], test.database)).rejects.toThrow(
      "missing_posts"
    )
    expect(test.writes).toHaveLength(0)
  })
  it("requires Trash before permanent deletion", async () => {
    const test = databaseWith([[existing]])
    await expect(deletePosts(["1"], test.database)).rejects.toThrow(
      "invalid_status"
    )
    expect(test.writes).toHaveLength(0)
  })
  it("rejects invalid featured images before writing post content", async () => {
    const test = databaseWith([[existing], []])
    await expect(
      updatePost("1", { title: "Title", featuredImageId: "2" }, test.database)
    ).rejects.toThrow("invalid_image")
    expect(test.writes).toHaveLength(0)
  })
  it("rejects stale full saves before mutating content", async () => {
    const test = databaseWith([[existing]])
    await expect(
      updatePost(
        "1",
        { title: "Title", expectedModified: "2025-01-01T00:00:00.000Z" },
        test.database
      )
    ).rejects.toThrow("post_changed")
    expect(test.writes).toHaveLength(0)
  })
  it("preserves omitted image/video, status, slug, password and content on partial updates", async () => {
    const test = databaseWith([[existing]])
    await updatePost("1", { title: "Changed" }, test.database)
    expect(test.writes).toHaveLength(1)
    const values = test.writes[0].values as Record<string, unknown>
    for (const key of ["postName", "postStatus", "postPassword", "postContent"])
      expect(values).not.toHaveProperty(key)
  })
  it("clears only its own explicit featured-video metadata", async () => {
    const test = databaseWith([[existing]])
    await updatePost("1", { featuredVideoUrl: "" }, test.database)
    expect(test.writes[1].params).toEqual([BigInt(1), "_featured_video_url"])
  })
  it("rolls back creation when language assignment fails", async () => {
    mocks.language.mockRejectedValue(Error("language failed"))
    const test = databaseWith([[], []], [[{ id: BigInt(9) }]])
    await expect(
      createPost({ title: "Title", languageCode: "en" }, test.database)
    ).rejects.toThrow("language failed")
    expect(test.committed()).toBe(false)
  })
  it("keeps suffixes for colliding maximum-length slugs", async () => {
    const test = databaseWith([[{ id: BigInt(1) }], []])
    expect(
      await uniquePostSlug("a".repeat(200), undefined, test.database)
    ).toBe("a".repeat(198) + "-2")
  })
  it("rejects another account's autosaves before accessing storage", async () => {
    const test = databaseWith([])
    const packet = {
      ownerId: "victim",
      documentKey: "post:1",
      expectedVersion: 0,
      baseModified: "",
      snapshot: editorSnapshot(),
    }
    for (const run of [
      () => getPostAutosave("victim", "post:1", test.database),
      () => savePostAutosave("victim", packet, test.database),
      () => deletePostAutosave("victim", "post:1", undefined, test.database),
    ])
      await expect(run()).rejects.toMatchObject({ code: "forbidden" })
    expect(test.tx.select).not.toHaveBeenCalled()
    expect(test.transaction).not.toHaveBeenCalled()
  })
  it("rejects malformed autosave keys and oversized snapshots directly at the service", async () => {
    const test = databaseWith([])
    await expect(
      getPostAutosave("staff", "post:../../", test.database)
    ).rejects.toThrow()
    await expect(
      savePostAutosave(
        "staff",
        {
          ownerId: "staff",
          documentKey: "post:1",
          expectedVersion: 0,
          baseModified: "",
          snapshot: editorSnapshot({ content: "a".repeat(2_000_001) }),
        },
        test.database
      )
    ).rejects.toThrow()
    expect(test.transaction).not.toHaveBeenCalled()
  })
})
