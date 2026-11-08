import { createHmac } from "node:crypto"
import { beforeEach, describe, expect, it } from "vitest"
import { betterAuth } from "better-auth"
import { memoryAdapter } from "better-auth/adapters/memory"
import { emailOTP, magicLink } from "better-auth/plugins"
import { securedTwoFactor } from "./auth-two-factor"

function totp(uri: string) {
  const secret = new URL(uri).searchParams.get("secret")!
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
  const bits = [...secret]
    .map((c) => alphabet.indexOf(c).toString(2).padStart(5, "0"))
    .join("")
  const key = Buffer.from(
    (bits.match(/.{8}/g) || []).map((byte) => parseInt(byte, 2))
  )
  const counter = Buffer.alloc(8)
  counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000)))
  const hash = createHmac("sha1", key).update(counter).digest()
  return String(
    (hash.readUInt32BE(hash[19] & 15) & 0x7fffffff) % 1000000
  ).padStart(6, "0")
}

function fixture() {
  const data: Record<string, Record<string, unknown>[]> = {
    user: [],
    session: [],
    account: [],
    verification: [],
    twoFactor: [],
  }
  const mail: {
    magic?: string
    otp?: string
    reset?: string
    verify?: string
  } = {}
  const jar = new Map<string, string>()
  const auth = betterAuth({
    baseURL: "http://localhost:3000",
    secret: "isolated-test-secret-with-at-least-32-characters",
    database: memoryAdapter(data),
    rateLimit: { enabled: false },
    emailAndPassword: {
      enabled: true,
      revokeSessionsOnPasswordReset: true,
      resetPasswordTokenExpiresIn: 3600,
      sendResetPassword: async ({ url }) => {
        mail.reset = url
      },
    },
    emailVerification: {
      autoSignInAfterVerification: false,
      sendVerificationEmail: async ({ url }) => {
        mail.verify = url
      },
    },
    plugins: [
      magicLink({
        disableSignUp: true,
        storeToken: "hashed",
        sendMagicLink: async ({ token }) => {
          mail.magic = token
        },
      }),
      emailOTP({
        disableSignUp: true,
        sendVerificationOTP: async ({ otp }) => {
          mail.otp = otp
        },
      }),
      securedTwoFactor({
        issuer: "Test",
        totpOptions: { period: 30, digits: 6 },
      }),
    ],
  })
  async function request(path: string, body?: Record<string, unknown>) {
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
      const [pair] = cookie.split(";")
      const index = pair.indexOf("=")
      jar.set(pair.slice(0, index), pair.slice(index + 1))
    }
    const result = await response.json().catch(() => null)
    return { status: response.status, data: result }
  }
  return { data, mail, jar, request }
}

describe("real Better Auth recovery and MFA flows with isolated in-memory accounts", () => {
  let test: ReturnType<typeof fixture>
  let uri: string
  let backups: string[]
  const email = "fixture@example.test"
  const password = "LocalFixturePass123!"
  const login = async () => test.request("/sign-in/email", { email, password })
  beforeEach(async () => {
    test = fixture()
    expect(
      (
        await test.request("/sign-up/email", {
          name: "Fixture",
          email,
          password,
        })
      ).status
    ).toBe(200)
    const setup = await test.request("/two-factor/enable", { password })
    expect(setup.status).toBe(200)
    uri = setup.data.totpURI
    backups = setup.data.backupCodes
    expect(
      (await test.request("/two-factor/verify-totp", { code: totp(uri) }))
        .status
    ).toBe(200)
    await test.request("/sign-out", {})
    test.jar.clear()
  })
  it("withholds the session until a valid authenticator code is supplied", async () => {
    expect((await login()).data.twoFactorRedirect).toBe(true)
    expect((await test.request("/get-session")).data).toBeNull()
    const code = totp(uri)
    const wrong = `${(Number(code[0]) + 1) % 10}${code.slice(1)}`
    expect(
      (await test.request("/two-factor/verify-totp", { code: wrong })).status
    ).toBeGreaterThanOrEqual(400)
    expect((await test.request("/get-session")).data).toBeNull()
    expect(
      (await test.request("/two-factor/verify-totp", { code })).status
    ).toBe(200)
    expect((await test.request("/get-session")).data.user.email).toBe(email)
  })
  it("accepts recovery codes once and rejects expired challenges", async () => {
    await login()
    expect(
      (
        await test.request("/two-factor/verify-backup-code", {
          code: backups[0],
        })
      ).status
    ).toBe(200)
    await test.request("/sign-out", {})
    test.jar.clear()
    await login()
    expect(
      (
        await test.request("/two-factor/verify-backup-code", {
          code: backups[0],
        })
      ).status
    ).toBeGreaterThanOrEqual(400)
    for (const record of test.data.verification) record.expiresAt = new Date(0)
    expect(
      (await test.request("/two-factor/verify-totp", { code: totp(uri) }))
        .status
    ).toBeGreaterThanOrEqual(400)
    expect((await test.request("/get-session")).data).toBeNull()
  })
  it("requires the second factor for magic links and rejects token reuse", async () => {
    await test.request("/sign-in/magic-link", { email })
    expect(test.mail.magic).toBeTruthy()
    const path = `/magic-link/verify?token=${test.mail.magic}`
    expect((await test.request(path)).data.twoFactorRedirect).toBe(true)
    expect((await test.request("/get-session")).data).toBeNull()
    expect(
      (await test.request("/two-factor/verify-totp", { code: totp(uri) }))
        .status
    ).toBe(200)
    expect((await test.request("/get-session")).data.user.email).toBe(email)
    expect((await test.request(path)).status).not.toBe(200)
  })
  it("requires the second factor for email-code login", async () => {
    await test.request("/email-otp/send-verification-otp", {
      email,
      type: "sign-in",
    })
    expect(test.mail.otp).toBeTruthy()
    expect(
      (await test.request("/sign-in/email-otp", { email, otp: test.mail.otp }))
        .data.twoFactorRedirect
    ).toBe(true)
    expect((await test.request("/get-session")).data).toBeNull()
    expect(
      (await test.request("/two-factor/verify-totp", { code: totp(uri) }))
        .status
    ).toBe(200)
  })
  it("resets the password, revokes sessions and spends the reset token", async () => {
    await login()
    await test.request("/two-factor/verify-totp", { code: totp(uri) })
    await test.request("/request-password-reset", {
      email,
      redirectTo: "/password-reset",
    })
    const token = new URL(test.mail.reset!).pathname.split("/").pop()!
    const newPassword = "NewFixturePass456!"
    expect(
      (await test.request("/reset-password", { token, newPassword })).status
    ).toBe(200)
    expect((await test.request("/get-session")).data).toBeNull()
    expect(
      (await test.request("/reset-password", { token, newPassword })).status
    ).toBeGreaterThanOrEqual(400)
    expect((await login()).status).toBeGreaterThanOrEqual(400)
    expect(
      (await test.request("/sign-in/email", { email, password: newPassword }))
        .data.twoFactorRedirect
    ).toBe(true)
  })
  it("verifies email without automatically creating a session that bypasses MFA", async () => {
    await test.request("/send-verification-email", {
      email,
      callbackURL: "/email-verified",
    })
    expect(test.mail.verify).toBeTruthy()
    const url = new URL(test.mail.verify!)
    const response = await test.request(
      url.pathname.replace("/api/auth", "") + url.search
    )
    expect(response.status).toBe(302)
    expect(test.data.user[0].emailVerified).toBe(true)
    expect((await test.request("/get-session")).data).toBeNull()
  })
  it("rejects expired reset and magic-link tokens", async () => {
    await test.request("/request-password-reset", {
      email,
      redirectTo: "/password-reset",
    })
    const token = new URL(test.mail.reset!).pathname.split("/").pop()!
    for (const record of test.data.verification) record.expiresAt = new Date(0)
    expect(
      (
        await test.request("/reset-password", {
          token,
          newPassword: "NewFixturePass456!",
        })
      ).status
    ).toBeGreaterThanOrEqual(400)
    await test.request("/sign-in/magic-link", { email })
    expect(
      test.data.verification.some(
        (record) => record.identifier === test.mail.magic
      )
    ).toBe(false)
    for (const record of test.data.verification) record.expiresAt = new Date(0)
    expect(
      (await test.request(`/magic-link/verify?token=${test.mail.magic}`)).status
    ).not.toBe(200)
    expect((await test.request("/get-session")).data).toBeNull()
  })
  it("does not create accounts through passwordless endpoints", async () => {
    const before = test.data.user.length
    await test.request("/email-otp/send-verification-otp", {
      email: "missing@example.test",
      type: "sign-in",
    })
    await test.request("/sign-in/email-otp", {
      email: "missing@example.test",
      otp: "123456",
    })
    await test.request("/sign-in/magic-link", { email: "missing@example.test" })
    if (test.mail.magic)
      await test.request(`/magic-link/verify?token=${test.mail.magic}`)
    expect(test.data.user.length).toBe(before)
    expect((await test.request("/get-session")).data).toBeNull()
  })
})
