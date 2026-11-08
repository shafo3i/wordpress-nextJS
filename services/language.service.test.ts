import { describe, expect, it } from "vitest"
import type { DB } from "@/db"
import { getTranslations } from "./language.service"
import ar from "@/templates/language/ar.json"

describe("translation override integrity", () => {
  it("falls back to readable Arabic for damaged overrides while retaining custom translations", async () => {
    const database = {
      select: () => ({
        from: () => ({
          where: async () => [
            { key: "site.admin_bar.dashboard", value: "???? ??????" },
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
