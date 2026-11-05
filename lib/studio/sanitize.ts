import DOMPurify from "isomorphic-dompurify"
import { getSafeStudioUrl } from "./urls"
import type { StudioDocumentData, StudioElement } from "./types"

const HTML_TAGS = [
  "p",
  "br",
  "strong",
  "em",
  "b",
  "i",
  "u",
  "s",
  "blockquote",
  "pre",
  "code",
  "ul",
  "ol",
  "li",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "div",
  "span",
  "a",
  "img",
  "figure",
  "figcaption",
  "table",
  "thead",
  "tbody",
  "tfoot",
  "tr",
  "th",
  "td",
  "hr",
  "dl",
  "dt",
  "dd",
  "sup",
  "sub",
]
const HTML_ATTRIBUTES = [
  "href",
  "src",
  "alt",
  "title",
  "class",
  "width",
  "height",
  "colspan",
  "rowspan",
  "scope",
  "loading",
]
const SVG_TAGS = [
  "svg",
  "g",
  "path",
  "circle",
  "ellipse",
  "rect",
  "line",
  "polyline",
  "polygon",
  "text",
  "tspan",
  "title",
  "desc",
  "defs",
  "linearGradient",
  "radialGradient",
  "stop",
  "clipPath",
]
const SVG_ATTRIBUTES = [
  "xmlns",
  "viewBox",
  "width",
  "height",
  "x",
  "y",
  "x1",
  "y1",
  "x2",
  "y2",
  "cx",
  "cy",
  "r",
  "rx",
  "ry",
  "d",
  "points",
  "fill",
  "fill-rule",
  "fill-opacity",
  "stroke",
  "stroke-width",
  "stroke-linecap",
  "stroke-linejoin",
  "stroke-opacity",
  "opacity",
  "transform",
  "id",
  "offset",
  "stop-color",
  "stop-opacity",
  "gradientUnits",
  "gradientTransform",
  "clip-path",
  "text-anchor",
  "font-size",
]

/** Restrictive authoring markup policy; arbitrary executable code is never a widget. */
export function sanitizeStudioMarkup(
  raw: string | undefined,
  svg = false
): string {
  if (
    !raw ||
    typeof raw !== "string" ||
    raw.length > 100_000 ||
    !DOMPurify.isSupported
  )
    return ""
  const fragment = DOMPurify.sanitize(raw, {
    ALLOWED_TAGS: svg ? SVG_TAGS : HTML_TAGS,
    ALLOWED_ATTR: svg ? SVG_ATTRIBUTES : HTML_ATTRIBUTES,
    ALLOW_DATA_ATTR: false,
    ALLOW_ARIA_ATTR: true,
    RETURN_DOM_FRAGMENT: true,
  })

  // These operations only remove attributes from DOMPurify's safe DOM.
  // Never concatenate or interpolate unsanitized strings into the result.
  for (const node of fragment.querySelectorAll("*")) {
    for (const attr of Array.from(node.attributes)) {
      if (
        svg &&
        ["fill", "stroke", "stop-color", "clip-path"].includes(attr.name) &&
        attr.value.includes("\\")
      )
        node.removeAttribute(attr.name)
      if (
        ["href", "src"].includes(attr.name) &&
        !getSafeStudioUrl(attr.value, attr.name === "src")
      ) {
        node.removeAttribute(attr.name)
      }
      // SVG paint servers may reference a local definition, never an external URL.
      if (
        /url\s*\(/i.test(attr.value) &&
        !/^url\(\s*#[a-zA-Z_][\w.-]*\s*\)$/.test(attr.value)
      ) {
        node.removeAttribute(attr.name)
      }
    }
  }
  const wrapper = fragment.ownerDocument.createElement("div")
  wrapper.append(fragment)
  return wrapper.innerHTML
}

/** Content passed to registered site widgets is still untrusted Studio data. */
export function sanitizeStudioWidgetConfig(
  config: Record<string, unknown> = {}
): Record<string, unknown> {
  const walk = (value: unknown, key: string, depth: number): unknown => {
    if (depth > 30) return null
    if (
      ["content", "html", "htmlCode", "code", "adCode", "svgCode"].includes(key)
    ) {
      return typeof value === "string"
        ? sanitizeStudioMarkup(value, key === "svgCode")
        : ""
    }
    if (typeof value === "string" && /(?:url|href|src)$/i.test(key))
      return getSafeStudioUrl(value, /(?:image|src)/i.test(key))
    if (Array.isArray(value))
      return value.map((item) => walk(item, "", depth + 1))
    if (value && typeof value === "object")
      return Object.fromEntries(
        Object.entries(value).map(([name, item]) => [
          name,
          walk(item, name, depth + 1),
        ])
      )
    return value
  }
  return walk(config, "", 0) as Record<string, unknown>
}

export function sanitizeStudioDocument(
  document: StudioDocumentData
): StudioDocumentData {
  const walk = (elements: StudioElement[]): StudioElement[] =>
    elements.map((element) => ({
      ...element,
      settings: {
        ...element.settings,
        ...(element.settings.htmlCode !== undefined
          ? { htmlCode: sanitizeStudioMarkup(element.settings.htmlCode) }
          : {}),
        ...(element.settings.svgCode !== undefined
          ? { svgCode: sanitizeStudioMarkup(element.settings.svgCode, true) }
          : {}),
        ...(element.settings.widgetConfig
          ? {
              widgetConfig: sanitizeStudioWidgetConfig(
                element.settings.widgetConfig
              ),
            }
          : {}),
      },
      elements: walk(element.elements),
    }))
  return { ...document, elements: walk(document.elements) }
}
