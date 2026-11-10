import { beforeEach, describe, expect, it, vi } from "vitest"
import type { FilterCallback } from "@/lib/plugins/types"
const { hooks, config } = vi.hoisted(() => ({
  hooks: [] as FilterCallback<string>[],
  config: vi.fn(),
}))
vi.mock("@/lib/plugins/hooks", () => ({
  addFilter: (_tag: string, callback: FilterCallback<string>) =>
    hooks.push(callback),
}))
vi.mock("@/lib/plugins/config", () => ({ getPluginConfig: config }))
import { init as ads } from "@/plugins/ad-manager"
import { init as toc } from "@/plugins/table-of-contents"
beforeEach(() => {
  hooks.length = 0
  vi.clearAllMocks()
})
describe("safe plugin output and working navigation", () => {
  it("honors ad placement and removes executable HTML", async () => {
    ads()
    config.mockResolvedValue({
      enabled: true,
      sponsorName: "<img src=x onerror=bad()>",
      customHtml: '<img src="/ad.jpg" onerror="bad()"><script>bad()</script>',
      placement: "before_content",
    })
    const result = await hooks[0]("<p>Body</p>", {
      theme: { dict: { "admin.plugins.sponsored": "Sponsored" } },
    })
    expect(result).not.toContain("<script>")
    expect(result).not.toContain('onerror="bad()"')
    expect(result).toContain("&lt;img")
    expect(result.endsWith("<p>Body</p>")).toBe(true)
  })
  it("creates actual links for all headings, avoids ID collisions, and respects the minimum", async () => {
    toc()
    config.mockResolvedValue({
      minHeadings: 2,
      levels: ["h2", "h3"],
      collapsible: true,
    })
    const body =
      '<h2 id="article-heading-2">Existing</h2><h3>Second <em>heading</em></h3><h3>Third</h3>'
    const result = await hooks[0](body)
    expect(result).toContain('href="#article-heading-2"')
    expect(result).toContain('id="article-heading-3"')
    expect(result).toContain("<details open>")
    config.mockResolvedValue({ minHeadings: 5, levels: ["h2", "h3"] })
    expect(await hooks[0](body)).toBe(body)
  })
})
