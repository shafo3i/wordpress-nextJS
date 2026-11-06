import { createHmac, randomBytes, timingSafeEqual } from "node:crypto"

export const VIEW_WINDOW_MS = 30 * 60 * 1000
export const VIEW_COOKIE = "pressforge_visitor"
export function viewHash(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("hex")
}
export function visitorToken(secret: string, supplied?: string) {
  if (supplied && /^[a-f0-9]{32}\.[a-f0-9]{64}$/.test(supplied)) {
    const [id, signature] = supplied.split(".")
    const expected = viewHash(`visitor:${id}`, secret)
    if (
      timingSafeEqual(
        Buffer.from(signature, "hex"),
        Buffer.from(expected, "hex")
      )
    )
      return { token: supplied, id, fresh: false }
  }
  const id = randomBytes(16).toString("hex")
  return {
    id,
    token: `${id}.${viewHash(`visitor:${id}`, secret)}`,
    fresh: true,
  }
}
export function isAutomatedVisitor(userAgent: string) {
  return (
    !userAgent ||
    /bot\b|crawler|spider|headless|preview|facebookexternalhit|slurp/i.test(
      userAgent
    )
  )
}
