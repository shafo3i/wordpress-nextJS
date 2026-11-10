export async function readNewsletterBody(request: Request) {
  const reader = request.body?.getReader()
  if (!reader) throw new Error("invalid")
  const chunks: Uint8Array[] = []
  let size = 0
  while (true) {
    const result = await reader.read()
    if (result.done) break
    size += result.value.byteLength
    if (size > 4096) {
      await reader.cancel()
      throw new Error("too_large")
    }
    chunks.push(result.value)
  }
  return Buffer.concat(chunks).toString("utf8")
}
export function newsletterOriginAllowed(request: Request) {
  const origin = request.headers.get("origin")
  // Non-browser clients have no Origin; rate limits and email confirmation still apply.
  if (!origin) return true
  return [
    request.url,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.BETTER_AUTH_URL,
  ].some((value) => {
    try {
      return !!value && new URL(value).origin === origin
    } catch {
      return false
    }
  })
}
