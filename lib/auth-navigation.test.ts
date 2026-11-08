import { describe, expect, it } from "vitest"
import {
  authFlowUrl,
  requiresTwoFactor,
  safeAuthRedirect,
} from "./auth-navigation"

describe("authentication navigation", () => {
  it.each([null, undefined, 123, ["/admincp", "/"]])(
    "rejects non-scalar redirect values",
    (value) => {
      expect(safeAuthRedirect(value)).toBe("/")
    }
  )
  it.each([
    "https://evil.test",
    "//evil.test",
    "/\\evil.test",
    "/%5cevil.test",
    "/%2fexample.test",
    "/%0aLocation:x",
    "javascript:alert(1)",
    "/%zz",
  ])("rejects unsafe redirect %s", (value) => {
    expect(safeAuthRedirect(value, "/admincp")).toBe("/admincp")
  })
  it("preserves safe local paths and challenge destinations", () => {
    expect(safeAuthRedirect("/admincp/posts?page=2")).toBe(
      "/admincp/posts?page=2"
    )
    const url = new URL(
      authFlowUrl("/verify-2fa", "/admincp/posts", "/cms-admin"),
      "https://local.test"
    )
    expect(url.searchParams.get("callbackUrl")).toBe("/admincp/posts")
    expect(url.searchParams.get("login")).toBe("/cms-admin")
    expect(requiresTwoFactor({ twoFactorRedirect: true })).toBe(true)
    expect(requiresTwoFactor({ token: "" })).toBe(false)
  })
})
