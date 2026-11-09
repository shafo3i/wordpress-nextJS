export function articleShareLinks(url: string, title: string) {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return null
  }
  if (
    !["http:", "https:"].includes(parsed.protocol) ||
    parsed.username ||
    parsed.password
  )
    return null
  parsed.hash = ""
  const address = parsed.href
  return {
    facebook: `https://www.facebook.com/sharer/sharer.php?${new URLSearchParams({ u: address })}`,
    x: `https://twitter.com/intent/tweet?${new URLSearchParams({ url: address, text: title })}`,
    whatsapp: `https://wa.me/?${new URLSearchParams({ text: `${title} ${address}` })}`,
    telegram: `https://t.me/share/url?${new URLSearchParams({ url: address, text: title })}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?${new URLSearchParams({ url: address })}`,
    email: `mailto:?${new URLSearchParams({ subject: title.replace(/[\r\n]/g, " "), body: address })}`,
  }
}
