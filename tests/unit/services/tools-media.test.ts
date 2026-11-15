vi.mock("@/lib/rate-limit", async (load) => ({
  ...await load<typeof import("@/lib/rate-limit")>(),
  checkCmsRateLimit: vi.fn().mockResolvedValue({ success: true, remaining: 1, retryAfter: 0 }),
}))
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { getTableName } from "drizzle-orm"

const mocks = vi.hoisted(() => ({
  root: "",
  guard: vi.fn(),
  select: vi.fn(),
  insert: vi.fn(),
  meta: [] as unknown[],
  options: [] as unknown[],
  posts: [] as unknown[],
}))
vi.mock("server-only", () => ({}))
vi.mock("@/lib/authMIddleware", () => ({ verifyAdmin: mocks.guard }))
vi.mock("@/db", () => ({ db: { select: mocks.select, insert: mocks.insert } }))
vi.mock("@/lib/media-files", async (original) => {
  const actual = await original<typeof import("@/lib/media-files")>()
  return {
    ...actual,
    mediaRoot: (create = false) =>
      actual.mediaRoot(create, path.join(mocks.root, "public", "uploads")),
  }
})

import {
  cleanOrphanMedia,
  scanOrphanMedia,
  getMediaOverviewStats,
} from "@/services/media-tools.service"

const relative = "2026/held.jpg"
const filename = () => path.join(mocks.root, "public", "uploads", relative)
beforeEach(async () => {
  mocks.root = await fs.mkdtemp(path.join(os.tmpdir(), "tools-media-security-"))
  await fs.mkdir(path.dirname(filename()), { recursive: true })
  await fs.writeFile(filename(), "protected local media")
  vi.spyOn(process, "cwd").mockReturnValue(mocks.root)
  mocks.meta = []
  mocks.options = []
  mocks.posts = []
  mocks.insert.mockReturnValue({
    values: (value: { optionValue: string }) => ({
      onConflictDoUpdate: async () => {
        mocks.options = [value]
      },
    }),
  })
  mocks.guard.mockResolvedValue({
    user: { id: "admin", role: "admin", banned: false },
  })
  mocks.select.mockImplementation(() => {
    let rows: unknown[] = []
    const chain: Record<string, unknown> = {}
    chain.from = (table: Parameters<typeof getTableName>[0]) => {
      const name = getTableName(table)
      rows =
        name === "wp_postmeta"
          ? mocks.meta
          : name === "wp_options"
            ? mocks.options
            : mocks.posts
      return chain
    }
    for (const method of [
      "where",
      "limit",
      "offset",
      "orderBy",
      "innerJoin",
      "leftJoin",
    ])
      chain[method] = () => chain
    chain.then = (
      resolve: (value: unknown[]) => unknown,
      reject: (error: unknown) => unknown
    ) => Promise.resolve(rows).then(resolve, reject)
    return chain
  })
})
afterEach(async () => {
  vi.restoreAllMocks()
  const resolved = path.resolve(mocks.root)
  if (
    !resolved.startsWith(path.resolve(os.tmpdir()) + path.sep) ||
    !path.basename(resolved).startsWith("tools-media-security-")
  )
    throw new Error("Refusing test cleanup outside its temporary directory")
  await fs.rm(resolved, { recursive: true, force: true })
})

describe("Manual storage inventory", () => {
  it("never traverses uploads on normal media-tools page reads", async () => {
    const read = vi.spyOn(fs, "readdir")
    const result = await getMediaOverviewStats()
    expect(read).not.toHaveBeenCalled()
    expect(result.physicalFilesCount).toBeNull()
    expect(result.totalDiskUsageBytes).toBeNull()
  })

  it("saves manual results and reuses them without traversing on later visits", async () => {
    const scanned = await getMediaOverviewStats({ scanFiles: true })
    expect(scanned.physicalFilesCount).toBe(1)
    expect(scanned.scannedAt).toEqual(expect.any(String))
    expect(mocks.insert).toHaveBeenCalledOnce()
    const read = vi.spyOn(fs, "readdir")
    const cached = await getMediaOverviewStats()
    expect(read).not.toHaveBeenCalled()
    expect(cached.physicalFilesCount).toBe(scanned.physicalFilesCount)
    expect(cached.totalDiskUsageBytes).toBe(scanned.totalDiskUsageBytes)
    expect(cached.scannedAt).toBe(scanned.scannedAt)
  })

  it("ignores malformed stored inventory without starting a scan", async () => {
    mocks.options = [{ optionValue: '{"fileCount":-3}' }]
    const read = vi.spyOn(fs, "readdir")
    expect((await getMediaOverviewStats()).scannedAt).toBeNull()
    expect(read).not.toHaveBeenCalled()
  })

  it("does not show another environment's saved file inventory", async () => {
    mocks.options = [
      {
        optionValue: JSON.stringify({
          scope: "0".repeat(64),
          fileCount: 90000,
          totalBytes: 1000,
          scannedAt: new Date().toISOString(),
        }),
      },
    ]
    const read = vi.spyOn(fs, "readdir")
    expect((await getMediaOverviewStats()).physicalFilesCount).toBeNull()
    expect(read).not.toHaveBeenCalled()
  })

  it("keeps the saved snapshot if a manual scan fails", async () => {
    await getMediaOverviewStats({ scanFiles: true })
    const previous = JSON.stringify(mocks.options)
    mocks.insert.mockClear()
    vi.spyOn(fs, "readdir").mockRejectedValueOnce(new Error("I/O failed"))
    await expect(getMediaOverviewStats({ scanFiles: true })).rejects.toThrow(
      "I/O failed"
    )
    expect(mocks.insert).not.toHaveBeenCalled()
    expect(JSON.stringify(mocks.options)).toBe(previous)
  })
})

describe("Tools media orphan cleanup ownership and paths", () => {
  it("rejects traversal rather than normalizing it into another uploads file", async () => {
    await fs.writeFile(
      path.join(mocks.root, "public", "uploads", "held.jpg"),
      "do not remove"
    )
    await expect(cleanOrphanMedia(["../held.jpg"], "delete")).rejects.toThrow()
    expect(
      await fs.readFile(
        path.join(mocks.root, "public", "uploads", "held.jpg"),
        "utf8"
      )
    ).toBe("do not remove")
  })

  it("rejects an unknown action rather than falling through to permanent deletion", async () => {
    await expect(
      cleanOrphanMedia([relative], "unknown" as "delete")
    ).rejects.toThrow()
    expect(await fs.readFile(filename(), "utf8")).toBe("protected local media")
  })

  for (const [name, reference] of [
    [
      "theme logo option",
      () => {
        mocks.options = [
          {
            optionName: "theme_mods_news",
            optionValue: JSON.stringify({
              custom_logo: "/uploads/2026/held.jpg",
            }),
          },
        ]
      },
    ],
    [
      "featured video metadata",
      () => {
        mocks.meta = [
          {
            metaKey: "_featured_video_url",
            metaValue: "/uploads/2026/held.jpg",
          },
        ]
      },
    ],
    [
      "attachment file metadata",
      () => {
        mocks.meta = [{ metaKey: "_wp_attached_file", metaValue: relative }]
      },
    ],
    [
      "attachment size metadata",
      () => {
        mocks.meta = [
          {
            metaKey: "_wp_attachment_metadata",
            metaValue: JSON.stringify({
              file: "2026/source.jpg",
              sizes: { medium: { file: "held.jpg" } },
            }),
          },
        ]
      },
    ],
    [
      "Studio JSON metadata",
      () => {
        mocks.meta = [
          {
            metaKey: "_studio_document",
            metaValue: JSON.stringify({
              elements: [{ settings: { image: "/uploads/2026/held.jpg" } }],
            }),
          },
        ]
      },
    ],
  ] as const) {
    it(`does not list or delete media referenced only by ${name}`, async () => {
      reference()
      const scanned = await scanOrphanMedia()
      expect(
        scanned.orphanFiles.map((file) => file.relativePath)
      ).not.toContain(relative)
      await cleanOrphanMedia([relative], "delete").catch(() => undefined)
      expect(await fs.readFile(filename(), "utf8")).toBe(
        "protected local media"
      )
    })
  }

  it("deletes a genuinely unreferenced local file after checking its references", async () => {
    const scanned = await scanOrphanMedia()
    expect(scanned.orphanFiles.map((file) => file.relativePath)).toContain(
      relative
    )
    const result = await cleanOrphanMedia([relative], "delete")
    expect(result.cleanedCount).toBe(1)
    await expect(fs.stat(filename())).rejects.toMatchObject({ code: "ENOENT" })
    expect(mocks.select).toHaveBeenCalled()
  })
})

it("quarantines under a recoverable original relative path without claiming reclaimed disk space", async () => {
  const result = await cleanOrphanMedia([relative], "quarantine")
  expect(result.reclaimedBytes).toBe(0)
  const quarantine = path.join(mocks.root, "public", "uploads", ".quarantine")
  const [batch] = await fs.readdir(quarantine)
  expect(
    await fs.readFile(path.join(quarantine, batch, relative), "utf8")
  ).toBe("protected local media")
})
it("reports partial filesystem failures with actual completed counts", async () => {
  const second = "2026/second.jpg"
  await fs.writeFile(
    path.join(mocks.root, "public", "uploads", second),
    "second"
  )
  const unlink = fs.unlink.bind(fs)
  vi.spyOn(fs, "unlink").mockImplementation(async (file) => {
    if (String(file) === filename()) throw new Error("filesystem unavailable")
    return unlink(file)
  })
  expect(await cleanOrphanMedia([relative, second], "delete")).toMatchObject({
    cleanedCount: 1,
    failedCount: 1,
  })
  expect(await fs.readFile(filename(), "utf8")).toBe("protected local media")
})
