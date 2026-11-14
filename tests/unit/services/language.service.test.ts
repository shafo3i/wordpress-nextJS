import { vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/authMIddleware", () => ({ verifyAdmin: async () => ({ user: { role: "admin", id: "admin" } }), verifyPostEditor: async () => ({ user: { role: "admin", id: "admin" } }) }));
import { describe, expect, it } from "vitest"
import type { DB } from "@/db"
import { getTranslations } from "@/services/language.service"
import en from "@/templates/language/en.json"
import ar from "@/templates/language/ar.json"

describe("translation override integrity", () => {
  it("ships readable Studio controls and editorial block labels in both languages", () => {
    for (const dict of [en, ar]) {
      for (const [key, value] of Object.entries(dict).filter(
        ([key]) =>
          key.startsWith("admin.studio.") ||
          key.startsWith("admin.theme_settings.block.")
      )) {
        expect(value, key).not.toMatch(/\?{2,}|\uFFFD/)
      }
      expect(dict["admin.studio.advanced.responsive_help"]).toBeTruthy()
    }
  })

  it("falls back to readable Arabic for damaged overrides while retaining custom translations", async () => {
    const database = {
      select: () => ({
        from: () => ({
          where: async () => [
            { key: "site.admin_bar.dashboard", value: "???? ??????" },
            {
              key: "admin.studio.content.preview_language",
              value: "???? ??????",
            },
            { key: "site.admin_bar.edit_page", value: "\uFFFD" },
            { key: "site.admin_bar.visit_site", value: "Custom label" },
            {
              key: "admin.settings.logo.help",
              value: "PNG ?? JPEG ?? WebP ??? 2 ????????.",
            },
          ],
        }),
      }),
    } as unknown as DB
    const dict = await getTranslations("ar", database)
    expect(dict["site.admin_bar.dashboard"]).toBe(
      ar["site.admin_bar.dashboard"]
    )
    expect(dict["site.admin_bar.edit_page"]).toBe(
      ar["site.admin_bar.edit_page"]
    )
    expect(dict["admin.studio.content.preview_language"]).toBe(
      ar["admin.studio.content.preview_language"]
    )
    expect(dict["site.admin_bar.visit_site"]).toBe("Custom label")
    expect(dict["admin.settings.logo.help"]).toBe(
      ar["admin.settings.logo.help"]
    )
    for (const [key, value] of Object.entries(ar).filter(([key]) =>
      key.startsWith("site.admin_bar.")
    )) {
      expect(value, key).toMatch(/\p{Script=Arabic}/u)
      expect(value, key).not.toContain("?")
    }
  })
})
