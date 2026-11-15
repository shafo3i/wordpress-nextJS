vi.mock("@/lib/rate-limit", async (load) => ({
  ...await load<typeof import("@/lib/rate-limit")>(),
  checkCmsRateLimit: vi.fn().mockResolvedValue({ success: true, remaining: 1, retryAfter: 0 }),
}))
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest"
import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import sharp from "sharp"
import { getTableName } from "drizzle-orm"
const mocks = vi.hoisted(() => ({
  root: "",
  file: "2026/photo.png",
  saved: [] as Record<string, unknown>[],
}))
vi.mock("server-only", () => ({}))
vi.mock("@/lib/authMIddleware", () => ({
  verifyAdmin: async () => ({ user: { id: "admin" } }),
}))
vi.mock("@/db", () => {
  const db = {
    execute: async () => ({ rows: [{ ID: 1 }], rowCount: 1 }),
    select: () => ({
      from: (table: Parameters<typeof getTableName>[0]) => {
        const rows =
          getTableName(table) === "wp_posts"
            ? [{ id: BigInt(1), title: "Photo" }]
            : [
                { key: "_wp_attached_file", value: mocks.file },
                {
                  key: "_wp_attachment_metadata",
                  value: JSON.stringify({
                    image_meta: { camera: "original" },
                    sizes: {
                      custom: { file: "custom.png", width: 30, height: 10 },
                    },
                  }),
                },
              ]
        const query = {
          where: () => query,
          orderBy: () => query,
          limit: () => query,
          then: (resolve: (rows: unknown) => unknown) =>
            Promise.resolve(rows).then(resolve),
        }
        return query
      },
    }),
    delete: () => ({ where: async () => undefined }),
    insert: () => ({
      values: async (value: Record<string, unknown>) => {
        mocks.saved.push(value)
      },
    }),
    transaction: async (work: (tx: unknown) => unknown) => work(db),
  }
  return { db }
})
vi.mock("@/lib/media-files", async (original) => {
  const actual = await original<typeof import("@/lib/media-files")>()
  return {
    ...actual,
    mediaRoot: () =>
      actual.mediaRoot(false, path.join(mocks.root, "public", "uploads")),
  }
})
import { regenerateThumbnails } from "@/services/media-tools.service"
beforeEach(async () => {
  mocks.root = await fs.mkdtemp(path.join(os.tmpdir(), "tools-regen-"))
  vi.spyOn(process, "cwd").mockReturnValue(mocks.root)
  await fs.mkdir(path.join(mocks.root, "public", "uploads", "2026"), {
    recursive: true,
  })
  await sharp({
    create: { width: 300, height: 100, channels: 3, background: "red" },
  })
    .png()
    .toFile(path.join(mocks.root, "public", "uploads", "2026", "photo.png"))
  mocks.file = "2026/photo.png"
  mocks.saved = []
})
afterEach(async () => {
  vi.restoreAllMocks()
  if (
    !path
      .resolve(mocks.root)
      .startsWith(path.resolve(os.tmpdir()) + path.sep) ||
    !path.basename(mocks.root).startsWith("tools-regen-")
  )
    throw new Error("unsafe cleanup")
  await fs.rm(mocks.root, { recursive: true, force: true })
})
describe("thumbnail regeneration", () => {
  it("stores actual generated dimensions while preserving original attachment metadata", async () => {
    const result = await regenerateThumbnails({
      generateWebp: true,
      onlyMissing: true,
    })
    expect(result.details[0].success).toBe(true)
    const metadata = JSON.parse(String(mocks.saved[0].metaValue))
    expect(metadata.image_meta).toEqual({ camera: "original" })
    expect(metadata.sizes.custom.file).toBe("custom.png")
    const generated = await sharp(
      path.join(
        mocks.root,
        "public",
        "uploads",
        "2026",
        metadata.sizes.medium.file
      )
    ).metadata()
    expect(metadata.sizes.medium.width).toBe(generated.width)
    expect(metadata.sizes.medium.height).toBe(generated.height)
    expect(generated.width).toBeLessThanOrEqual(300)
  })
  it("does not read a source path outside uploads or expose that path in results", async () => {
    mocks.file = "../outside.png"
    const result = await regenerateThumbnails({})
    expect(result.details[0]).toMatchObject({
      success: false,
      error: "admin.tools.media.file_failed",
    })
    expect(mocks.saved).toEqual([])
    expect(JSON.stringify(result)).not.toContain("outside.png")
  })
})
