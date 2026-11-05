/** Shared save/render policy for widget URLs, including legacy saved documents. */
export function getSafeStudioUrl(value?: string, media = false): string {
  if (!value || /[\u0000-\u001f\u007f]/.test(value)) return ""
  const trimmed = value.trim()
  try {
    const url = new URL(trimmed, "https://studio.invalid")
    const allowed = media
      ? ["http:", "https:"]
      : ["http:", "https:", "mailto:", "tel:"]
    return allowed.includes(url.protocol) ? trimmed : ""
  } catch {
    return ""
  }
}
