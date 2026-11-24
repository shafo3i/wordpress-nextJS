import { expect, it, vi } from "vitest"
import { PgDialect } from "drizzle-orm/pg-core"
import type { DB } from "@/db"
vi.mock("server-only", () => ({}))
vi.mock("@/db", () => ({ db: {} }))
import {
  getPublicPodcastShow,
  getPublicPodcastEpisode,
  listPublicPodcastShows,
  listPublicPodcastEpisodes,
} from "@/services/podcast-public.service"

function database(rows: unknown[][]) {
  const execute = vi.fn()
  rows.forEach((value) => execute.mockResolvedValueOnce({ rows: value }))
  return { execute, db: { execute } as unknown as DB }
}
const show = {
  id: "1",
  name: "Programme",
  slug: "programme",
  description: "Text",
  config: JSON.stringify({
    status: "published",
    presenters: "Team",
    website: "",
    artworkId: "",
  }),
}
it("rejects invalid slugs and languages before accessing the database", async () => {
  const mock = database([])
  await expect(
    getPublicPodcastShow("../secret", "en", mock.db)
  ).rejects.toThrow()
  await expect(listPublicPodcastShows("../en", 1, mock.db)).rejects.toThrow()
  expect(mock.execute).not.toHaveBeenCalled()
})
it("public show SQL requires active language, show taxonomy and published metadata", async () => {
  const mock = database([[{ total: 1 }], [show]])
  const result = await listPublicPodcastShows("ar", 1, mock.db)
  expect(result.items).toHaveLength(1)
  const query = new PgDialect().sqlToQuery(mock.execute.mock.calls[1][0])
  expect(query.sql).toContain("podcast_show")
  expect(query.sql).toContain("is_active = true")
  expect(query.sql).toContain("published")
  expect(query.params).toContain("ar")
})
it("fails closed on malformed or draft show metadata", async () => {
  for (const config of ["invalid", '{"status":"draft"}']) {
    const mock = database([[{ ...show, config }]])
    expect(await getPublicPodcastShow("programme", "ar", mock.db)).toBeNull()
  }
})
it("episode queries scope the show, type, language and publication date with bounded pagination", async () => {
  const mock = database([[{ total: 1000000 }], []])
  await listPublicPodcastEpisodes("1", "ar", 99999, mock.db)
  const query = new PgDialect().sqlToQuery(mock.execute.mock.calls[1][0])
  expect(query.sql).toContain("podcast_episode")
  expect(query.sql).toContain("post_status = 'publish'")
  expect(query.sql).toContain("post_date_gmt <=")
  expect(query.sql).toContain("published")
  expect(query.params).toContain("1")
  expect(query.params).toContain("ar")
  expect(query.params).toContain(12)
})
const episode = {
  id: "2",
  title: "Episode",
  slug: "episode",
  summary: "Summary",
  description: "Description",
  date: new Date("2026-01-01T00:00:00Z"),
  showConfig: show.config,
}
it.each([
  ["2026-11-24 17:10:20.123456+00", "2026-11-24T17:10:20.123Z"],
  ["2026-11-24 20:10:20+03", "2026-11-24T17:10:20.000Z"],
  ["2026-11-24T17:10:20.000Z", "2026-11-24T17:10:20.000Z"],
])(
  "normalizes raw Drizzle timestamp %s for lists and episode details",
  async (date, expected) => {
    const row = {
      ...episode,
      date,
      config: '{"audioUrl":"/uploads/audio.mp3"}',
    }
    const list = database([[{ total: 1 }], [row]])
    expect(
      (await listPublicPodcastEpisodes("1", "ar", 1, list.db)).items[0]?.date
    ).toBe(expected)
    const detail = database([[row]])
    expect(
      (await getPublicPodcastEpisode("1", "episode", "ar", detail.db))?.date
    ).toBe(expected)
  }
)
it.each(["not a date", "infinity", "", null])(
  "skips an invalid episode date (%s) without crashing the page",
  async (date) => {
    const mock = database([
      [{ ...episode, date, config: '{"audioUrl":"/uploads/audio.mp3"}' }],
    ])
    expect(
      await getPublicPodcastEpisode("1", "episode", "ar", mock.db)
    ).toBeNull()
  }
)
it("rejects malformed episode metadata and media-less published legacy episodes", async () => {
  for (const config of [
    "invalid",
    "{}",
    '{"audioUrl":"javascript:alert(1)"}',
    '{"videoUrl":"https://evil.test/embed"}',
  ]) {
    const mock = database([[{ ...episode, config }]])
    expect(
      await getPublicPodcastEpisode("1", "episode", "ar", mock.db)
    ).toBeNull()
  }
})
it("does not expose an episode if its show's metadata is invalid or draft", async () => {
  const mock = database([
    [
      {
        ...episode,
        showConfig: '{"status":"draft"}',
        config: '{"audioUrl":"/uploads/audio.mp3"}',
      },
    ],
  ])
  expect(
    await getPublicPodcastEpisode("1", "episode", "ar", mock.db)
  ).toBeNull()
})
it("returns supported media and plain text without exposing raw metadata or draft recovery data", async () => {
  const mock = database([
    [
      {
        ...episode,
        config: JSON.stringify({
          audioUrl: "/uploads/audio.mp3",
          videoUrl: "https://www.youtube.com/watch?v=4vOhXPaGsH0",
          transcript: "<script>alert(1)</script>",
        }),
      },
    ],
  ])
  const result = await getPublicPodcastEpisode("1", "episode", "ar", mock.db)
  expect(result?.audio).toBe("/uploads/audio.mp3")
  expect(result?.video).toContain("youtube-nocookie.com/embed/")
  expect(result?.transcript).toBe("<script>alert(1)</script>")
  expect(result).not.toHaveProperty("config")
  expect(result).not.toHaveProperty("showConfig")
})
it("does not fall back to a stale URL when a referenced attachment was removed", async () => {
  const mock = database([
    [
      {
        ...episode,
        config: JSON.stringify({
          audioId: "9",
          audioUrl: "/uploads/removed.mp3",
        }),
      },
    ],
    [],
  ])
  expect(
    await getPublicPodcastEpisode("1", "episode", "ar", mock.db)
  ).toBeNull()
})
