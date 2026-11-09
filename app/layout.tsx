import type { Metadata } from "next"
import { Geist_Mono, Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"
import { Toaster } from "@/components/ui/toast"
import { getSiteMetadata } from "@/services/settings.service"
import { getActiveFaviconUrl } from "@/lib/themes/customizer"
import TanStackProvider from "../components/providers/tanstack-provider"
import { headers, cookies } from "next/headers"
import { SiteAnalytics } from "@/components/site/site-analytics"
import { getPublicLanguageContext } from "@/lib/public-language"
import { getSeoSite } from "@/lib/seo/data"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export async function generateMetadata(): Promise<Metadata> {
  const [metadata, favicon] = await Promise.all([
    getSiteMetadata(),
    getActiveFaviconUrl(),
  ])
  return favicon ? { ...metadata, icons: { icon: favicon } } : metadata
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const [site, requestHeaders, cookieStore] = await Promise.all([
    getSeoSite(),
    headers(),
    cookies(),
  ])
  const hint = requestHeaders.get("x-cms-pathname")?.startsWith("/admincp")
    ? cookieStore.get("admin_lang")?.value
    : requestHeaders.get("x-cms-locale")
  const publicLanguage = await getPublicLanguageContext()
  const language =
    site.languages.find((language) => language.code === hint) ||
    site.languages.find((language) => language.code === site.defaultLocale)
  return (
    <html
      lang={
        requestHeaders.get("x-cms-pathname")?.startsWith("/admincp")
          ? language?.code || site.defaultLocale
          : publicLanguage.code
      }
      dir={
        requestHeaders.get("x-cms-pathname")?.startsWith("/admincp")
          ? language?.direction === "rtl"
            ? "rtl"
            : "ltr"
          : publicLanguage.direction
      }
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        inter.variable
      )}
    >
      <body>
        <ThemeProvider>
          <TanStackProvider>{children}</TanStackProvider>
        </ThemeProvider>
        <Toaster />
        {!/^\/(?:admincp|cms-login|cms-admin|forgot-password|password-reset|magic-link|email-otp|verify-email|email-verified|verify-2fa)(?:\/|$)/.test(
          requestHeaders.get("x-cms-pathname") || "/"
        ) && <SiteAnalytics measurementId={site.options.google_analytics_id} />}
      </body>
    </html>
  )
}
