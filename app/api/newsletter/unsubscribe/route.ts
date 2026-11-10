import { z } from "zod"
import { newsletterTokenSchema } from "@/db/schema/cms-newsletter"
import { validUnsubscribeToken } from "@/lib/newsletter/tokens"
import { unsubscribeNewsletterSubscriber } from "@/lib/newsletter/db"
import { newsletterTokenPage } from "@/lib/newsletter/token-page"
import { newsletterOriginAllowed } from "@/lib/newsletter/request"
export const dynamic = "force-dynamic"
export async function GET(request: Request) {
  return newsletterTokenPage(request, "site.newsletter.unsubscribe")
}
export async function POST(request: Request) {
  if (!newsletterOriginAllowed(request))
    return new Response(null, { status: 403 })
  const url = new URL(request.url),
    id = z.string().uuid().safeParse(url.searchParams.get("id")),
    token = newsletterTokenSchema.safeParse(url.searchParams.get("token"))
  if (
    !id.success ||
    !token.success ||
    !validUnsubscribeToken(id.data, token.data)
  )
    return newsletterTokenPage(
      request,
      "",
      "site.newsletter.invalid_token",
      400
    )
  try {
    await unsubscribeNewsletterSubscriber(id.data)
    return newsletterTokenPage(request, "", "site.newsletter.unsubscribed")
  } catch {
    return newsletterTokenPage(request, "", "site.newsletter.error", 503)
  }
}
