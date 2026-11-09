export type EmailTemplateFields = Partial<
  Record<
    | "email_welcome_subject"
    | "email_welcome_heading"
    | "email_welcome_body"
    | "email_footer_text",
    string
  >
>
export function parseEmailTemplates(
  value?: string
): Record<string, EmailTemplateFields> {
  try {
    const parsed = JSON.parse(value || "{}")
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      return {}
    return Object.fromEntries(
      Object.entries(parsed)
        .filter(
          ([code, entry]) =>
            /^[a-z]{2,3}(?:-[a-z0-9]{2,8}){0,2}$/i.test(code) &&
            entry &&
            typeof entry === "object" &&
            !Array.isArray(entry)
        )
        .map(([code, entry]) => [
          code,
          Object.fromEntries(
            Object.entries(entry as Record<string, unknown>).filter(
              ([key, value]) =>
                [
                  "email_welcome_subject",
                  "email_welcome_heading",
                  "email_welcome_body",
                  "email_footer_text",
                ].includes(key) && typeof value === "string"
            )
          ),
        ])
    )
  } catch {
    return {}
  }
}

export function localizedEmailTemplates(
  settings: Record<string, string>,
  locale: string,
  defaultLocale: string
): EmailTemplateFields {
  const translated = parseEmailTemplates(settings.email_template_translations)[
    locale
  ]
  // Never insert default-language authored copy into a different-language message.
  return translated || (locale === defaultLocale ? settings : {})
}
