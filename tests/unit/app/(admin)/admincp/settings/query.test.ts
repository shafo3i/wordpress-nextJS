import { describe, expect, it, vi } from "vitest"
vi.mock("@/lib/authMIddleware", () => ({
  verifyAdmin: async () => ({ user: { role: "admin" } }),
}))
vi.mock("@/services/settings.service", () => ({
  getAllSettings: async () => ({
    blogname: "Publication",
    smtp_pass: "private-stored-password",
  }),
}))
vi.mock("@/services/page.service", () => ({
  getAllParentPageOptions: async () => [],
}))
vi.mock("@/lib/themes/customizer", () => ({
  getCustomizerData: async () => ({ mods: {} }),
}))
import { getSettingsQuery } from "@/app/(admin)/admincp/settings/query"

describe("settings browser boundary", () => {
  it("keeps stored SMTP passwords out of browser props", async () => {
    const settings = await getSettingsQuery()
    expect(settings.blogname).toBe("Publication")
    expect(settings.smtp_pass).toBe("")
    expect(JSON.stringify(settings)).not.toContain("private-stored-password")
  })
})
