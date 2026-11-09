import { emailLayout } from "./email.templates"
import { absoluteWebUrl } from "@/lib/seo/urls"

export const escapeEmailHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`)
export function mailText(template: string, values: Record<string, string>) {
  return template.replace(/{{(\w+)}}/g, (match, key) => values[key] ?? match)
}

export type LocalizedEmailKind =
  "reset" | "verify" | "magic" | "otp" | "existing" | "welcome" | "test"
export function localizedEmail({
  kind,
  dict,
  direction,
  siteName,
  name = "",
  url,
  code,
  heading,
  body,
  subject,
  footer,
  ip = "",
  userAgent = "",
  secondaryUrl,
}: {
  kind: LocalizedEmailKind
  dict: Record<string, string>
  direction: "rtl" | "ltr"
  siteName: string
  name?: string
  url?: string
  code?: string
  heading?: string
  body?: string
  subject?: string
  footer?: string
  ip?: string
  userAgent?: string
  secondaryUrl?: string
}) {
  const values = {
    siteName,
    name: name || dict["mail.reader"],
    ip: ip || dict["mail.unknown"],
    userAgent: userAgent || dict["mail.unknown"],
    timestamp: new Date().toISOString(),
  }
  const plain = (template: string) => mailText(template, values)
  const html = (template: string) =>
    escapeEmailHtml(plain(template)).replace(/\r?\n/g, "<br>")
  const safeUrl = url ? absoluteWebUrl(url) : undefined
  const safeSecondaryUrl = secondaryUrl
    ? absoluteWebUrl(secondaryUrl)
    : undefined
  if (url && !safeUrl) throw new Error("Invalid transactional email URL")
  const content = `<h2 style="font-size:18px;margin:0 0 16px">${html(heading || dict[`mail.${kind}.heading`])}</h2>
    <p style="line-height:1.8">${html(body || dict[`mail.${kind}.body`])}</p>
    ${code ? `<p dir="ltr" style="font-size:28px;letter-spacing:6px;text-align:center">${escapeEmailHtml(code)}</p>` : ""}
    ${safeUrl ? `<p style="margin:24px 0"><a href="${escapeEmailHtml(safeUrl)}" style="background:#1d2327;color:#fff;padding:12px 24px;text-decoration:none">${html(dict[`mail.${kind}.action`])}</a></p><p dir="ltr" style="word-break:break-all">${escapeEmailHtml(safeUrl)}</p>` : ""}
    ${safeSecondaryUrl ? `<p><a href="${escapeEmailHtml(safeSecondaryUrl)}">${html(dict[`mail.${kind}.secondaryAction`])}</a></p>` : ""}
    <p style="font-size:12px;color:#6b7280">${html(dict[`mail.${kind}.note`] || "")}</p>`
  return {
    subject: plain(subject || dict[`mail.${kind}.subject`]).replace(
      /[\r\n]/g,
      " "
    ),
    html: emailLayout(content, escapeEmailHtml(siteName), {
      direction,
      footerNote: html(dict["mail.automated"]),
      copyrightText: html(footer || dict["mail.copyright"]).replaceAll(
        "{{year}}",
        String(new Date().getFullYear())
      ),
    }),
    text: `${plain(body || dict[`mail.${kind}.body`])}${code ? `\n${code}` : ""}${safeUrl ? `\n${safeUrl}` : ""}\n${plain(dict[`mail.${kind}.note`] || "")}`,
  }
}
