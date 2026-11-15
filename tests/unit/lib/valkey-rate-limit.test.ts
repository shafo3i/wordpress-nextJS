import { beforeEach, afterEach, describe, it, expect, vi } from "vitest"
const mocks = vi.hoisted(() => ({ eval: vi.fn(), connect: vi.fn(), create: vi.fn(), destroy: vi.fn() }))
vi.mock("server-only", () => ({}))
vi.mock("redis", () => ({ createClient: mocks.create }))
vi.mock("@/auth", () => { throw Error("CMS limiter must not import Better Auth") })
vi.mock("@/db", () => { throw Error("CMS limiter must not import PostgreSQL") })
import { enforceRateLimit, checkCmsRateLimit, RateLimitError, rateLimitResponse } from "@/lib/rate-limit"
beforeEach(() => {
  vi.stubEnv("REDIS_URL", "redis://test:secret@valkey.test:6379/0")
  vi.stubEnv("BETTER_AUTH_SECRET", "isolated-test-secret")
  delete (globalThis as typeof globalThis & { pressforgeRateRedis?: unknown }).pressforgeRateRedis
  mocks.eval.mockReset().mockResolvedValue([1, 60000])
  mocks.connect.mockReset().mockResolvedValue(undefined)
  mocks.destroy.mockReset()
  mocks.create.mockReset().mockReturnValue({ on: vi.fn(), connect: mocks.connect, eval: mocks.eval, destroy: mocks.destroy, isReady: true })
})
afterEach(() => { vi.unstubAllEnvs(); delete (globalThis as typeof globalThis & { pressforgeRateRedis?: unknown }).pressforgeRateRedis })
const input = { namespace: "write", identifier: "user:editor-a", max: 5, window: 60 }
describe("Valkey CMS limiter", () => {
  it("reserves a budget with one atomic script and returns remaining allowance", async () => {
    expect(await enforceRateLimit(input)).toEqual({ success: true, remaining: 4, retryAfter: 0 })
    expect(mocks.eval).toHaveBeenCalledTimes(1)
    const [script, options] = mocks.eval.mock.calls[0]
    expect(script).toContain("\'PX\', window")
    expect(script).toContain("PTTL")
    expect(options.arguments).toEqual(["5", "60000", "1"])
    expect(options.keys[0]).toMatch(/^pressforge:rl:v1:write:[a-f0-9]{64}$/)
    expect(options.keys[0]).not.toContain("editor-a")
  })
  it("shares a single connection under concurrent requests", async () => {
    await Promise.all(Array.from({ length: 8 }, () => enforceRateLimit(input)))
    expect(mocks.connect).toHaveBeenCalledTimes(1)
    expect(mocks.create).toHaveBeenCalledTimes(1)
  })
  it("rejects an exhausted quota with a rounded retry duration", async () => {
    mocks.eval.mockResolvedValue([6, 59001])
    await expect(enforceRateLimit(input)).rejects.toMatchObject({ status: 429, retryAfter: 60, message: "admin.security.rate_limited" })
  })
  it.each([{}, { REDIS_URL: "http://bad.test" }])("fails closed for missing/invalid configuration", async (environment) => {
    vi.stubEnv("REDIS_URL", environment.REDIS_URL || "")
    await expect(enforceRateLimit(input)).rejects.toMatchObject({ status: 503 })
    expect(mocks.eval).not.toHaveBeenCalled()
  })
  it.each([0, -1, 1.1, 86401])("rejects invalid window %s before contacting Valkey", async (window) => {
    await expect(enforceRateLimit({ ...input, window })).rejects.toThrow()
    expect(mocks.create).not.toHaveBeenCalled()
  })
  it("does not expose connection credentials on failure", async () => {
    mocks.eval.mockRejectedValue(Error("redis://password@private-host"))
    const error = await enforceRateLimit(input).catch(error => error)
    expect(error).toBeInstanceOf(RateLimitError)
    expect(String(error)).not.toContain("private-host")
    expect(error.status).toBe(503)
  })
  it("opens a new connection on the next request after a disconnected client fails", async () => {
    const client = { on: vi.fn(), connect: mocks.connect, eval: mocks.eval, destroy: mocks.destroy, isReady: false, isOpen: false }
    mocks.create.mockReturnValueOnce(client)
    mocks.eval.mockRejectedValueOnce(Error("socket closed"))
    await expect(enforceRateLimit(input)).rejects.toMatchObject({ status: 503 })
    expect(await enforceRateLimit(input)).toMatchObject({ success: true })
    expect(mocks.create).toHaveBeenCalledTimes(2)
  })
  it.each([
    { namespace: "invalid namespace" }, { identifier: "" },
    { max: 0 }, { cost: 0 }, { cost: 10001 },
  ])("rejects invalid configuration %j without opening a connection", async (extra) => {
    await expect(enforceRateLimit({ ...input, ...extra })).rejects.toMatchObject({ status: 503 })
    expect(mocks.create).not.toHaveBeenCalled()
  })
  it("rejects malformed server replies", async () => {
    mocks.eval.mockResolvedValue(["bad", -1])
    await expect(enforceRateLimit(input)).rejects.toMatchObject({ status: 503 })
  })
  it("separates identities and operation budgets", async () => {
    await enforceRateLimit(input)
    await enforceRateLimit({ ...input, identifier: "user:editor-b" })
    await enforceRateLimit({ ...input, namespace: "upload" })
    expect(new Set(mocks.eval.mock.calls.map(([, options]) => options.keys[0])).size).toBe(3)
  })
  it("uses server-verified actor IDs and a separate autosave allowance", async () => {
    await checkCmsRateLimit("actor-1", "autosave")
    expect(mocks.eval.mock.calls[0][1].arguments).toEqual(["30", "60000", "1"])
    await expect(checkCmsRateLimit("", "write")).rejects.toThrow()
  })
  it("supports byte-weighted upload budgets", async () => {
    await checkCmsRateLimit("actor-1", "upload-bytes", 32)
    expect(mocks.eval.mock.calls[0][1].arguments).toEqual(["256", "60000", "32"])
  })
  it("builds standard no-store HTTP rejection responses", async () => {
    const response = rateLimitResponse(new RateLimitError(429, 19))!
    expect(response.status).toBe(429)
    expect(response.headers.get("Retry-After")).toBe("19")
    expect(response.headers.get("Cache-Control")).toBe("no-store")
    expect(rateLimitResponse(Error("unrelated"))).toBeNull()
  })
})
