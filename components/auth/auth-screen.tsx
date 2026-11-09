import Link from "next/link"
import { getPublicLanguageContext } from "@/lib/public-language"
import { localizedSiteOptions } from "@/lib/site-identity"
import { headers } from "next/headers"
import { getSiteSeoOptions, getOptions } from "@/services/settings.service"
import { authFlowUrl, safeAuthRedirect } from "@/lib/auth-navigation"
import { LoginForm } from "./login-form"
import { RecoveryForm } from "./recovery-form"
import { TwoFactorForm } from "./two-factor-form"
import { MagicLinkVerifier } from "./magic-link-verifier"
import { SignupForm } from "./signup-form"

export type AuthMode =
  | "signup"
  | "login"
  | "forgot"
  | "reset"
  | "magic"
  | "emailOtp"
  | "verifyEmail"
  | "twoFactor"
  | "verified"
export type AuthSearch = {
  lang?: string | string[]
  token?: string | string[]
  error?: string | string[]
  callbackUrl?: string | string[]
  login?: string | string[]
}

export async function AuthScreen({
  mode,
  accountType = "user",
  search = {},
}: {
  mode: AuthMode
  accountType?: "admin" | "user"
  search?: AuthSearch
}) {
  const language = await getPublicLanguageContext(
    typeof search.lang === "string" ? search.lang : undefined,
    typeof search.callbackUrl === "string" ? search.callbackUrl : undefined
  )
  const { dict, direction, code, languages, defaultCode } = language
  const [options, membership, requestHeaders] = await Promise.all([
    getSiteSeoOptions(),
    getOptions(["users_can_register", "disableSignUp"]),
    headers(),
  ])
  const siteName = localizedSiteOptions(options, code, defaultCode).blogname
  const homeUrl = code === defaultCode ? "/" : `/${code}`
  const canRegister =
    membership.users_can_register !== "0" &&
    !["true", "1"].includes(membership.disableSignUp)
  const login =
    accountType === "admin" || search.login === "/cms-admin"
      ? "/cms-admin"
      : "/cms-login"
  const callbackUrl = safeAuthRedirect(
    search.callbackUrl,
    login === "/cms-admin" ? "/admincp" : homeUrl
  )
  const common = { dict, callbackUrl, login, locale: code }
  const token = typeof search.token === "string" ? search.token : undefined
  const invalidToken = mode === "reset" && (!token || Boolean(search.error))
  return (
    <main
      dir={direction === "rtl" ? "rtl" : "ltr"}
      lang={code}
      className="flex min-h-svh flex-col items-center justify-center bg-[#f0f0f1] px-4 py-8 text-[#2c3338]"
    >
      <Link
        href={homeUrl}
        className="mb-6 text-center text-xl font-bold text-[#1d2327]"
      >
        {siteName}
      </Link>
      <nav
        aria-label={dict["auth.language"]}
        className="mb-4 flex flex-wrap justify-center gap-3 text-sm text-[#2271b1]"
      >
        {languages.map((language) => {
          const languageCallback =
            callbackUrl === homeUrl
              ? language.code === defaultCode
                ? "/"
                : `/${language.code}`
              : callbackUrl
          const params = new URLSearchParams({
            lang: language.code,
            callbackUrl: languageCallback,
            login,
          })
          for (const key of ["token", "error"] as const)
            if (typeof search[key] === "string") params.set(key, search[key])
          const path = requestHeaders.get("x-cms-pathname") || login
          return (
            <Link
              key={language.code}
              href={`${path}?${params}`}
              hrefLang={language.code}
              lang={language.code}
              aria-current={language.code === code ? "page" : undefined}
            >
              {language.nativeName || language.name}
            </Link>
          )
        })}
      </nav>
      <section className="w-full max-w-sm rounded-[3px] border border-[#c3c4c7] bg-white p-6 shadow-sm [&_input[data-slot=input]]:rounded-[3px] [&_input[data-slot=input]]:border-[#8c8f94] [&_input[data-slot=input]]:bg-white [&_input[data-slot=input]]:px-3 [&_input[data-slot=input]]:text-[#2c3338] [&_input[data-slot=input]:focus-visible]:border-[#2271b1] [&_input[data-slot=input]:focus-visible]:ring-1 [&_input[data-slot=input]:focus-visible]:ring-[#2271b1]">
        <header className="mb-5 border-b border-[#dcdcde] pb-3">
          <h1 className="text-lg font-bold">
            {dict[`auth.${invalidToken ? "invalidToken" : mode}.title`]}
          </h1>
          <p className="mt-1 text-sm text-[#646970]">
            {dict[`auth.${invalidToken ? "invalidToken" : mode}.description`]}
          </p>
        </header>
        {mode === "login" && (
          <LoginForm
            accountType={accountType}
            redirectTo={callbackUrl}
            dict={dict}
            locale={code}
          />
        )}
        {mode === "signup" &&
          (canRegister ? (
            <SignupForm dict={dict} locale={code} callbackUrl={callbackUrl} />
          ) : (
            <p role="status">{dict["auth.registrationDisabled"]}</p>
          ))}
        {mode === "twoFactor" && <TwoFactorForm {...common} />}
        {mode === "magic" && token ? (
          <MagicLinkVerifier {...common} token={token} />
        ) : null}
        {(
          ["forgot", "reset", "magic", "emailOtp", "verifyEmail"] as AuthMode[]
        ).includes(mode) &&
          !invalidToken &&
          !(mode === "magic" && token) && (
            <RecoveryForm
              {...common}
              mode={
                mode as
                  "forgot" | "reset" | "magic" | "emailOtp" | "verifyEmail"
              }
              token={token}
            />
          )}
        {invalidToken && (
          <Link
            className="text-[#2271b1] underline"
            href={authFlowUrl("/forgot-password", callbackUrl, login, code)}
          >
            {dict["auth.forgot.title"]}
          </Link>
        )}
        {mode === "verified" && (
          <p role={search.error ? "alert" : "status"} className="text-sm">
            {
              dict[
                search.error
                  ? "auth.invalidToken.description"
                  : "auth.verified.notice"
              ]
            }
          </p>
        )}
        <nav className="mt-5 flex flex-wrap gap-x-4 gap-y-2 border-t border-[#dcdcde] pt-4 text-sm text-[#2271b1]">
          {mode === "login" ? (
            <>
              <Link
                href={authFlowUrl("/forgot-password", callbackUrl, login, code)}
              >
                {dict["auth.forgot.title"]}
              </Link>
              <Link href={authFlowUrl("/magic-link", callbackUrl, login, code)}>
                {dict["auth.magic.title"]}
              </Link>
              <Link href={authFlowUrl("/email-otp", callbackUrl, login, code)}>
                {dict["auth.emailOtp.title"]}
              </Link>
              <Link
                href={authFlowUrl("/verify-email", callbackUrl, login, code)}
              >
                {dict["auth.verifyEmail.title"]}
              </Link>
              {accountType === "user" && canRegister && (
                <Link
                  href={authFlowUrl(
                    "/cms-login/signup",
                    callbackUrl,
                    login,
                    code
                  )}
                >
                  {dict["auth.signup"]}
                </Link>
              )}
            </>
          ) : (
            <Link href={authFlowUrl(login, callbackUrl, login, code)}>
              {dict["auth.backLogin"]}
            </Link>
          )}
          <Link href={homeUrl}>{dict["auth.backSite"]}</Link>
        </nav>
      </section>
    </main>
  )
}
