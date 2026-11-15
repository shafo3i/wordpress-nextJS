import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  denied: new Error("tools administrator access denied"),
  guard: vi.fn(),
  database: vi.fn(() => {
    throw new Error("database touched before authorization")
  }),
  filesystem: vi.fn(() => {
    throw new Error("filesystem touched before authorization")
  }),
}))
vi.mock("server-only", () => ({}))
vi.mock("@/lib/content-text", () => ({
  contentPlainText: (value: string) => value,
}))
vi.mock("@/lib/post-content-media", () => ({
  renderPostMedia: (value: string) => value,
}))
vi.mock("@/lib/authMIddleware", () => ({ verifyAdmin: mocks.guard }))
vi.mock("@/db", () => ({
  db: {
    select: mocks.database,
    insert: mocks.database,
    update: mocks.database,
    delete: mocks.database,
    execute: mocks.database,
    transaction: mocks.database,
  },
  pool: { connect: mocks.database },
}))
vi.mock("node:fs/promises", () => ({
  default: new Proxy({}, { get: () => mocks.filesystem }),
}))
vi.mock("fs/promises", () => ({
  default: new Proxy({}, { get: () => mocks.filesystem }),
}))
vi.mock("node:fs", () => ({ default: { existsSync: mocks.filesystem } }))

import { importWxrXml, importJsonArchive } from "@/services/import.service"
import {
  exportWxrXml,
  exportSqlDump,
  exportJsonArchive,
} from "@/services/export.service"
import {
  searchAndReplace,
  getDatabaseCleanupStats,
  runDatabaseCleanup,
  getSiteHealthData,
} from "@/services/database-maintenance.service"
import {
  getMediaOverviewStats,
  getStoredStorageInventory,
  regenerateThumbnails,
  scanOrphanMedia,
  cleanOrphanMedia,
  seedSampleMedia,
} from "@/services/media-tools.service"
import {
  getAllRedirects,
  createRedirect,
  updateRedirect,
  deleteRedirect,
} from "@/services/redirect.service"

beforeEach(() => {
  vi.clearAllMocks()
  mocks.guard.mockRejectedValue(mocks.denied)
})

const operations: Array<[string, () => Promise<unknown>]> = [
  [
    "WXR import",
    () =>
      importWxrXml(
        "<rss><channel><item><title>post</title><wp:post_type>post</wp:post_type></item></channel></rss>",
        "actor"
      ),
  ],
  [
    "JSON import",
    () =>
      importJsonArchive(
        JSON.stringify({
          data: { posts: [{ postName: "post", postType: "post" }] },
        }),
        "actor"
      ),
  ],
  ["WXR export", () => exportWxrXml()],
  ["SQL export", () => exportSqlDump()],
  ["JSON export", () => exportJsonArchive()],
  [
    "search and replace",
    () => searchAndReplace({ search: "old", replace: "new" }),
  ],
  ["cleanup statistics", () => getDatabaseCleanupStats()],
  ["database cleanup", () => runDatabaseCleanup(["revisions"])],
  ["site health", () => getSiteHealthData()],
  ["media statistics", () => getMediaOverviewStats()],
  ["stored storage inventory", () => getStoredStorageInventory()],
  [
    "manual storage inventory",
    () => getMediaOverviewStats({ scanFiles: true }),
  ],
  ["thumbnail regeneration", () => regenerateThumbnails({})],
  ["orphan scan", () => scanOrphanMedia()],
  ["orphan cleanup", () => cleanOrphanMedia([], "delete")],
  ["sample media generation", () => seedSampleMedia()],
  ["private redirect list", () => getAllRedirects()],
  [
    "redirect creation",
    () =>
      createRedirect({
        sourcePath: "/old",
        targetUrl: "/new",
        statusCode: 301,
      }),
  ],
  [
    "redirect update",
    () => updateRedirect("redirect-id", { targetUrl: "/new" }),
  ],
  ["redirect deletion", () => deleteRedirect("redirect-id")],
]

describe("Tools direct-service administrator boundaries", () => {
  it.each(operations)(
    "denies %s before touching data or files",
    async (_name, operation) => {
      await expect(operation()).rejects.toBe(mocks.denied)
      expect(mocks.guard).toHaveBeenCalled()
      expect(mocks.database).not.toHaveBeenCalled()
      expect(mocks.filesystem).not.toHaveBeenCalled()
    }
  )
})
