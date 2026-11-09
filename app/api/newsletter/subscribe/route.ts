import { getEmailLanguage } from "@/lib/email-language"
import { NextResponse } from "next/server"
import { addNewsletterSubscriber } from "@/lib/newsletter/db"
import { getPluginConfig } from "@/lib/plugins/config"
import { sendNewsletterWelcomeEmail } from "@/lib/email"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const language = await getEmailLanguage({
      locale: typeof body?.locale === "string" ? body.locale : undefined,
      request: req,
    })
    const email = typeof body?.email === "string" ? body.email.trim() : ""
    const name = typeof body?.name === "string" ? body.name.trim() : ""
    const source =
      typeof body?.source === "string" ? body.source.trim() : "website_form"

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        {
          success: false,
          error: language.dict["site.newsletter.invalid_email"],
        },
        { status: 400 }
      )
    }

    // Persist subscriber into the database
    const { success, alreadySubscribed } = await addNewsletterSubscriber(
      email,
      {
        name,
        source,
        locale: language.code,
      }
    )

    // Check plugin configuration for welcome email dispatch
    const pluginConfig = await getPluginConfig("newsletter")
    if (pluginConfig.sendWelcomeEmail !== false && !alreadySubscribed) {
      try {
        await sendNewsletterWelcomeEmail(email, name, language.code)
      } catch (mailErr) {
        console.warn(
          "Newsletter welcome email dispatch skipped or SMTP not configured:",
          mailErr
        )
      }
    }

    return NextResponse.json({
      success: true,
      alreadySubscribed,
      message: alreadySubscribed
        ? language.dict["site.newsletter.already_subscribed"]
        : language.dict["site.newsletter.success"],
    })
  } catch (error: unknown) {
    console.error("Newsletter subscription error:", error)
    return NextResponse.json(
      { success: false, error: "site.newsletter.error" },
      { status: 500 }
    )
  }
}
