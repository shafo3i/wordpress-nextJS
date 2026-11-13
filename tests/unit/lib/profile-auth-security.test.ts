import { describe, expect, it } from "vitest"
import { betterAuth } from "better-auth"
import { memoryAdapter } from "better-auth/adapters/memory"
import { profileAuthBefore } from "@/lib/auth-profile"
import { profileUpdateSchema } from "@/db/schema/cms-profile"
describe("Profile authentication boundaries", () => {
  it("rejects privilege fields, executable avatar URLs and unbounded names", () => {
    for (const input of [
      { name: "" },
      { name: "x".repeat(201) },
      { name: "Name", role: "admin" },
      { image: "javascript:alert(1)" },
      { image: "data:image/svg+xml,bad" },
      { name: "Name", twoFactorEnabled: false },
    ])
      expect(profileUpdateSchema.safeParse(input).success).toBe(false)
    expect(profileUpdateSchema.parse({ name: " <img src=x> " })).toEqual({
      name: "<img src=x>",
    })
  })
  it("enforces profile validation and other-session revocation on actual Better Auth endpoints", async () => {
    const data: Record<string, Record<string, unknown>[]> = {
      user: [],
      session: [],
      account: [],
      verification: [],
    }
    const auth = betterAuth({
      baseURL: "http://localhost:3000",
      secret: "isolated-test-secret-with-at-least-32-characters",
      database: memoryAdapter(data),
      rateLimit: { enabled: false },
      emailAndPassword: { enabled: true },
      hooks: { before: profileAuthBefore },
    })
    const request = async (path: string, body: unknown, cookie = "") =>
      auth.handler(
        new Request("http://localhost:3000/api/auth" + path, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Origin: "http://localhost:3000",
            Cookie: cookie,
          },
          body: JSON.stringify(body),
        })
      )
    const account = {
      name: "Reader",
      email: "reader@example.test",
      password: "ExistingFixture123!",
    }
    const signup = await request("/sign-up/email", account)
    expect(signup.ok).toBe(true)
    const cookie = signup.headers
      .getSetCookie()
      .map((value) => value.split(";")[0])
      .join("; ")
    expect(
      (
        await request("/sign-in/email", {
          email: account.email,
          password: account.password,
        })
      ).ok
    ).toBe(true)
    expect(data.session.length).toBe(2)
    expect(
      (
        await request(
          "/update-user",
          { name: "Changed", role: "admin" },
          cookie
        )
      ).status
    ).toBe(400)
    expect(data.user[0].name).toBe("Reader")
    expect(
      (await request("/update-user", { name: " <b>Safe text</b> " }, cookie)).ok
    ).toBe(true)
    expect(data.user[0].name).toBe("<b>Safe text</b>")
    const change = {
      currentPassword: "wrong",
      newPassword: "NewFixturePassword123!",
      revokeOtherSessions: false,
    }
    expect((await request("/change-password", change, cookie)).ok).toBe(false)
    expect(data.session.length).toBe(2)
    expect(
      (
        await request(
          "/change-password",
          {
            ...change,
            currentPassword: account.password,
            newPassword: "short",
          },
          cookie
        )
      ).status
    ).toBe(400)
    expect(
      (
        await request(
          "/change-password",
          { ...change, currentPassword: account.password },
          cookie
        )
      ).ok
    ).toBe(true)
    expect(data.session.length).toBe(1)
  })
})
