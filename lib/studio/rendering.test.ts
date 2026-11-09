import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import { StudioDesignViewport } from "@/components/site/studio/studio-design"
import { StudioRenderer } from "@/components/site/studio/studio-renderer"
import type { FrontEndThemeContext } from "@/lib/site-theme"
import { createStudioElement } from "./tree-helpers"
import type { StudioElement } from "./types"
import {
  getStudioElementContentRequest,
  studioContentRequestKey,
} from "./content"

const mocks = vi.hoisted(() => ({ sidebar: vi.fn() }))

vi.mock("@/components/site/blocks/registry", () => ({
  renderEditorialBlock: () => null,
}))
vi.mock("@/components/site/sidebar/sidebar-renderer", () => ({
  SidebarWidgetRenderer: (props: unknown) => {
    mocks.sidebar(props)
    return null
  },
}))

function render(
  element: StudioElement,
  isEditor = false,
  device?: "mobile" | "tablet" | "desktop"
) {
  const request = getStudioElementContentRequest(element, "en")
  return renderToStaticMarkup(
    createElement(StudioDesignViewport, {
      device,
      children: createElement(StudioRenderer, {
        elements: [element],
        posts: [],
        theme: { locale: "en", defaultLocale: "en" } as FrontEndThemeContext,
        pageLocale: "en",
        widgetContent: request
          ? {
              requests: {
                [studioContentRequestKey(request)]: {
                  items: [],
                  total: 0,
                  page: 1,
                  pageSize: request.pageSize,
                  locale: request.locale,
                  direction: "ltr",
                  category: null,
                  categoryMissing: false,
                },
              },
            }
          : undefined,
        isEditor,
        dict: { "admin.studio.placeholder.heading": "Add a heading" },
      }),
    })
  )
}

describe("Studio public rendering", () => {
  it.each([
    ["hideOnMobile", "mobile", "max-md:hidden"],
    ["hideOnTablet", "tablet", "md:max-lg:hidden"],
    ["hideOnDesktop", "desktop", "lg:hidden"],
  ] as const)(
    "applies %s publicly and keeps hidden preview elements editable",
    (setting, device, css) => {
      for (const type of ["heading", "container"] as const) {
        const element = createStudioElement(type)
        element.settings[setting] = true
        expect(render(element)).toContain(css)
        const preview = render(element, true, device)
        expect(preview).not.toContain(css)
        expect(preview).toContain("opacity-30")
        expect(preview).toContain(`data-studio-element="${element.id}"`)
        const otherDevice = device === "mobile" ? "desktop" : "mobile"
        expect(render(element, true, otherDevice)).not.toContain("opacity-30")
      }
    }
  )

  it.each(["widget_custom_html", "widget_plugin_ad"] as const)(
    "sanitizes the legacy registered widget adapter: %s",
    (type) => {
      const element = createStudioElement(type)
      element.settings.widgetConfig = {
        content: '<p>Ad</p><img src=x onerror="bad()"><script>bad()</script>',
      }
      render(element)
      const props = mocks.sidebar.mock.lastCall![0]
      expect(props.item.content).toContain("<p>Ad</p>")
      expect(props.item.content).not.toContain("onerror")
      expect(props.item.content).not.toContain("<script>")
    }
  )

  it("escapes HTML-like placeholder translations in the editor", () => {
    const markup = renderToStaticMarkup(
      createElement(StudioRenderer, {
        elements: [createStudioElement("html")],
        posts: [],
        theme: {} as FrontEndThemeContext,
        isEditor: true,
        dict: {
          "admin.studio.placeholder.html": '<img src=x onerror="bad()">',
        },
      })
    )
    expect(markup).not.toContain("<img")
    expect(markup).toContain("&lt;img")
  })
  it("shows placeholders only in the editor", () => {
    const element = createStudioElement("heading")
    expect(render(element)).not.toContain("Add a heading")
    expect(render(element, true)).toContain("Add a heading")
  })

  it.each(["image", "video", "google_maps", "soundcloud"] as const)(
    "does not publish demo media for an empty %s widget",
    (type) => {
      const markup = render(createStudioElement(type))
      expect(markup).not.toContain("<img")
      expect(markup).not.toContain("<iframe")
      expect(markup).not.toContain("unsplash")
      expect(markup).not.toContain("dQw4w9WgXcQ")
    }
  )

  it("renders saved content with HTML escaping", () => {
    const element = createStudioElement("heading")
    element.settings.text = '<script>alert("test")</script>'
    expect(render(element)).toContain("&lt;script&gt;")
    expect(render(element)).not.toContain("<script>")
  })

  it("blocks unsafe links from legacy documents at render time", () => {
    const element = createStudioElement("button")
    element.settings.buttonUrl = "javascript:alert(1)"
    expect(render(element)).not.toContain("javascript:")
    expect(render(element)).toContain('href="#"')
  })

  it("does not render unknown widget types as raw HTML", () => {
    const element = createStudioElement("html")
    element.widgetType = "widget_unknown"
    element.settings.htmlCode = '<b id="unexpected">unsafe fallback</b>'
    expect(render(element)).not.toContain("unexpected")
  })

  it("sanitizes raw HTML in legacy published and preview documents", () => {
    const element = createStudioElement("html")
    element.settings.htmlCode =
      '<p>Safe</p><img src=x onerror="alert(1)"><script>alert(1)</script>'
    for (const preview of [false, true]) {
      const markup = render(element, preview)
      expect(markup).toContain("<p>Safe</p>")
      expect(markup).not.toContain("onerror")
      expect(markup).not.toContain("<script>")
    }
  })

  it("does not trust legacy heading tag names", () => {
    const element = createStudioElement("heading")
    element.settings.htmlTag = "script" as typeof element.settings.htmlTag
    element.settings.text = "window.bad = true"
    expect(render(element)).not.toContain("<script>")
    expect(render(element)).toContain("<h2")
  })
})
