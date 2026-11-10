import DOMPurify from "isomorphic-dompurify"

/** Plugin HTML is untrusted even when it originates in administrator settings. */
export function sanitizePluginMarkup(value: string): string {
  return DOMPurify.sanitize(value, {
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
}
