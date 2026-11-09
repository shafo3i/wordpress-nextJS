import { beforeEach, describe, expect, it, vi } from "vitest"
const mocks = vi.hoisted(() => ({
  headers: new Map<string, string>(),
  cookies: new Map<string, string>(),
}))
vi.mock("next/headers", () => ({
  headers: async () => ({ get: (key: string) => mocks.headers.get(key) }),
  cookies: async () => ({
    get: (key: string) =>
      mocks.cookies.has(key) ? { value: mocks.cookies.get(key) } : undefined,
  }),
}))
vi.mock("@/services/language.service", () => ({
  getActiveLanguages: async () => [
    { code: "ar", direction: "rtl" },
    { code: "en", direction: "ltr" },
  ],
  getDefaultLanguage: async () => ({ code: "ar", direction: "rtl" }),
  getTranslations: async (code: string) => ({ language: code }),
}))
import { getPublicLanguageContext } from "@/lib/public-language"
import { authFlowUrl } from "@/lib/auth-navigation"
beforeEach(() => {
  mocks.headers.clear()
  mocks.cookies.clear()
  mocks.headers.set("x-cms-pathname", "/cms-login")
  mocks.cookies.set("admin_lang", "ar")
})
describe("visitor and authentication language", () => {
  it.each(["/cms-login", "/cms-admin", "/forgot-password", "/verify-2fa"])(
    "uses visitor language independently of admin language at %s",
    async (path) => {
      mocks.headers.set("x-cms-pathname", path)
      mocks.cookies.set("site_lang", "en")
      expect(await getPublicLanguageContext()).toMatchObject({
        code: "en",
        direction: "ltr",
      })
    }
  )
  it("lets an explicit active language override cookies", async () => {
    mocks.cookies.set("site_lang", "ar")
    expect((await getPublicLanguageContext("en")).code).toBe("en")
  })
  it("derives login language from the public callback and preserves the default-language route", async () => {
    expect(
      (await getPublicLanguageContext(undefined, "/en/posts/story")).code
    ).toBe("en")
    mocks.cookies.set("site_lang", "en")
    expect(
      (await getPublicLanguageContext(undefined, "/posts/story")).code
    ).toBe("ar")
  })
  it("keeps unprefixed public pages in the default language despite an old visitor cookie", async () => {
    mocks.headers.set("x-cms-pathname", "/posts/story")
    mocks.cookies.set("site_lang", "en")
    expect((await getPublicLanguageContext()).code).toBe("ar")
    mocks.headers.set("x-cms-locale", "en")
    expect((await getPublicLanguageContext()).code).toBe("en")
  })
  it("rejects inactive languages and ignores the admin preference", async () => {
    mocks.cookies.set("site_lang", "fr")
    mocks.cookies.set("admin_lang", "en")
    expect((await getPublicLanguageContext("fr")).code).toBe("ar")
  })
  it("preserves language and safe redirect validation across recovery links", () => {
    const url = new URL(
      authFlowUrl("/verify-2fa", "//outside.example", "/cms-admin", "en"),
      "https://local.test"
    )
    expect(url.searchParams.get("lang")).toBe("en")
    expect(url.searchParams.get("callbackUrl")).toBe("/")
  })
})
