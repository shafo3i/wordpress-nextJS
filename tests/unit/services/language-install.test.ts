import { describe, expect, it, vi } from "vitest"
import type { DB } from "@/db"
vi.mock("server-only", () => ({}))
vi.mock("@/db", () => ({ db: {} }))
const mocks = vi.hoisted(() => ({ guard: vi.fn(), rate: vi.fn() }))
vi.mock("@/lib/authMIddleware", () => ({ verifyAdmin: mocks.guard }))
vi.mock("@/lib/rate-limit", () => ({ checkCmsRateLimit: mocks.rate }))
vi.mock("@/services/language.service", () => ({
  getAvailableTemplateLocales: () => ["fr"],
  getTemplateTranslations: () => ({ "language.name": "French", "language.native_name": "Français", "language.direction": "ltr", hello: "Bonjour" }),
}))
import { installLanguageTemplate, getInstallableLanguageTemplates } from "@/services/language-sync.service"

describe("bundled language installation", () => {
  it("discovers template metadata without a hardcoded language list", () => {
    expect(getInstallableLanguageTemplates()).toEqual([{ code: "fr", name: "French", nativeName: "Français", direction: "ltr" }])
  })
  it("rejects unauthorized and unbundled languages before opening a transaction", async () => {
    const transaction = vi.fn()
    mocks.guard.mockRejectedValueOnce(new Error("denied"))
    await expect(installLanguageTemplate({ code: "fr" }, { transaction } as unknown as DB)).rejects.toThrow("denied")
    mocks.guard.mockResolvedValue({ user: { id: "admin" } })
    await expect(installLanguageTemplate({ code: "../../evil" }, { transaction } as unknown as DB)).rejects.toThrow()
    await expect(installLanguageTemplate({ code: "de" }, { transaction } as unknown as DB)).rejects.toThrow()
    expect(transaction).not.toHaveBeenCalled()
  })
  it("installs the first language as active default and preserves existing translations on repeated installation", async () => {
    mocks.guard.mockResolvedValue({ user: { id: "admin" } })
    const languages: Record<string, unknown>[] = []
    const wording = new Map([["hello", "Custom wording"]])
    const tx = {
      execute: vi.fn(),
      select: () => ({ from: async () => languages.map(item => ({ ...item })) }),
      insert: () => ({ values: (rows: Record<string, unknown> | Record<string, unknown>[]) => ({
        onConflictDoNothing: () => {
          if (!Array.isArray(rows)) {
            if (!languages.length) languages.push(rows)
            return Promise.resolve()
          }
          for (const row of rows) if (!wording.has(String(row.key))) wording.set(String(row.key), String(row.value))
          return Promise.resolve()
        },
      }) }),
    }
    const database = { transaction: async (operation: (value: typeof tx) => unknown) => operation(tx) } as unknown as DB
    await installLanguageTemplate({ code: "fr" }, database)
    await installLanguageTemplate({ code: "fr" }, database)
    expect(languages).toHaveLength(1)
    expect(languages[0]).toMatchObject({ code: "fr", isDefault: true, isActive: true, direction: "ltr" })
    expect(wording.get("hello")).toBe("Custom wording")
    expect(wording.get("language.native_name")).toBe("Français")
  })
  it.each([false, true])("changes an existing default only when requested: %s", async isDefault => {
    mocks.guard.mockResolvedValue({ user: { id: "admin" } })
    const set = vi.fn().mockResolvedValue(undefined)
    const values = vi.fn().mockReturnValue({ onConflictDoNothing: async () => {} })
    const tx = {
      execute: async () => {},
      select: () => ({ from: async () => [{ code: "en", isDefault: true, isActive: true }] }),
      update: () => ({ set }), insert: () => ({ values }),
    }
    await installLanguageTemplate({ code: "fr", isDefault }, { transaction: async (fn: (value: typeof tx) => unknown) => fn(tx) } as unknown as DB)
    expect(set).toHaveBeenCalledTimes(isDefault ? 1 : 0)
    expect(values.mock.calls[0][0]).toMatchObject({ code: "fr", isDefault, isActive: true })
  })
})
