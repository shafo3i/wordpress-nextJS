import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { betterAuth } from "better-auth"
import { memoryAdapter } from "better-auth/adapters/memory"
import { SESSION_POLICY } from "@/lib/session-policy"

async function fixture(
  session: {
    expiresIn: number
    freshAge: number
    updateAge?: number
  } = SESSION_POLICY
) {
  const data: Record<string, Record<string, unknown>[]> = {
    user: [],
    session: [],
    account: [],
    verification: [],
  }
  const auth = betterAuth({
    baseURL: "http://localhost:3000",
    secret: "isolated-session-test-secret-at-least-32-characters",
    database: memoryAdapter(data),
    rateLimit: { enabled: false },
    emailAndPassword: { enabled: true, autoSignIn: true },
    session,
  })
  const jar = new Map<string, string>()
  async function request(path: string, body?: object) {
    const response = await auth.handler(
      new Request(`http://localhost:3000/api/auth${path}`, {
        method: body ? "POST" : "GET",
        headers: {
          Origin: "http://localhost:3000",
          "Content-Type": "application/json",
          Cookie: [...jar].map(([key, value]) => `${key}=${value}`).join("; "),
        },
        body: body ? JSON.stringify(body) : undefined,
      })
    )
    for (const cookie of response.headers.getSetCookie()) {
      const pair = cookie.split(";")[0],
        separator = pair.indexOf("=")
      jar.set(pair.slice(0, separator), pair.slice(separator + 1))
    }
    return { response, data: await response.json() }
  }
  expect(
    (
      await request("/sign-up/email", {
        name: "Session fixture",
        email: "session@example.test",
        password: "LocalFixturePass123!",
      })
    ).response.status
  ).toBe(200)
  return { data, request }
}
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] })
  vi.setSystemTime(new Date("2026-11-09T12:00:00Z"))
})
afterEach(() => vi.useRealTimers())
describe("real session renewal", () => {
  it("reproduces the old one-hour expiry despite active requests", async () => {
    const test = await fixture({ expiresIn: 3600, freshAge: 1800 })
    const first = new Date(test.data.session[0].expiresAt as string).getTime()
    vi.setSystemTime(new Date("2026-11-09T12:30:00Z"))
    expect((await test.request("/get-session")).data).not.toBeNull()
    expect(new Date(test.data.session[0].expiresAt as string).getTime()).toBe(
      first
    )
    vi.setSystemTime(new Date("2026-11-09T13:00:01Z"))
    expect((await test.request("/get-session")).data).toBeNull()
  })
  it("renews active sessions, retains an idle expiry, and honors sign-out", async () => {
    const test = await fixture()
    const first = new Date(test.data.session[0].expiresAt as string).getTime()
    vi.setSystemTime(new Date("2026-11-09T12:05:01Z"))
    const renewed = await test.request("/get-session")
    expect(renewed.data).not.toBeNull()
    expect(renewed.response.headers.getSetCookie().length).toBeGreaterThan(0)
    expect(
      new Date(test.data.session[0].expiresAt as string).getTime()
    ).toBeGreaterThan(first)
    vi.setSystemTime(new Date("2026-11-09T14:00:00Z"))
    expect((await test.request("/get-session")).data).not.toBeNull()
    vi.setSystemTime(new Date("2026-11-09T22:00:01Z"))
    expect((await test.request("/get-session")).data).toBeNull()
    const signed = await fixture()
    await signed.request("/sign-out", {})
    expect((await signed.request("/get-session")).data).toBeNull()
    expect(SESSION_POLICY.freshAge).toBe(1800)
  })
})
