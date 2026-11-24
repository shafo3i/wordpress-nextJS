import { beforeEach, expect, it, vi } from "vitest"
import { PgDialect } from "drizzle-orm/pg-core"
import type { DB } from "@/db"
import { wpPosts, wpPostmeta } from "@/db/schema/cms-posts"
import { wpTermRelationships } from "@/db/schema/cms-taxonomy"
const mocks = vi.hoisted(() => ({ guard: vi.fn(), rate: vi.fn() }))
vi.mock("server-only", () => ({}))
vi.mock("@/db", () => ({ db: {} }))
vi.mock("@/lib/authMIddleware", () => ({ verifyAdmin: mocks.guard }))
vi.mock("@/lib/rate-limit", () => ({ checkCmsRateLimit: mocks.rate }))
import { podcastEpisodeSchema } from "@/db/schema/cms-podcast-episodes"
import {
  savePodcastEpisode,
  deletePodcastEpisode,
} from "@/services/podcast-episode.service"
import {
  listPodcastEpisodes,
  getPodcastEpisode,
} from "@/services/podcast-episode-query.service"
const input = { postTitle: "Episode", showId: "2", languageCode: "en" }
beforeEach(() => {
  mocks.guard.mockReset().mockResolvedValue({ user: { id: "admin" } })
  mocks.rate.mockReset().mockResolvedValue(undefined)
})

it("allows incomplete drafts but requires valid media to publish", () => {
  expect(podcastEpisodeSchema.safeParse(input).success).toBe(true)
  expect(
    podcastEpisodeSchema.safeParse({ ...input, status: "publish" }).success
  ).toBe(false)
  for (const patch of [
    { audioUrl: "javascript:alert(1).mp3" },
    { videoUrl: "https://evil.test/embed/123" },
    { audioId: "-1" },
    { artworkId: "1e3" },
    { showId: "0" },
    { duration: "-1" },
    { season: "1.5" },
    { postTitle: "x".repeat(301) },
  ])
    expect(podcastEpisodeSchema.safeParse({ ...input, ...patch }).success).toBe(
      false
    )
  expect(
    podcastEpisodeSchema.safeParse({
      ...input,
      status: "publish",
      videoUrl: "https://youtu.be/4vOhXPaGsH0",
    }).success
  ).toBe(true)
})

it("requires administrators for all episode reads and mutations", async () => {
  mocks.guard.mockRejectedValue(new Error("denied"))
  const db = {} as DB
  await expect(listPodcastEpisodes({}, db)).rejects.toThrow("denied")
  await expect(getPodcastEpisode("1", db)).rejects.toThrow("denied")
  await expect(savePodcastEpisode(input, db)).rejects.toThrow("denied")
  await expect(deletePodcastEpisode("1", db)).rejects.toThrow("denied")
  expect(mocks.rate).not.toHaveBeenCalled()
})

function fakeDatabase(responses: unknown[][]) {
  const writes: {
    table: unknown
    value?: unknown
    sql?: string
    params?: unknown[]
  }[] = []
  const predicates: { sql: string; params: unknown[] }[] = []
  const dialect = new PgDialect()
  const database = {
    execute: vi.fn().mockResolvedValue(undefined),
    select: vi.fn(() => {
      const rows = responses.shift()
      if (!rows) throw new Error("Unexpected query")
      const pending = Promise.resolve(rows)
      const chain = {
        from: () => chain,
        innerJoin: () => chain,
        leftJoin: () => chain,
        orderBy: () => chain,
        limit: () => chain,
        offset: () => chain,
        for: () => chain,
        where: (sql: Parameters<PgDialect["sqlToQuery"]>[0]) => {
          predicates.push(dialect.sqlToQuery(sql))
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
          returning: async () => [{ id: BigInt(11) }],
          onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
        }
      },
    })),
    update: vi.fn((table: unknown) => ({
      set: (value: unknown) => ({
        where: async (sql: Parameters<PgDialect["sqlToQuery"]>[0]) => {
          writes.push({ table, value, ...dialect.sqlToQuery(sql) })
        },
      }),
    })),
    delete: vi.fn((table: unknown) => ({
      where: async (sql: Parameters<PgDialect["sqlToQuery"]>[0]) => {
        writes.push({ table, ...dialect.sqlToQuery(sql) })
      },
    })),
    transaction: vi.fn(async (callback: (db: unknown) => unknown) =>
      callback(database)
    ),
  }
  return {
    database: database as unknown as DB,
    writes,
    predicates,
    raw: database,
  }
}

it("rejects editing or deleting an ordinary post through episode services", async () => {
  const edit = fakeDatabase([[]])
  await expect(
    savePodcastEpisode({ ...input, id: "9" }, edit.database)
  ).rejects.toThrow("admin.podcasts.episode_error.missing")
  expect(edit.writes).toHaveLength(0)
  expect(edit.predicates[0].params).toContain("podcast_episode")
  const remove = fakeDatabase([[]])
  await expect(deletePodcastEpisode("9", remove.database)).rejects.toThrow(
    "admin.podcasts.episode_error.missing"
  )
  expect(remove.raw.delete).not.toHaveBeenCalled()
})

it("validates the selected show's language and type before writing", async () => {
  const f = fakeDatabase([[]])
  await expect(savePodcastEpisode(input, f.database)).rejects.toThrow(
    "admin.podcasts.episode_error.show"
  )
  expect(f.predicates[0].params).toContain("podcast_show")
  expect(f.predicates[0].params).toContain("en")
  expect(f.writes).toHaveLength(0)
})

it("saves an episode, media configuration, language and show association transactionally", async () => {
  const f = fakeDatabase([[{ id: BigInt(2) }], []])
  await expect(
    savePodcastEpisode(
      { ...input, status: "publish", videoUrl: "https://youtu.be/4vOhXPaGsH0" },
      f.database
    )
  ).resolves.toBe("11")
  const saved = f.writes.find(
    (write) =>
      (write.value as { postType?: string })?.postType === "podcast_episode"
  )
  expect(saved?.value).toMatchObject({
    postType: "podcast_episode",
    postStatus: "publish",
    postAuthor: "admin",
  })
  expect(
    JSON.stringify(
      f.writes.map((write) => write.value),
      (_, value) => (typeof value === "bigint" ? String(value) : value)
    )
  ).toContain("https://www.youtube-nocookie.com/embed/4vOhXPaGsH0")
  expect(mocks.rate).toHaveBeenCalledWith("admin", "write")
})

it("rejects a forged audio attachment before any mutation", async () => {
  const f = fakeDatabase([[{ id: BigInt(2) }], []])
  await expect(
    savePodcastEpisode({ ...input, audioId: "8" }, f.database)
  ).rejects.toThrow("admin.podcasts.episode_error.media")
  expect(f.writes).toHaveLength(0)
  expect(f.predicates[1].params).toContain("attachment")
  expect(f.predicates[1].params).toContain("audio/%")
})

it("resolves selected media from the attachment instead of trusting the supplied URL", async () => {
  const f = fakeDatabase([[{ id: BigInt(2) }], [{ guid: "/uploads/trusted.mp3" }], [], []])
  await savePodcastEpisode({ ...input, audioId: "8", audioUrl: "https://untrusted.test/other.mp3" }, f.database)
  const metadata = f.writes.find(write => write.table === wpPostmeta && write.value)
  expect(JSON.parse((metadata!.value as {metaValue: string}).metaValue)).toMatchObject({ audioId: "8", audioUrl: "/uploads/trusted.mp3" })
})

it("updates only an episode and preserves its original publication date", async () => {
  const date = new Date("2026-01-02T12:00:00.000Z")
  const f = fakeDatabase([[{ id: BigInt(11), status: "publish", date }], [{ id: BigInt(2) }], []])
  await savePodcastEpisode({ ...input, id: "11", status: "publish", videoUrl: "https://vimeo.com/12345" }, f.database)
  const update = f.writes.find(write => write.table === wpPosts && write.value)
  expect(update?.value).toMatchObject({ postDateGmt: date, postStatus: "publish" })
  expect(update?.params).toContain("podcast_episode")
})

it("deletes only the episode and its relationships, leaving attachments intact", async () => {
  const f = fakeDatabase([[{ id: BigInt(11), status: "draft", date: new Date() }]])
  await deletePodcastEpisode("11", f.database)
  expect(f.writes.map(write => write.table)).toEqual([wpTermRelationships, wpPosts])
  expect(f.writes[1].params).toContain("podcast_episode")
})

it("keeps episode list queries bounded and isolated by type, status and language", async () => {
  const f = fakeDatabase([[{ total: 0 }], []])
  await expect(listPodcastEpisodes({ language: "ar", status: "draft", page: "999" }, f.database)).resolves.toMatchObject({ items: [], total: 0, page: 1 })
  expect(f.predicates.every(predicate => predicate.params.includes("podcast_episode") && predicate.params.includes("draft") && predicate.params.includes("ar"))).toBe(true)
})

it("reads stored episode media, show association and transcript back into the editor", async () => {
  const f = fakeDatabase([
    [{ id: BigInt(11), postTitle: "Episode", postName: "episode", postContent: "Description", postExcerpt: "Summary", status: "draft", languageCode: "en" }],
    [{ value: JSON.stringify({ audioUrl: "/uploads/trusted.mp3", duration: 60, transcript: "<script>literal transcript text</script>" }) }],
    [{ id: BigInt(2), name: "Daily show" }],
  ])
  await expect(getPodcastEpisode("11", f.database)).resolves.toMatchObject({ id: "11", showId: "2", showName: "Daily show", duration: 60, audioUrl: "/uploads/trusted.mp3", transcript: "<script>literal transcript text</script>" })
})
