import { afterEach, describe, expect, it, vi } from "vitest"
import { encryptValue, decryptValue } from "@/lib/encryption"
afterEach(() => vi.unstubAllEnvs())
describe("SMTP credential storage", () => {
  it("uses authenticated randomized encryption and preserves password whitespace", () => {
    vi.stubEnv("ENCRYPTION_KEY", "fixture-key-with-enough-entropy")
    const value = "  smtp secret  "
    const encrypted = encryptValue(value)
    expect(encrypted).not.toContain(value)
    expect(encryptValue(value)).not.toBe(encrypted)
    expect(decryptValue(encrypted)).toBe(value)
    expect(() =>
      decryptValue(
        encrypted.slice(0, -2) + (encrypted.endsWith("ff") ? "00" : "ff")
      )
    ).toThrow()
    expect(() => encryptValue(encrypted)).toThrow()
  })
  it("fails closed without a configured secret", () => {
    for (const key of ["ENCRYPTION_KEY", "AUTH_SECRET", "DATABASE_URL"])
      vi.stubEnv(key, "")
    expect(() => encryptValue("private-password")).toThrow()
  })
  it("fails closed on corrupt ciphertext and retains legacy plaintext reads", () => {
    vi.stubEnv("ENCRYPTION_KEY", "fixture-key")
    expect(() => decryptValue("enc:gcm:broken")).toThrow()
    expect(decryptValue("legacy-password")).toBe("legacy-password")
  })
})
