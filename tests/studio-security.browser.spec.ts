import { test, expect } from "@playwright/test"
import { build } from "esbuild"
import { fileURLToPath } from "node:url"

declare global {
  interface Window {
    StudioSanitizer: typeof import("../lib/studio/sanitize")
    __studioXss?: number
  }
}

let browserBundle: string
test.beforeAll(async () => {
  const result = await build({
    entryPoints: [
      fileURLToPath(new URL("../lib/studio/sanitize.ts", import.meta.url)),
    ],
    bundle: true,
    write: false,
    format: "iife",
    globalName: "StudioSanitizer",
    platform: "browser",
    metafile: true,
  })
  expect(
    Object.keys(result.metafile.inputs).some((name) =>
      /node_modules\/jsdom\//.test(name)
    )
  ).toBe(false)
  browserBundle = result.outputFiles[0].text
})

test.beforeEach(async ({ page }) => {
  await page.route("**/*", (route) => route.abort())
  await page.setContent('<main id="host"></main>')
  await page.addScriptTag({ content: browserBundle })
})

const payloads = [
  {
    name: "SVG escaped paint URL",
    svg: true,
    markup:
      '<svg><path d="M0 0h10" fill="u\\72l(https://evil.example/paint)"/></svg>',
  },
  {
    name: "script and image handler",
    svg: false,
    markup:
      '<script>window.__studioXss=1</script><img src=x onerror="window.__studioXss=1">',
  },
  {
    name: "encoded javascript URL",
    svg: false,
    markup: '<a href="java&#x73;cript:window.__studioXss=1">click</a>',
  },
  {
    name: "embedded document",
    svg: false,
    markup:
      '<iframe srcdoc="<script>parent.__studioXss=1</script>"></iframe><object data="javascript:window.__studioXss=1"></object>',
  },
  {
    name: "namespace mutation",
    svg: false,
    markup:
      '<math><mtext><table><mglyph><style><!--</style><img title="--><img src=x onerror=window.__studioXss=1>">',
  },
  {
    name: "malformed SVG integration point",
    svg: false,
    markup:
      '<svg><foreignObject><p><img src=x onerror="window.__studioXss=1"></p></foreignObject></svg>',
  },
  {
    name: "DOM clobbering form",
    svg: false,
    markup:
      '<form id="host"><input name="__proto__"><input name="attributes"></form>',
  },
  {
    name: "SVG onload",
    svg: true,
    markup: '<svg onload="window.__studioXss=1"><circle r="4"/></svg>',
  },
  {
    name: "SVG external use",
    svg: true,
    markup:
      '<svg><use href="data:image/svg+xml,<svg onload=parent.__studioXss=1>"/></svg>',
  },
  {
    name: "SVG animation URL",
    svg: true,
    markup:
      '<svg><a href="#ok"><animate attributeName="href" values="javascript:window.__studioXss=1" dur=".01s"/></a></svg>',
  },
  {
    name: "SVG external paint",
    svg: true,
    markup:
      '<svg><path d="M0 0h10" fill="url(https://evil.example/paint)"/></svg>',
  },
]

for (const payload of payloads) {
  test(`rejects ${payload.name} in a browser DOM`, async ({ page }) => {
    const result = await page.evaluate(async (input) => {
      const host = document.querySelector("#host")!
      host.innerHTML = window.StudioSanitizer.sanitizeStudioMarkup(
        input.markup,
        input.svg
      )
      for (const link of host.querySelectorAll("a")) link.click()
      await new Promise((resolve) => setTimeout(resolve, 50))
      return {
        executed: window.__studioXss,
        forbidden: host.querySelectorAll(
          "script,iframe,object,embed,foreignObject,animate,form,input"
        ).length,
        handler: Array.from(host.querySelectorAll("*")).some((node) =>
          Array.from(node.attributes).some((attr) => /^on/i.test(attr.name))
        ),
        markup: host.innerHTML,
      }
    }, payload)
    expect(result.executed).toBeUndefined()
    expect(result.forbidden).toBe(0)
    expect(result.handler).toBe(false)
    expect(result.markup).not.toContain("https://evil.example")
  })
}

test("retains legitimate HTML and SVG drawings", async ({ page }) => {
  const result = await page.evaluate(() => {
    const sanitize = window.StudioSanitizer.sanitizeStudioMarkup
    const host = document.querySelector("#host")!
    host.innerHTML =
      sanitize("<h2>Headline</h2><p><strong>News</strong></p>") +
      sanitize(
        '<svg viewBox="0 0 24 24"><path d="M0 0h24" stroke="currentColor"/></svg>',
        true
      )
    return {
      heading: host.querySelector("h2")?.textContent,
      path: host.querySelector("path")?.getAttribute("d"),
      viewBox: host.querySelector("svg")?.getAttribute("viewBox"),
    }
  })
  expect(result).toEqual({
    heading: "Headline",
    path: "M0 0h24",
    viewBox: "0 0 24 24",
  })
})

test("sanitizes legacy Custom HTML/ad widget content before insertion", async ({
  page,
}) => {
  const result = await page.evaluate(async () => {
    const config = window.StudioSanitizer.sanitizeStudioWidgetConfig({
      content: '<img src=x onerror="window.__studioXss=1"><b>Sponsored</b>',
    })
    document.querySelector("#host")!.innerHTML = String(config.content)
    await new Promise((resolve) => setTimeout(resolve, 50))
    return {
      executed: window.__studioXss,
      text: document.querySelector("#host b")?.textContent,
    }
  })
  expect(result).toEqual({ executed: undefined, text: "Sponsored" })
})
