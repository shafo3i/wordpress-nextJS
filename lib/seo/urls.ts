export function absoluteWebUrl(
  value: string | undefined | null,
  base?: string
): string | undefined {
  if (!value || /[\u0000-\u0020\\]/.test(value) || value.startsWith("//"))
    return undefined
  try {
    const url = new URL(value, base)
    if (
      !["https:", "http:"].includes(url.protocol) ||
      url.username ||
      url.password
    )
      return undefined
    return url.href
  } catch {
    return undefined
  }
}

export function siteBaseUrl(
  options: Record<string, string>,
  environment = process.env
): string {
  for (const value of [
    environment.NEXT_PUBLIC_SITE_URL,
    environment.NEXT_PUBLIC_APP_URL,
    options.home,
    options.siteurl,
  ]) {
    const url = absoluteWebUrl(value)
    if (url) return url.replace(/\/$/, "")
  }
  throw new Error("Configure a valid public site URL")
}

export function encodeSlug(value: string): string {
  try {
    return encodeURIComponent(decodeURIComponent(value))
  } catch {
    return encodeURIComponent(value)
  }
}

export function contentUrl(
  base: string,
  type: string,
  slug: string,
  locale: string,
  defaultLocale: string
): string {
  const prefix =
    locale === defaultLocale ? "" : `/${encodeURIComponent(locale)}`
  const path =
    type === "post" ? "/posts" : type === "category" ? "/category" : ""
  return `${base}${prefix}${path}/${encodeSlug(slug)}`
}

/** Attachment migration is resolved separately; authored external URLs stay intact. */
export function mediaUrl(value: string, base?: string): string | undefined {
  return absoluteWebUrl(value, base)
}

export function escapeXml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
      })[char]!
  )
}

export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029")
}

export function publicationLanguage(locale: string): string {
  const code = locale.toLowerCase().replace(/_/g, "-")
  if (/^zh-(?:cn|sg|hans)(?:-|$)/.test(code)) return "zh-cn"
  if (/^zh-(?:tw|hk|mo|hant)(?:-|$)/.test(code)) return "zh-tw"
  const language = code.split("-")[0]
  if (!/^[a-z]{2,3}$/.test(language))
    throw new Error("Configure a valid publication language code")
  return language
}
