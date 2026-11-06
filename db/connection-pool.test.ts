import { afterEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/env", () => ({
  env: { DATABASE_URL: "postgresql://unused/test", DB_POOL_MAX: 2 },
}))
vi.mock("./schema/cms-relations", () => ({ cmsRelations: {} }))

const databaseGlobal = globalThis as typeof globalThis & {
  pressforgePool?: import("pg").Pool
}

afterEach(async () => {
  await databaseGlobal.pressforgePool?.end()
  delete databaseGlobal.pressforgePool
  vi.resetModules()
})

describe("shared database pool", () => {
  it("gives Drizzle the exported pool and reuses it after module reloads", async () => {
    const first = await import("./index")
    expect(first.db.$client).toBe(first.pool)
    vi.resetModules()
    const second = await import("./index")
    expect(second.pool).toBe(first.pool)
    expect(second.db.$client).toBe(first.pool)
    expect(second.pool.listenerCount("error")).toBe(1)
    expect(second.pool.totalCount).toBe(0)
  })

  it("bounds connection usage and releases unused connections", async () => {
    const { pool } = await import("./index")
    expect(pool.options.max).toBe(2)
    expect(pool.options.idleTimeoutMillis).toBe(5000)
    expect(pool.options.connectionTimeoutMillis).toBe(5000)
    expect(pool.options.maxLifetimeSeconds).toBe(60)
  })
})
