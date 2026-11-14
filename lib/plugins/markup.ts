import { safeMediaUrl } from "@/lib/post-media"
import DOMPurify from "isomorphic-dompurify"

/** Plugin HTML is untrusted even when it originates in administrator settings. */
export function sanitizePluginMarkup(value: string): string {
  const fragment = DOMPurify.sanitize(value, {
    RETURN_DOM_FRAGMENT: true,
    ALLOWED_TAGS: [
      "div",
      "span",
      "p",
      "a",
      "img",
      "strong",
      "em",
      "br",
      "ul",
      "ol",
      "li",
      "h2",
      "h3",
      "h4",
      "time",
      "details",
      "summary",
      "audio",
      "source",
    ],
    ALLOWED_ATTR: [
      "class",
      "href",
      "src",
      "alt",
      "title",
      "target",
      "rel",
      "id",
      "datetime",
      "controls",
      "preload",
      "type",
    ],
    ALLOW_DATA_ATTR: false,
  })
  for (const element of fragment.querySelectorAll("[href], [src]")) {
    for (const attr of ["href", "src"]) {
      const raw = element.getAttribute(attr)
      if (raw === null) continue
      const safe =
        attr === "href" && /^#[^\u0000-\u0020]*$/.test(raw)
          ? raw
          : safeMediaUrl(raw)
      if (safe) element.setAttribute(attr, safe)
      else element.removeAttribute(attr)
    }
    if (element.tagName === "A" && element.getAttribute("target") === "_blank")
      element.setAttribute("rel", "sponsored noopener noreferrer")
  }
  const container = fragment.ownerDocument.createElement("div")
  container.append(fragment)
  return container.innerHTML
}
