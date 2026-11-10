import { createHash, createHmac, timingSafeEqual } from "node:crypto"
export const newsletterTokenHash = (token: string) =>
  createHash("sha256").update(token).digest("hex")
export function unsubscribeToken(
  id: string,
  secret = process.env.BETTER_AUTH_SECRET
) {
  if (!secret) throw new Error("Newsletter signing secret is required")
  return createHmac("sha256", secret)
    .update(`newsletter-unsubscribe:${id}`)
    .digest("base64url")
}
export function validUnsubscribeToken(
  id: string,
  token: string,
  secret?: string
) {
  const expected = Buffer.from(unsubscribeToken(id, secret))
  const supplied = Buffer.from(token)
  return (
    supplied.length === expected.length && timingSafeEqual(supplied, expected)
  )
}
