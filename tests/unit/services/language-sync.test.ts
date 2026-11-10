import { describe, expect, it, vi } from "vitest"
import type { DB } from "@/db"
vi.mock("@/db", () => ({ db: {} }))
vi.mock("@/services/language.service", () => ({
  getTemplateTranslations: (code: string) =>
    code === "en" ? { old: "Old", fresh: "New" } : { old: "Localized" },
}))
import { syncMissingTranslations } from "@/services/language-sync.service"

describe("language template synchronization", () => {
  it("adds missing native entries, preserves edits and is idempotent", async () => {
    const stored = new Map([["en:old", "Custom wording"]])
    const tx = {
      insert: () => ({
        values: (
          rows: { languageCode: string; key: string; value: string }[]
        ) => ({
          onConflictDoNothing: () => ({
            returning: async () =>
              rows.flatMap((row) => {
                const key = `${row.languageCode}:${row.key}`
                if (stored.has(key)) return []
                stored.set(key, row.value)
                return [{ id: stored.size }]
              }),
          }),
        }),
      }),
    }
    const database = {
      select: () => ({ from: async () => [{ code: "en" }, { code: "ar" }] }),
      transaction: async (fn: (value: typeof tx) => unknown) => fn(tx),
    } as unknown as DB
    expect(await syncMissingTranslations(database)).toEqual({
      added: 2,
      preserved: 1,
      missing: 1,
      languages: 2,
    })
    expect(stored.get("en:old")).toBe("Custom wording")
    expect(stored.has("ar:fresh")).toBe(false)
    expect((await syncMissingTranslations(database)).added).toBe(0)
  })
})
