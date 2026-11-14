import { afterEach, describe, expect, it, vi } from "vitest"
const captured = vi.hoisted(() => vi.fn((options: unknown) => options))
vi.mock("better-auth/react", () => ({ createAuthClient: captured }))
vi.mock("better-auth/client/plugins", () => ({
  inferAdditionalFields: () => ({}), twoFactorClient: () => ({}),
  emailOTPClient: () => ({}), magicLinkClient: () => ({}), adminClient: () => ({}),
}))
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.resetModules(); captured.mockClear() })
describe("authentication origin after domain changes", () => {
  it.each(["https://publication.test", "http://localhost:3000"])("uses the browser origin %s even with a stale build URL", async (origin) => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://old-staging.test")
    vi.stubGlobal("window", { location: { origin } })
    await import("@/lib/auth-client")
    expect(captured.mock.calls[0][0]).not.toHaveProperty("baseURL")
  })
  it("leaves server URL resolution to the authentication library", async () => {
    vi.stubGlobal("window", undefined)
    await import("@/lib/auth-client")
    expect(captured.mock.calls[0][0]).not.toHaveProperty("baseURL")
  })
})

