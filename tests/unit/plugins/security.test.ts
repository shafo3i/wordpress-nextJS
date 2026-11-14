vi.mock("server-only", () => ({}))
import { describe, it, expect, vi, beforeEach } from "vitest"
const { session, mutate, configWrite, subscriberWrite } = vi.hoisted(() => ({
  session: vi.fn(),
  mutate: vi.fn(),
  configWrite: vi.fn(),
  subscriberWrite: vi.fn(),
}))
vi.mock("@/lib/plugins/config", () => ({ savePluginConfig: configWrite }))
vi.mock("@/lib/newsletter/db", () => ({
  removeNewsletterSubscriber: subscriberWrite,
  clearAllNewsletterSubscribers: subscriberWrite,
}))
vi.mock("@/lib/authMIddleware", () => ({ verifyAdmin: session }))
vi.mock("@/services/plugin.service", () => ({
  togglePlugin: mutate,
  installPlugin: mutate,
  uninstallPlugin: mutate,
  bulkUpdatePlugins: mutate,
}))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
import {
  togglePluginAction,
  installPluginAction,
  uninstallPluginAction,
  bulkPluginsAction,
} from "@/app/(admin)/admincp/plugins/action"
import { pluginConfigSchemas } from "@/db/schema/cms-plugins"
import { sanitizePluginMarkup } from "@/lib/plugins/markup"
import {
  savePluginConfigAction,
  deleteSubscriberAction,
  clearSubscribersAction,
} from "@/app/(admin)/admincp/plugins/[slug]/actions"
beforeEach(() => {
  vi.clearAllMocks()
  session.mockResolvedValue({ user: { id: "admin", role: "admin" } })
})
describe("plugin mutation boundary", () => {
  it("also protects configuration and subscriber actions from editors", async () => {
    session.mockResolvedValue({ user: { id: "editor", role: "editor" } })
    await expect(savePluginConfigAction("newsletter", {})).rejects.toThrow(
      "admin.plugins.forbidden"
    )
    await expect(deleteSubscriberAction("reader@example.org")).rejects.toThrow(
      "admin.plugins.forbidden"
    )
    await expect(clearSubscribersAction()).rejects.toThrow(
      "admin.plugins.forbidden"
    )
    expect(configWrite).not.toHaveBeenCalled()
    expect(subscriberWrite).not.toHaveBeenCalled()
  })
  it.each(["editor", "subscriber"])(
    "rejects %s without a service write",
    async (role) => {
      session.mockResolvedValue({ user: { id: "user", role } })
      for (const action of [
        () => togglePluginAction("newsletter", true),
        () => installPluginAction("newsletter"),
        () => uninstallPluginAction("newsletter"),
        () => bulkPluginsAction(["newsletter"], "delete"),
      ])
        await expect(action()).rejects.toThrow("admin.plugins.forbidden")
      expect(mutate).not.toHaveBeenCalled()
    }
  )
  it("rejects unauthenticated calls, unknown slugs, retired activation and invalid bulk actions", async () => {
    session.mockRejectedValueOnce(new Error("unauthenticated"))
    await expect(togglePluginAction("newsletter", true)).rejects.toThrow(
      "unauthenticated"
    )
    expect(await installPluginAction("../evil")).toHaveProperty("error")
    expect(await togglePluginAction("social-share", true)).toHaveProperty(
      "error"
    )
    expect(
      await bulkPluginsAction(["newsletter"], "invalid" as "activate")
    ).toHaveProperty("error")
    expect(mutate).not.toHaveBeenCalled()
  })
  it("allows administrators to activate supported plugins", async () => {
    expect(await togglePluginAction("related-posts", true)).toEqual({
      success: true,
    })
    expect(mutate).toHaveBeenCalledWith("related-posts", true)
  })
  it("rejects executable URLs and unknown settings, strips executable ad markup", () => {
    expect(
      pluginConfigSchemas["ad-manager"].safeParse({
        targetUrl: "javascript:alert(1)",
      }).success
    ).toBe(false)
    expect(
      pluginConfigSchemas["related-posts"].safeParse({ count: 1000 }).success
    ).toBe(false)
    expect(
      pluginConfigSchemas.newsletter.safeParse({ unrecognized: true }).success
    ).toBe(false)
    const html = sanitizePluginMarkup(
      '<img src="/ad.jpg" onerror="bad()"><script>bad()</script><a href="javascript:bad()">Ad</a>'
    )
    expect(html).not.toMatch(/onerror|<script|javascript:/)
    expect(html).toContain("/ad.jpg")
  })
})

it("removes active URL schemes from ad HTML and protects new-window links", () => {
  const html = sanitizePluginMarkup(
    '<a target="_blank" href="https://sponsor.test">Ad</a><img src="data:image/svg+xml,evil"><a href="//evil.test">bad</a><a href="file:///private">file</a>'
  )
  expect(html).not.toContain("data:")
  expect(html).not.toContain("file:")
  expect(html).not.toContain("//evil.test")
  expect(html).toContain("noopener noreferrer")
})
