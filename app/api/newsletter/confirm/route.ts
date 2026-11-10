import { newsletterTokenSchema } from "@/db/schema/cms-newsletter"
import { confirmNewsletterSubscriber } from "@/lib/newsletter/db"
import { sendConfirmedNewsletterWelcome } from "@/lib/newsletter/email"
import { newsletterTokenPage } from "@/lib/newsletter/token-page"
import { newsletterOriginAllowed } from "@/lib/newsletter/request"
export const dynamic = "force-dynamic"
export async function GET(request: Request) {
  return newsletterTokenPage(request, "site.newsletter.confirm")
}
export async function POST(request: Request) {
  if (!newsletterOriginAllowed(request))
    return new Response(null, { status: 403 })
  const token = newsletterTokenSchema.safeParse(
    new URL(request.url).searchParams.get("token")
  )
  if (!token.success)
    return newsletterTokenPage(
      request,
      "",
      "site.newsletter.invalid_token",
      400
    )
  try {
    const subscriber = await confirmNewsletterSubscriber(token.data)
    if (!subscriber)
      return newsletterTokenPage(
        request,
        "",
        "site.newsletter.invalid_token",
        400
      )
    // Confirmation remains successful if SMTP is temporarily unavailable.
    await sendConfirmedNewsletterWelcome(subscriber).catch(() =>
      console.error("Newsletter welcome delivery failed")
    )
    return newsletterTokenPage(request, "", "site.newsletter.confirmed")
  } catch {
    return newsletterTokenPage(request, "", "site.newsletter.error", 503)
  }
}
