import { describe, expect, it } from "vitest";
import { betterAuth } from "better-auth";
import { memoryAdapter } from "better-auth/adapters/memory";
import { admin } from "better-auth/plugins/admin";
import { securedTwoFactor } from "@/lib/auth-two-factor";

describe("actual Better Auth public account input", () => {
  it("does not allow signup or self-update to set roles, verification or MFA flags", async () => {
    const data: Record<string, Record<string, unknown>[]> = {
      user: [],
      session: [],
      account: [],
      verification: [],
      twoFactor: [],
    };
    const auth = betterAuth({
      baseURL: "http://localhost:3000",
      secret: "isolated-users-fixture-secret-at-least-32-characters",
      database: memoryAdapter(data),
      rateLimit: { enabled: false },
      emailAndPassword: { enabled: true },
      plugins: [admin({ defaultRole: "subscriber" }), securedTwoFactor()],
    });
    const jar = new Map<string, string>();
    const request = async (path: string, body: Record<string, unknown>) => {
      const response = await auth.handler(
        new Request(`http://localhost:3000/api/auth${path}`, {
          method: "POST",
          headers: {
            Origin: "http://localhost:3000",
            "Content-Type": "application/json",
            Cookie: [...jar]
              .map(([key, value]) => `${key}=${value}`)
              .join("; "),
          },
          body: JSON.stringify(body),
        })
      );
      for (const cookie of response.headers.getSetCookie()) {
        const [pair] = cookie.split(";"),
          separator = pair.indexOf("=");
        jar.set(pair.slice(0, separator), pair.slice(separator + 1));
      }
      return response;
    };
    const input = {
      name: "Reader",
      email: "reader@example.test",
      password: "IsolatedAccountFixture123!",
    };
    await request("/sign-up/email", {
      ...input,
      role: "admin",
      emailVerified: true,
      twoFactorEnabled: true,
    });
    if (!data.user.length)
      expect((await request("/sign-up/email", input)).ok).toBe(true);
    expect(data.user).toHaveLength(1);
    expect(data.user[0].role).toBe("subscriber");
    expect(data.user[0].emailVerified).toBe(false);
    expect(data.user[0].twoFactorEnabled).not.toBe(true);
    // Simulate an enrolled account and verify the ordinary profile endpoint
    // cannot turn off MFA or promote the caller by adding privileged fields.
    data.user[0].twoFactorEnabled = true;
    await request("/update-user", {
      name: "Updated",
      role: "admin",
      emailVerified: true,
      twoFactorEnabled: false,
      banned: false,
    });
    expect(data.user[0].role).toBe("subscriber");
    expect(data.user[0].emailVerified).toBe(false);
    expect(data.user[0].twoFactorEnabled).toBe(true);
  });
});
