import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
vi.mock("server-only", () => ({}))
import en from "@/templates/language/en.json"
import ar from "@/templates/language/ar.json"
import { CustomHtmlRender } from "@/widgets/custom-html"
import { AdManagerRender } from "@/widgets/ad-manager"
import { DEFAULT_THEME } from "@/components/site/utils"
describe("Appearance HTML renderer boundaries", () => {
  it.each([en, ar])(
    "sanitizes legacy custom HTML and advertisement HTML at the final sink",
    (dict) => {
      for (const Component of [CustomHtmlRender, AdManagerRender]) {
        const html = renderToStaticMarkup(
          createElement(Component, {
            theme: { ...DEFAULT_THEME, dict },
            item: {
              id: "a",
              type: "custom_html",
              title: "<script>Title</script>",
              content:
                '<p>Safe</p><script>alert(1)</script><img src=x onerror="alert(1)"><iframe src="https://evil.test"></iframe>',
              config: { adType: "html", sponsorName: "<script>Title</script>" },
            },
          })
        )
        expect(html).toContain("<p>Safe</p>")
        expect(html).not.toMatch(/<script|onerror|<iframe/)
        expect(html).toContain("&lt;script&gt;")
      }
    }
  )
  it("rejects unsafe banner image and target URLs on direct renderer calls", () => {
    const html = renderToStaticMarkup(
      createElement(AdManagerRender, {
        theme: DEFAULT_THEME,
        item: {
          id: "a",
          type: "plugin_ad",
          title: "",
          config: {
            adType: "banner",
            imageUrl: "data:text/html,evil",
            targetUrl: "javascript:alert(1)",
          },
        },
      })
    )
    expect(html).toBe("")
  })
})
