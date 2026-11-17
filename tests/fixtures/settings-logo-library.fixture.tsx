import { createRoot } from "react-dom/client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import {
  SettingsLogo,
  useSettingsLogo,
} from "../../app/(admin)/admincp/settings/_components/settings-logo"
import en from "../../templates/language/en.json"
import ar from "../../templates/language/ar.json"
function Logo({ locale, target }: { locale: "en" | "ar"; target: "header" | "footer" }) {
  const controller = useSettingsLogo("", undefined, target)
  return (
    <SettingsLogo controller={controller} dict={locale === "ar" ? ar : en} />
  )
}
export function render(locale: "en" | "ar", target: "header" | "footer" = "header") {
  document.documentElement.lang = locale
  document.documentElement.dir = locale === "ar" ? "rtl" : "ltr"
  createRoot(document.getElementById("fixture")!).render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <Logo locale={locale} target={target} />
    </QueryClientProvider>
  )
}
