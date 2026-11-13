import { beforeEach, describe, expect, it, vi } from "vitest"
vi.mock("server-only", () => ({}))
const mocks = vi.hoisted(() => ({
  session: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  page: [] as { id: bigint }[],
  quota: 1,
  reads: vi.fn(),
}))
vi.mock("@/auth", () => ({ auth: { api: { getSession: mocks.session } } }))
vi.mock("next/headers", () => ({ headers: async () => new Headers() }))
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error("redirect:" + path)
  },
}))
vi.mock("@/db", () => {
  const tx = {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => {
            mocks.reads()
            return mocks.page
          },
        }),
      }),
    }),
    insert: () => ({ values: mocks.insert }),
    update: () => ({
      set: (value: unknown) => ({ where: async () => mocks.update(value) }),
    }),
  }
  return {
    db: {
      ...tx,
      transaction: async (work: (value: typeof tx) => Promise<unknown>) =>
        work(tx),
      insert: () => ({
        values: () => ({
          onConflictDoUpdate: () => ({
            returning: async () => [{ count: mocks.quota }],
          }),
        }),
      }),
    },
  }
})
import {
  saveAdminSettings,
  reserveSettingsTestEmail,
  getAllSettings,
} from "@/services/settings.service"
beforeEach(() => {
  vi.clearAllMocks()
  mocks.page = []
  mocks.quota = 1
  mocks.session.mockResolvedValue({ user: { id: "admin-1", role: "admin" } })
})
describe("Settings service boundaries", () => {
  it.each(["editor", "subscriber", "author", "custom"])(
    "denies %s before sensitive reads, writes and test email reservations",
    async (role) => {
      mocks.session.mockResolvedValue({ user: { id: "other", role } })
      await expect(saveAdminSettings({ blogname: "Changed" })).rejects.toThrow(
        "redirect:"
      )
      await expect(reserveSettingsTestEmail()).rejects.toThrow("redirect:")
      await expect(getAllSettings()).rejects.toThrow("redirect:")
      expect(mocks.reads).not.toHaveBeenCalled()
      expect(mocks.insert).not.toHaveBeenCalled()
    }
  )
  it.each([
    { active_plugins: "[]" },
    { custom_header_scripts: "<script>alert(1)</script>" },
    { custom_footer_scripts: "<img onerror=alert(1)>" },
    { siteurl: "javascript:alert(1)" },
    { og_default_image: "//evil.test/x" },
    { smtp_host: "https://evil.test/path" },
    { smtp_from_name: "Name\r\nBcc:evil" },
    { smtp_pass: "enc:gcm:attacker-supplied" },
    { page_on_front: "999999999999999999999999999999" },
  ])("rejects unsafe or privileged settings %j", async (values) => {
    await expect(saveAdminSettings(values)).rejects.toThrow()
    expect(mocks.insert).not.toHaveBeenCalled()
    expect(mocks.update).not.toHaveBeenCalled()
  })
  it("keeps registration flags consistent", async () => {
    await saveAdminSettings({ users_can_register: "0", disableSignUp: "false" })
    expect(mocks.insert.mock.calls.map(([value]) => value)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          optionName: "users_can_register",
          optionValue: "0",
        }),
        expect.objectContaining({
          optionName: "disableSignUp",
          optionValue: "true",
        }),
      ])
    )
  })
  it("rejects missing/non-page homepage identifiers before saving other settings", async () => {
    await expect(
      saveAdminSettings({ page_on_front: "42", blogname: "Changed" })
    ).rejects.toThrow("Invalid front page")
    expect(mocks.insert).not.toHaveBeenCalled()
    expect(mocks.update).not.toHaveBeenCalled()
  })
  it("rejects over-quota test-email reservations", async () => {
    mocks.quota = 4
    await expect(reserveSettingsTestEmail()).rejects.toThrow("quota")
    mocks.quota = 3
    await expect(reserveSettingsTestEmail()).resolves.toBeUndefined()
  })
})
