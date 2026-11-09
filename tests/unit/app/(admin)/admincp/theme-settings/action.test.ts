import { beforeEach, describe, expect, it, vi } from "vitest"
const mocks = vi.hoisted(() => ({
  guard: vi.fn(),
  save: vi.fn(),
  revalidate: vi.fn(),
}))
vi.mock("@/lib/authMIddleware", () => ({ verifyAdminOrEditor: mocks.guard }))
vi.mock("@/lib/themes/loader", () => ({
  getAllThemes: async () => [{ slug: "theme" }],
}))
vi.mock("@/services/theme-layout.service", () => ({
  saveThemeLayout: mocks.save,
}))
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }))
import { saveThemeLayoutAction } from "@/app/(admin)/admincp/theme-settings/action"
const patch = {
  layout: "full_width",
  sidebarWidth: null,
  columnGap: 0,
  stickySidebars: false,
}

describe("theme layout action", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.guard.mockResolvedValue({})
    mocks.save.mockResolvedValue(undefined)
  })
  it("does not write without an editor/admin session", async () => {
    mocks.guard.mockRejectedValue(new Error("Forbidden"))
    expect((await saveThemeLayoutAction("theme", patch)).success).toBe(false)
    expect(mocks.save).not.toHaveBeenCalled()
  })
  it("rejects unknown themes and forged builder content", async () => {
    expect((await saveThemeLayoutAction("unknown", patch)).success).toBe(false)
    expect(
      (await saveThemeLayoutAction("theme", { ...patch, blocks: [] })).success
    ).toBe(false)
    expect(mocks.save).not.toHaveBeenCalled()
  })
  it("saves only validated layout fields and refreshes public layouts", async () => {
    expect((await saveThemeLayoutAction("theme", patch)).success).toBe(true)
    expect(mocks.save).toHaveBeenCalledWith("theme", patch)
    expect(mocks.revalidate).toHaveBeenCalledWith("/", "layout")
  })
})
