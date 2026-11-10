import { sendEmail, getSmtpSettings } from "@/lib/email"
import { getEmailLanguage } from "@/lib/email-language"
import { localizedEmail, escapeEmailHtml } from "@/templates/localized-email"
import { getOptions } from "@/services/settings.service"
import { siteBaseUrl } from "@/lib/seo/urls"
import { localizedEmailTemplates } from "@/lib/email-template-settings"
import { getPluginConfig } from "@/lib/plugins/config"
import { unsubscribeToken } from "./tokens"

export async function newsletterPublicBase() {
  return siteBaseUrl(await getOptions(["home", "siteurl"]))
}
export async function sendNewsletterConfirmation(
  email: string,
  token: string,
  locale: string
) {
  const language = await getEmailLanguage({ locale })
  const url = new URL("/api/newsletter/confirm", await newsletterPublicBase())
  url.searchParams.set("token", token)
  url.searchParams.set("lang", language.code)
  const message = localizedEmail({
    kind: "newsletter-confirm",
    ...language,
    url: url.href,
  })
  return sendEmail({ to: email, ...message })
}
export async function sendConfirmedNewsletterWelcome(subscriber: {
  id: string
  email: string
  name: string | null
  locale: string | null
}) {
  const [config, settings, language] = await Promise.all([
    getPluginConfig("newsletter"),
    getSmtpSettings(),
    getEmailLanguage({ locale: subscriber.locale || undefined }),
  ])
  if (
    config.sendWelcomeEmail === false ||
    settings.enable_newsletter_notifications !== "1"
  )
    return
  const wording = localizedEmailTemplates(
    settings,
    language.code,
    language.defaultCode
  )
  const message = localizedEmail({
    kind: "welcome",
    ...language,
    name: subscriber.name || "",
    subject: wording.email_welcome_subject,
    heading: wording.email_welcome_heading,
    body: wording.email_welcome_body,
    footer: wording.email_footer_text,
  })
  const url = new URL(
    "/api/newsletter/unsubscribe",
    await newsletterPublicBase()
  )
  url.searchParams.set("id", subscriber.id)
  url.searchParams.set("token", unsubscribeToken(subscriber.id))
  url.searchParams.set("lang", language.code)
  message.html += `<p dir="${language.direction}"><a href="${escapeEmailHtml(url.href)}">${escapeEmailHtml(language.dict["site.newsletter.unsubscribe"])}</a></p>`
  message.text += `\n${language.dict["site.newsletter.unsubscribe"]}: ${url.href}`
  return sendEmail({ to: subscriber.email, ...message })
}
