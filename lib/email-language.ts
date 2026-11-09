import {
  getActiveLanguages,
  getDefaultLanguage,
  getTranslations,
} from "@/services/language.service"
import { localizedSiteOptions } from "./site-identity"
import { getOptions } from "@/services/settings.service"

export type EmailLanguageHint = {
  locale?: string
  request?: Request | null
  headers?: Headers
  url?: string
}

export function emailLocaleHints(
  hint: EmailLanguageHint
): (string | undefined)[] {
  const headers = hint.request?.headers || hint.headers
  const cookie = headers
    ?.get("cookie")
    ?.split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith("site_lang="))
    ?.slice(10)
  let linkLocale: string | undefined
  try {
    let url = new URL(hint.url || "", "https://email.invalid")
    linkLocale = url.searchParams.get("lang") || undefined
    // Auth callback URLs carry the language chosen on reset/verification screens.
    for (const key of ["callbackURL", "callbackUrl", "redirectTo"]) {
      const callback = url.searchParams.get(key)
      if (!linkLocale && callback) {
        url = new URL(callback, "https://email.invalid")
        linkLocale = url.searchParams.get("lang") || url.pathname.split("/")[1]
      }
    }
  } catch {
    /* Invalid/unavailable hints fall back to an active language. */
  }
  return [
    hint.locale,
    headers?.get("x-site-locale") || undefined,
    linkLocale,
    cookie,
  ]
}

export async function getEmailLanguage(hint: EmailLanguageHint = {}) {
  const [languages, defaultLanguage, options] = await Promise.all([
    getActiveLanguages(),
    getDefaultLanguage(),
    getOptions(["blogname", "blogdescription", "site_identity_translations"]),
  ])
  const language =
    emailLocaleHints(hint)
      .map((code) => languages.find((language) => language.code === code))
      .find(Boolean) ||
    defaultLanguage ||
    languages[0]
  const code = language?.code || "en"
  return {
    code,
    defaultCode: defaultLanguage?.code || "en",
    direction:
      language?.direction === "rtl" ? ("rtl" as const) : ("ltr" as const),
    siteName: localizedSiteOptions(options, code, defaultLanguage?.code || "en")
      .blogname,
    dict: await getTranslations(code),
  }
}
