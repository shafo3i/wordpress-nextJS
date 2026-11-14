import { after } from "next/server"
import { getEmailLanguage } from "@/lib/email-language"
import {
  addNewsletterSubscriber,
  newsletterRequestAllowed,
} from "@/lib/newsletter/db"
import { sendNewsletterConfirmation } from "@/lib/newsletter/email"
import { newsletterSubscribeSchema } from "@/db/schema/cms-newsletter"
import {
  readNewsletterBody,
  newsletterOriginAllowed,
} from "@/lib/newsletter/request"
import { getActivePluginSlugs } from "@/services/plugin.service"
export const dynamic = "force-dynamic"
const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } })
export async function POST(request: Request) {
  if (!newsletterOriginAllowed(request))
    return json({ success: false, error: "site.newsletter.error" }, 403)
  try {
    const input = newsletterSubscribeSchema.safeParse(
      JSON.parse(await readNewsletterBody(request))
    )
    if (!input.success)
      return json(
        { success: false, error: "site.newsletter.invalid_email" },
        400
      )
    if (input.data.website)
      return json({ success: true, messageKey: "site.newsletter.check_email" })
    if (!(await getActivePluginSlugs()).includes("newsletter"))
      return json({ success: false, error: "site.newsletter.disabled" }, 403)
    if (!(await newsletterRequestAllowed()))
      return json(
        { success: false, error: "site.newsletter.rate_limited" },
        429
      )
    const language = await getEmailLanguage({
      locale: input.data.locale,
      request,
    })
    const result = await addNewsletterSubscriber(input.data.email, {
      name: input.data.name,
      source: input.data.source,
      locale: language.code,
    })
    if (result.confirmationToken) {
      const token = result.confirmationToken
      after(async () => {
        const sent = await sendNewsletterConfirmation(
          input.data.email,
          token,
          language.code
        ).catch(() => ({ success: false }))
        if (!sent.success)
          console.error(
            "Newsletter confirmation delivery failed; pending subscriber may retry after cooldown"
          )
      })
    }
    // Same response for active, pending and unknown addresses: do not expose membership.
    return json({
      success: true,
      message: language.dict["site.newsletter.check_email"],
      messageKey: "site.newsletter.check_email",
    })
  } catch (error) {
    if (error instanceof SyntaxError)
      return json(
        { success: false, error: "site.newsletter.invalid_email" },
        400
      )
    if (error instanceof Error && error.message === "too_large")
      return json({ success: false, error: "site.newsletter.error" }, 413)
    console.error("Newsletter request failed")
    return json({ success: false, error: "site.newsletter.error" }, 503)
  }
}
