import { beforeEach, describe, expect, it, vi } from "vitest"
import en from "@/templates/language/en.json"
const mocks = vi.hoisted(() => ({
  guard: vi.fn(),
  custom: vi.fn(),
  widgets: vi.fn(),
  menu: vi.fn(),
  create: vi.fn(),
  remove: vi.fn(),
  revalidate: vi.fn(),
}))
vi.mock("@/lib/authMIddleware", () => ({ verifyAdmin: mocks.guard }))
vi.mock("@/components/admin/admin-shell", () => ({
  getAdminLanguageContext: async () => ({ dict: en }),
}))
vi.mock("@/lib/themes/customizer", () => ({ saveCustomizerData: mocks.custom }))
vi.mock("@/lib/widgets/db", () => ({ saveWidgetArea: mocks.widgets }))
vi.mock("@/services/menu.service", () => ({
  saveMenu: mocks.menu,
  createMenu: mocks.create,
  deleteMenu: mocks.remove,
}))
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }))
vi.mock("next/navigation", () => ({
  unstable_rethrow: (error: Error) => {
    if (error.message === "NEXT_REDIRECT") throw error
  },
}))
import { saveCustomizerAction } from "@/app/(admin)/admincp/customize/actions"
import { saveWidgetAreaAction } from "@/app/(admin)/admincp/widgets/actions"
import {
  saveMenuAction,
  createMenuAction,
  deleteMenuAction,
} from "@/app/(admin)/admincp/menus/action"
beforeEach(() => {
  vi.resetAllMocks()
  mocks.guard.mockResolvedValue({ user: { id: "admin", role: "admin" } })
})
const calls = [
  () =>
    saveCustomizerAction("theme", {}, { siteTitle: "Site", siteTagline: "" }),
  () => saveWidgetAreaAction("footer_1", []),
  () => saveMenuAction("1", "Menu", [], []),
  () => createMenuAction("Menu"),
  () => deleteMenuAction("1"),
]
describe("Appearance action boundaries", () => {
  it("preserves authorization redirects before any service or error handler runs", async () => {
    mocks.guard.mockRejectedValue(Error("NEXT_REDIRECT"))
    for (const run of calls)
      await expect(run()).rejects.toThrow("NEXT_REDIRECT")
    for (const service of [
      mocks.custom,
      mocks.widgets,
      mocks.menu,
      mocks.create,
      mocks.remove,
    ])
      expect(service).not.toHaveBeenCalled()
  })
  it("redacts database details for every action and does not invalidate failed writes", async () => {
    for (const service of [
      mocks.custom,
      mocks.widgets,
      mocks.menu,
      mocks.create,
      mocks.remove,
    ])
      service.mockRejectedValue(Error("private SQL and credentials"))
    for (const run of calls) {
      const result = await run()
      expect(result.success).toBe(false)
      expect(result.error).not.toContain("private SQL")
      expect(result.error).toBeTruthy()
    }
    expect(mocks.revalidate).not.toHaveBeenCalled()
  })
  it("invalidates public layouts only after a successful mutation", async () => {
    expect((await saveMenuAction("1", "Menu", [], [])).success).toBe(true)
    expect(mocks.revalidate).toHaveBeenCalledWith("/", "layout")
  })
})
