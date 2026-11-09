import { cache } from "react"
import { cookies, headers } from "next/headers"
import {
  getActiveLanguages,
  getDefaultLanguage,
  getTranslations,
} from "@/services/language.service"
import { safeAuthRedirect } from "./auth-navigation"

export function resolvePublicLanguage<T extends { code: string }>(
  languages: T[],
  defaultCode: string,
  hints: unknown[]
) {
  for (const hint of hints) {
    const match =
      typeof hint === "string" &&
      languages.find((language) => language.code === hint)
    if (match) return match
  }
  return (
    languages.find((language) => language.code === defaultCode) || languages[0]
  )
}

export const getPublicLanguageContext = cache(
  async (explicit?: string, callback?: string) => {
    const [languages, defaultLanguage, requestHeaders, cookieStore] =
      await Promise.all([
        getActiveLanguages(),
        getDefaultLanguage(),
        headers(),
        cookies(),
      ])
    const defaultCode = defaultLanguage?.code || "en"
    const callbackPath = callback
      ? safeAuthRedirect(callback).split(/[?#]/)[0]
      : ""
    // An unprefixed public callback belongs to the default language. Admin callbacks do not.
    const callbackCode =
      callbackPath && !callbackPath.startsWith("/admincp")
        ? languages.find(
            (language) => callbackPath.split("/")[1] === language.code
          )?.code || defaultCode
        : undefined
    const path = requestHeaders.get("x-cms-pathname") || ""
    const authPath =
      /^\/(?:cms-login|cms-admin|forgot-password|password-reset|magic-link|email-otp|verify-email|email-verified|verify-2fa)(?:\/|$)/.test(
        path
      )
    const language =
      resolvePublicLanguage(languages, defaultCode, [
        explicit,
        requestHeaders.get("x-cms-locale"),
        callbackCode ||
          (requestHeaders.get("x-cms-callback-locale") === "default"
            ? defaultCode
            : requestHeaders.get("x-cms-callback-locale")),
        authPath ? undefined : defaultCode,
        cookieStore.get("site_lang")?.value,
      ]) || defaultLanguage
    const code = language?.code || defaultCode
    return {
      code,
      direction:
        language?.direction === "rtl" ? ("rtl" as const) : ("ltr" as const),
      defaultCode,
      languages,
      dict: await getTranslations(code),
    }
  }
)
