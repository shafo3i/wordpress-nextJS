import { sendEmail } from "@/lib/email"
import { getOption } from "@/services/settings.service"
import {
  getDefaultLanguage,
  getTranslations,
} from "@/services/language.service"
import {
  passwordResetTemplate,
  verifyEmailTemplate,
  magicLinkTemplate,
  emailOtpTemplate,
} from "@/templates/email.templates"

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`)

export async function sendAuthEmail(
  kind: "reset" | "verify" | "magic" | "otp",
  email: string,
  value: string,
  name = "",
  otpType = ""
) {
  const [language, siteName] = await Promise.all([
    getDefaultLanguage(),
    getOption("blogname", ""),
  ])
  const dict = await getTranslations(language?.code || "en")
  const direction = language?.direction === "rtl" ? "rtl" : "ltr"
  const options = {
    direction,
    heading: dict[`auth.mail.${kind}`],
    buttonText: dict["auth.mail.continue"],
  } as const
  const html =
    kind === "reset"
      ? passwordResetTemplate(
          escapeHtml(name),
          escapeHtml(value),
          escapeHtml(siteName),
          options
        )
      : kind === "verify"
        ? verifyEmailTemplate(
            escapeHtml(name),
            escapeHtml(value),
            escapeHtml(siteName),
            options
          )
        : kind === "magic"
          ? magicLinkTemplate(escapeHtml(value), escapeHtml(siteName), options)
          : emailOtpTemplate(value, otpType, escapeHtml(siteName), options)
  const result = await sendEmail({
    to: email,
    subject: `${dict[`auth.mail.${kind}`]} - ${siteName}`,
    html,
    text: `${dict[`auth.mail.${kind}`]}: ${value}`,
  })
  if (!result.success) throw new Error("Authentication email delivery failed")
}
