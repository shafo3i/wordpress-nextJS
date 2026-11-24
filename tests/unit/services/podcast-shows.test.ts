import { beforeEach, expect, it, vi } from "vitest"
import { PgDialect } from "drizzle-orm/pg-core"
import { wpTerms, wpTermTaxonomy } from "@/db/schema/cms-taxonomy"
import type { DB } from "@/db"
const mocks = vi.hoisted(() => ({ admin: vi.fn(), rate: vi.fn() }))
vi.mock("server-only", () => ({}))
vi.mock("@/db", () => ({ db: {} }))
vi.mock("@/lib/authMIddleware", () => ({ verifyAdmin: mocks.admin }))
vi.mock("@/lib/rate-limit", () => ({ checkCmsRateLimit: mocks.rate }))
import { podcastShowSchema } from "@/db/schema/cms-podcasts"
import {
  listPodcastShows,
  savePodcastShow,
  deletePodcastShow,
} from "@/services/podcast-show.service"

const input = {
  name: "Daily newsroom",
  slug: "daily",
  languageCode: "en",
  description: "A programme",
  status: "draft",
  presenters: "",
  website: "",
  artworkId: "",
}
beforeEach(() => {
  mocks.admin.mockReset().mockResolvedValue({ user: { id: "admin" } })
  mocks.rate.mockReset().mockResolvedValue(undefined)
})

it("rejects malformed IDs, unsafe website URLs, unknown statuses and oversized text", () => {
  for (const patch of [
    { id: "-1" },
    { artworkId: "1e3" },
    { website: "javascript:alert(1)" },
    { website: "https://user:pass@example.test" },
    { status: "publish" },
    { name: "x".repeat(201) },
    { languageCode: "../../en" },
  ])
    expect(podcastShowSchema.safeParse({ ...input, ...patch }).success).toBe(
      false
    )
  expect(podcastShowSchema.parse(input).status).toBe("draft")
})

it("enforces the admin guard before every query or mutation", async () => {
  mocks.admin.mockRejectedValue(new Error("denied"))
  const database = {} as DB
  await expect(listPodcastShows({}, database)).rejects.toThrow("denied")
  await expect(savePodcastShow(input, database)).rejects.toThrow("denied")
  await expect(deletePodcastShow("1", database)).rejects.toThrow("denied")
  expect(mocks.rate).not.toHaveBeenCalled()
})

function fakeDatabase(responses: unknown[][]) {
  const predicates: { sql: string; params: unknown[] }[] = []
  const writes: unknown[] = []
  const dialect = new PgDialect()
  const database = {
    execute: vi.fn().mockResolvedValue(undefined),
    select: vi.fn(() => {
      const response = responses.shift()
      if (!response) throw new Error("Unexpected select")
      const pending = Promise.resolve(response)
      const chain = {
        from: () => chain,
        innerJoin: () => chain,
        leftJoin: () => chain,
        orderBy: () => chain,
        limit: () => chain,
        offset: () => chain,
        for: () => chain,
        where: (condition: Parameters<PgDialect["sqlToQuery"]>[0]) => {
          predicates.push(dialect.sqlToQuery(condition))
          return chain
        },
        then: pending.then.bind(pending),
      }
      return chain
    }),
    insert: vi.fn((table: unknown) => ({
      values: (value: unknown) => {
        writes.push({ table, value })
        return {
          returning: async () => [
            { termId: BigInt(1), termTaxonomyId: BigInt(2) },
          ],
          onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
        }
      },
    })),
    update: vi.fn((table: unknown) => ({
      set: (value: unknown) => ({
        where: async () => {
          writes.push({ table, value })
        },
      }),
    })),
    delete: vi.fn((_table: unknown) => ({ where: vi.fn().mockResolvedValue(undefined) })),
    transaction: vi.fn(async (callback: (tx: unknown) => unknown) =>
      callback(database)
    ),
  }
  return {
    database: database as unknown as DB,
    predicates,
    writes,
    raw: database,
  }
}

it("scopes paginated queries to podcast shows and the selected language", async () => {
  const f = fakeDatabase([[{ total: 25 }], []])
  await expect(
    listPodcastShows({ language: "ar", page: "2", search: "news" }, f.database)
  ).resolves.toMatchObject({ items: [], total: 25, page: 2 })
  expect(
    f.predicates.every(
      (p) => p.params.includes("podcast_show") && p.params.includes("ar")
    )
  ).toBe(true)
})

it("clamps out-of-range pagination after a deletion", async () => {
  const f = fakeDatabase([[{ total: 0 }], []])
  await expect(listPodcastShows({ page: "999" }, f.database)).resolves.toMatchObject({ items: [], total: 0, page: 1 })
})

it("creates show, language and metadata together using existing tables", async () => {
  const f = fakeDatabase([[{ code: "en" }], []])
  await expect(savePodcastShow(input, f.database)).resolves.toBe("1")
  expect(f.raw.transaction).toHaveBeenCalledOnce()
  expect(f.writes).toHaveLength(4)
  expect(
    JSON.stringify(
      f.writes.map((w) => (w as { value: unknown }).value),
      (_, value) => (typeof value === "bigint" ? String(value) : value)
    )
  ).toContain("podcast_show")
  expect(mocks.rate).toHaveBeenCalledWith("admin", "write")
})

it("rejects editing or deleting a category ID as a show", async () => {
  const edit = fakeDatabase([[]])
  await expect(
    savePodcastShow({ ...input, id: "99" }, edit.database)
  ).rejects.toThrow("admin.podcasts.error.missing")
  const remove = fakeDatabase([[]])
  await expect(deletePodcastShow("99", remove.database)).rejects.toThrow(
    "admin.podcasts.error.missing"
  )
  expect(edit.writes).toHaveLength(0)
  expect(remove.raw.delete).not.toHaveBeenCalled()
})

it("blocks deleting a show referenced by content", async () => {
  const f = fakeDatabase([
    [{ id: BigInt(1), taxonomyId: BigInt(2) }],
    [],
    [{ id: BigInt(7) }],
  ])
  await expect(deletePodcastShow("1", f.database)).rejects.toThrow(
    "admin.podcasts.error.used"
  )
  expect(f.raw.delete).not.toHaveBeenCalled()
})

it("updates a show and its publication metadata in one transaction", async () => {
  const f = fakeDatabase([
    [{ id: BigInt(1), taxonomyId: BigInt(2) }],
    [],
    [{ code: "ar" }],
    [],
  ])
  await expect(
    savePodcastShow(
      { ...input, id: "1", languageCode: "ar", status: "published" },
      f.database
    )
  ).resolves.toBe("1")
  expect(f.raw.update).toHaveBeenCalledTimes(2)
  expect(
    f.writes.map((write) => (write as { value: unknown }).value)
  ).toContainEqual(
    expect.objectContaining({
      metaValue: expect.stringContaining('"status":"published"'),
    })
  )
})

it("rejects inactive languages, invalid artwork and conflicting slugs before any write", async () => {
  for (const [responses, patch, key] of [
    [[[]], {}, "language"],
    [[[{ code: "en" }], []], { artworkId: "9" }, "artwork"],
    [[[{ code: "en" }], [{ id: BigInt(7) }]], {}, "slug"],
  ] as const) {
    const f = fakeDatabase(responses.map((rows) => [...rows]))
    await expect(
      savePodcastShow({ ...input, ...patch }, f.database)
    ).rejects.toThrow(`admin.podcasts.error.${key}`)
    expect(f.writes).toHaveLength(0)
  }
})

it("deletes an unused show without deleting any media", async () => {
  const f = fakeDatabase([[{ id: BigInt(1), taxonomyId: BigInt(2) }], [], []])
  await deletePodcastShow("1", f.database)
  expect(f.raw.delete.mock.calls.map((call) => call[0])).toEqual([
    wpTermTaxonomy,
    wpTerms,
  ])
})
