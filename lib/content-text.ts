import DOMPurify from "isomorphic-dompurify"

/** Decode WordPress HTML entities without rendering imported markup. */
export function contentPlainText(value: string): string {
  let text = value.replace(/\[\/?caption\b[^\]]*\]/gi, "")
  if (!/[<&]/.test(text)) return text.replace(/\s+/g, " ").trim()
  for (let pass = 0; pass < 2; pass++) {
    text =
      DOMPurify.sanitize(
        text.replace(/<\/(?:p|div|li|h[1-6])\s*>|<br\s*\/?\s*>/gi, " "),
        { RETURN_DOM_FRAGMENT: true }
      ).textContent || ""
    if (!/&(?:#\d+|#x[\da-f]+|[a-z]+);/i.test(text)) break
  }
  return text.replace(/\s+/g, " ").trim()
}
