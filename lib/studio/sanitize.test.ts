import DOMPurify from "isomorphic-dompurify"
import { describe, expect, it } from "vitest"
import {
  sanitizeStudioDocument,
  sanitizeStudioMarkup,
  sanitizeStudioWidgetConfig,
} from "./sanitize"
import { createStudioElement } from "./tree-helpers"

function parse(markup: string) {
  const fragment = DOMPurify.sanitize("", { RETURN_DOM_FRAGMENT: true })
  const host = fragment.ownerDocument.createElement("div")
  host.innerHTML = markup
  return host
}

describe("Studio HTML/SVG policy", () => {
  it.each([
    '<img src="x" onerror="alert(1)"><script>alert(1)</script>',
    '<iframe srcdoc="<script>alert(1)</script>"></iframe><object data="javascript:alert(1)"></object>',
    '<a href="java&#x73;cript:alert(1)">link</a>',
    '<a href="data:text/html,<script>alert(1)</script>">link</a>',
    '<form id="location"><input name="__proto__"></form>',
    '<math><mtext><table><mglyph><style><!--</style><img title="--><img src=x onerror=alert(1)>">',
    "<svg><foreignObject><img src=x onerror=alert(1)></foreignObject></svg>",
    '<div style="background:url(javascript:alert(1))" onclick="alert(1)">text</div>',
  ])("removes active HTML payloads: %s", (payload) => {
    const host = parse(sanitizeStudioMarkup(payload))
    expect(
      host.querySelector("script,iframe,object,embed,form,input,svg,math,style")
    ).toBeNull()
    for (const element of host.querySelectorAll("*")) {
      expect(
        Array.from(element.attributes).some(
          (attr) => /^on/i.test(attr.name) || attr.name === "style"
        )
      ).toBe(false)
      expect(element.getAttribute("href") || "").not.toMatch(
        /^(javascript|data|vbscript):/i
      )
    }
  })

  it("preserves basic editorial HTML and safe links", () => {
    const host = parse(
      sanitizeStudioMarkup(
        '<h2>Title</h2><p><strong>News</strong> <a href="/politics">Read</a></p>'
      )
    )
    expect(host.querySelector("h2")?.textContent).toBe("Title")
    expect(host.querySelector("strong")?.textContent).toBe("News")
    expect(host.querySelector("a")?.getAttribute("href")).toBe("/politics")
  })

  it("keeps drawing SVGs and strips handlers, animation, embedded HTML, and external references", () => {
    const host = parse(
      sanitizeStudioMarkup(
        '<svg viewBox="0 0 24 24" onload="alert(1)"><defs><linearGradient id="paint"><stop offset="0" stop-color="red"/></linearGradient></defs><path d="M0 0h24" fill="url(#paint)"/><circle r="2" fill="url(https://evil.example/track)"/><use href="javascript:alert(1)"/><animate attributeName="href" values="javascript:alert(1)"/><foreignObject><iframe srcdoc="bad"/></foreignObject></svg>',
        true
      )
    )
    expect(host.querySelector("svg")?.getAttribute("viewBox")).toBe("0 0 24 24")
    expect(host.querySelector("path")?.getAttribute("fill")).toBe("url(#paint)")
    expect(host.querySelector("circle")?.hasAttribute("fill")).toBe(false)
    expect(host.querySelector("use,animate,foreignObject,iframe")).toBeNull()
    expect(host.querySelector("[onload]")).toBeNull()
  })

  it("does not permit CSS escapes in SVG paint attributes", () => {
    const host = parse(
      sanitizeStudioMarkup(
        '<svg><path d="M0 0h10" fill="u\\72l(https://evil.example/paint)"/></svg>',
        true
      )
    )
    expect(host.querySelector("path")?.hasAttribute("fill")).toBe(false)
  })

  it("protects registered Custom HTML/ad widget configuration, including legacy payloads", () => {
    const input = {
      content: '<img src=x onerror="alert(1)"><b>Ad</b>',
      nested: { htmlCode: "<script>bad()</script><p>Safe</p>" },
      imageUrl: "javascript:alert(1)",
      targetUrl: "/sponsor",
      count: 5,
    }
    const output = sanitizeStudioWidgetConfig(input)
    expect(String(output.content)).not.toContain("onerror")
    expect(output.content).toContain("<b>Ad</b>")
    expect(output.nested).toEqual({ htmlCode: "<p>Safe</p>" })
    expect(output.imageUrl).toBe("")
    expect(output.targetUrl).toBe("/sponsor")
    expect(output.count).toBe(5)
    expect(input.content).toContain("onerror")
  })

  it("sanitizes the saved document without mutating the submitted snapshot", () => {
    const element = createStudioElement("html")
    element.settings.htmlCode = "<p>Saved</p><script>alert(1)</script>"
    const doc = {
      version: "1.0",
      pageTemplate: "studio_canvas" as const,
      elements: [element],
    }
    expect(sanitizeStudioDocument(doc).elements[0].settings.htmlCode).toBe(
      "<p>Saved</p>"
    )
    expect(doc.elements[0].settings.htmlCode).toContain("<script>")
  })
})
