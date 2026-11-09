import { sendEmail } from "@/lib/email"
import { getEmailLanguage, type EmailLanguageHint } from "@/lib/email-language"
import { localizedEmail } from "@/templates/localized-email"

export async function sendAuthEmail(
  kind: "reset" | "verify" | "magic" | "otp" | "existing",
  email: string,
  value: string,
  name = "",
  _otpType = "",
  hint: EmailLanguageHint = {}
) {
  const language = await getEmailLanguage({
    ...hint,
    url: hint.url || (kind === "otp" ? undefined : value),
  })
  let url: string | undefined
  if (kind !== "otp") {
    const link = new URL(value)
    link.searchParams.set("lang", language.code)
    url = link.href
  }
  const requestHeaders = hint.request?.headers || hint.headers
  const secondary =
    kind === "existing" ? new URL("/forgot-password", url) : undefined
  secondary?.searchParams.set("lang", language.code)
  const message = localizedEmail({
    kind,
    ...language,
    name,
    url,
    code: kind === "otp" ? value : undefined,
    ip:
      requestHeaders?.get("cf-connecting-ip") ||
      requestHeaders?.get("x-forwarded-for")?.split(",")[0]?.trim(),
    userAgent: requestHeaders?.get("user-agent") || undefined,
    secondaryUrl: secondary?.href,
  })
  const result = await sendEmail({ to: email, ...message })
  if (!result.success) throw new Error("Authentication email delivery failed")
}
