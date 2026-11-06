import DOMPurify from "isomorphic-dompurify"

const origins = new Set(["jubrakanews.com", "www.jubrakanews.com"])
export function rewriteWordPressUrl(
  raw: string,
  slugs: Set<string>,
  ids: Map<string, string>
): string {
  let url: URL
  try {
    url = new URL(raw, "https://jubrakanews.com")
  } catch {
    return raw
  }
  if (!origins.has(url.hostname)) return raw
  if (url.pathname.includes("/wp-content/uploads/"))
    return (
      "/uploads/" + url.pathname.split("/wp-content/uploads/")[1] + url.search
    )
  const id = url.searchParams.get("p")
  if (id && ids.has(id)) return `/ar/posts/${encodeURIComponent(ids.get(id)!)}`
  let slug = ""
  try {
    slug = decodeURIComponent(
      url.pathname.split("/").filter(Boolean).at(-1) || ""
    )
  } catch {
    return raw
  }
  return slugs.has(slug) ? `/ar/posts/${encodeURIComponent(slug)}` : raw
}

export function importArticleHtml(
  raw: string,
  rewrite: (url: string) => string
): string {
  if (!raw) return ""
  const converted = raw
    .replace(
      /\[caption\b[^\]]*\]([\s\S]*?)\[\/caption\]/gi,
      "<figure>$1</figure>"
    )
    .replace(/\[\/?(?:embed|gallery)\b[^\]]*\]/gi, "")
  const fragment = DOMPurify.sanitize(converted, {
    ALLOWED_TAGS: [
      "p",
      "br",
      "div",
      "span",
      "a",
      "img",
      "picture",
      "source",
      "video",
      "audio",
      "figure",
      "figcaption",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "ul",
      "ol",
      "li",
      "blockquote",
      "strong",
      "b",
      "em",
      "i",
      "u",
      "s",
      "small",
      "pre",
      "code",
      "table",
      "thead",
      "tbody",
      "tfoot",
      "tr",
      "th",
      "td",
      "hr",
      "del",
      "ins",
      "sup",
      "sub",
      "dl",
      "dt",
      "dd",
      "iframe",
    ],
    ALLOWED_ATTR: [
      "href",
      "src",
      "srcset",
      "alt",
      "title",
      "class",
      "id",
      "width",
      "height",
      "colspan",
      "rowspan",
      "scope",
      "controls",
      "allowfullscreen",
      "loading",
      "poster",
      "preload",
      "type",
      "datetime",
    ],
    ALLOW_DATA_ATTR: false,
    RETURN_DOM_FRAGMENT: true,
  })
  for (const node of fragment.querySelectorAll("*")) {
    for (const attribute of ["href", "src", "poster"])
      if (node.hasAttribute(attribute))
        node.setAttribute(attribute, rewrite(node.getAttribute(attribute)!))
    if (node.hasAttribute("srcset"))
      node.setAttribute(
        "srcset",
        node
          .getAttribute("srcset")!
          .split(",")
          .map((value) => {
            const [url, ...descriptor] = value.trim().split(/\s+/)
            return [rewrite(url), ...descriptor].join(" ")
          })
          .join(", ")
      )
    if (node.tagName === "IFRAME") {
      try {
        const url = new URL(node.getAttribute("src") || "")
        if (
          url.protocol !== "https:" ||
          ![
            "www.youtube.com",
            "youtube.com",
            "www.youtube-nocookie.com",
            "player.vimeo.com",
          ].includes(url.hostname)
        )
          throw new Error("Unapproved embed")
        node.setAttribute(
          "sandbox",
          "allow-scripts allow-same-origin allow-presentation"
        )
        node.setAttribute("referrerpolicy", "strict-origin-when-cross-origin")
      } catch {
        node.remove()
      }
    }
  }
  const wrapper = fragment.ownerDocument.createElement("div")
  wrapper.append(fragment)
  return wrapper.innerHTML
}
