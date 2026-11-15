vi.mock("@/lib/rate-limit", async (load) => ({
  ...await load<typeof import("@/lib/rate-limit")>(),
  checkCmsRateLimit: vi.fn().mockResolvedValue({ success: true, remaining: 1, retryAfter: 0 }),
}))
import { beforeEach, describe, expect, it, vi } from "vitest"
const mocks = vi.hoisted(() => ({
  guard: vi.fn(),
  execute: vi.fn(),
  query: vi.fn(),
}))
vi.mock("@/services/media-tools.service", () => ({
  getStoredStorageInventory: async () => null,
  getMediaOverviewStats: async () => ({
    uploadsDirWritable: true,
    physicalFilesCount: 0,
    totalDiskUsageBytes: 0,
  }),
}))
vi.mock("server-only", () => ({}))
vi.mock("@/lib/authMIddleware", () => ({ verifyAdmin: mocks.guard }))
vi.mock("@/db", () => {
  const db = {
    execute: mocks.execute,
    transaction: async (fn: (tx: unknown) => unknown) => fn(db),
  }
  return {
    db,
    pool: { connect: async () => ({ query: mocks.query, release: vi.fn() }) },
  }
})
import {
  searchAndReplace,
  runDatabaseCleanup,
  getSiteHealthData,
  replaceStructuredText,
} from "@/services/database-maintenance.service"
import { PgDialect } from "drizzle-orm/pg-core"
const dialect = new PgDialect()
beforeEach(() => {
  vi.clearAllMocks()
  mocks.guard.mockResolvedValue({ user: { role: "admin" } })
  mocks.execute.mockResolvedValue({ rows: [], rowCount: 0 })
})
describe("Tools maintenance", () => {
  it("rejects invalid cleanup choices before writes", async () => {
    await expect(runDatabaseCleanup(["drop_database"])).rejects.toThrow()
    expect(mocks.execute).not.toHaveBeenCalled()
  })
  it("parameterizes literal search input instead of wildcard SQL interpolation", async () => {
    await searchAndReplace({
      search: "a'_%",
      replace: "b",
      tables: ["wp_posts"],
    })
    const queries = mocks.execute.mock.calls.map(([q]) => dialect.sqlToQuery(q))
    expect(queries.some((q) => q.params.includes("a'_%"))).toBe(true)
    expect(queries.every((q) => !q.sql.includes("a'_%"))).toBe(true)
  })
  it("does not infer HTTPS from production mode", async () => {
    vi.stubEnv("NODE_ENV", "production")
    vi.stubEnv("BETTER_AUTH_URL", "http://publication.test")
    const result = await getSiteHealthData()
    expect(result.security.https).toBe(false)
    vi.unstubAllEnvs()
  })
})

describe("structured search replacement", () => {
  it("keeps JSON keys and escapes replacement text", () => {
    const result = replaceStructuredText(
      '{"old":"old","nested":["old",12]}',
      "old",
      'new"value'
    )
    expect(JSON.parse(result)).toEqual({
      old: 'new"value',
      nested: ['new"value', 12],
    })
  })
  it("refuses PHP byte-length serialization instead of corrupting it", () => {
    expect(() =>
      replaceStructuredText('a:1:{s:3:"old";s:3:"old";}', "old", "different")
    ).toThrow("tools_serialized_data")
  })
})
