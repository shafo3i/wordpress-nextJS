import { describe, expect, it, vi } from "vitest"
import { PgDialect } from "drizzle-orm/pg-core"
import type { DB } from "@/db"
import { getStudioWidgetContent } from "@/services/studio-content.service"

vi.mock("@/db", () => ({ db: {} }))
vi.mock("server-only", () => ({}))

function feedDatabase(preferred: string, image = "") {
  const conditions: { sql: string; params: unknown[] }[] = []
  const metadataKeys: unknown[][] = []
  const answers = [
    [{ code: "en", direction: "ltr" }],
    [
      {
        id: BigInt(1),
        title: "Video",
        slug: "video",
        excerpt: "",
        content: "",
        date: new Date(),
        authorName: "Author",
      },
    ],
    [{ total: 1 }],
    [],
    [
      { postId: BigInt(1), key: "_featured_video_url", value: preferred },
      ...(image
        ? [{ postId: BigInt(1), key: "_thumbnail_id", value: "2" }]
        : []),
    ],
    [{ id: BigInt(2), url: image }],
  ]
  const database = {
    select: () => {
      const rows = answers.shift()!
      const chain = {
        from: () => chain,
        innerJoin: () => chain,
        leftJoin: () => chain,
        where: (condition: Parameters<PgDialect["sqlToQuery"]>[0]) => {
          const query = new PgDialect().sqlToQuery(condition)
          conditions.push(query)
          if (query.sql.includes("meta_key")) metadataKeys.push(query.params)
          return chain
        },
        orderBy: () => chain,
        limit: () => chain,
        offset: () => chain,
        then: (resolve: (value: unknown) => unknown) =>
          Promise.resolve(rows).then(resolve),
      }
      return chain
    },
  } as unknown as DB
  return { database, conditions, metadataKeys }
}

describe("Studio public feed integration", () => {
  it("excludes password-protected and not-yet-published posts in both queries", async () => {
    const harness = feedDatabase("")
    await getStudioWidgetContent({ locale: "en" }, harness.database)
    const postQueries = harness.conditions.filter((query) =>
      query.sql.includes("post_status")
    )
    expect(postQueries).toHaveLength(2)
    for (const query of postQueries) {
      expect(query.sql).toContain('"post_password" =')
      expect(query.sql).toContain('"post_date_gmt" <=')
      expect(query.params).toContain("")
      expect(
        query.params.some(
          (value) =>
            value instanceof Date ||
            (typeof value === "string" && /^\d{4}-\d\d-\d\dT/.test(value))
        )
      ).toBe(true)
    }
  })

  it("uses the selected featured video for the poster and play indicator", async () => {
    const harness = feedDatabase("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
    const result = await getStudioWidgetContent(
      { locale: "en" },
      harness.database
    )
    expect(harness.metadataKeys.flat()).toContain("_featured_video_url")
    expect(result.items[0].hasVideo).toBe(true)
    expect(result.items[0].imageUrl).toBe(
      "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg"
    )
  })

  it("preserves the featured image when a video is also selected", async () => {
    const harness = feedDatabase(
      "/uploads/2026/video.mp4",
      "/uploads/2026/photo.jpg"
    )
    const result = await getStudioWidgetContent(
      { locale: "en" },
      harness.database
    )
    expect(result.items[0].imageUrl).toBe("/uploads/2026/photo.jpg")
    expect(result.items[0].hasVideo).toBe(true)
  })

  it("uses the guarded local thumbnail endpoint for a selected uploaded video", async () => {
    const harness = feedDatabase("/uploads/2026/video.mp4")
    const result = await getStudioWidgetContent(
      { locale: "en" },
      harness.database
    )
    expect(result.items[0].imageUrl).toBe(
      "/api/media/video-thumbnail?src=%2Fuploads%2F2026%2Fvideo.mp4"
    )
    expect(result.items[0].hasVideo).toBe(true)
    expect(result.items[0].content).toBe("")
  })

  it("does not turn unsafe video metadata into a poster", async () => {
    const harness = feedDatabase("javascript:alert(1)")
    const result = await getStudioWidgetContent(
      { locale: "en" },
      harness.database
    )
    expect(result.items[0].imageUrl).toBe("")
    expect(result.items[0].hasVideo).toBe(false)
  })
})
