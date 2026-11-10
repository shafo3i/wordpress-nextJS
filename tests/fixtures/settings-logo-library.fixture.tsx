import { createRoot } from "react-dom/client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import {
  SettingsLogo,
  useSettingsLogo,
} from "../../app/(admin)/admincp/settings/_components/settings-logo"
import en from "../../templates/language/en.json"
import ar from "../../templates/language/ar.json"
function Logo({ locale }: { locale: "en" | "ar" }) {
  const controller = useSettingsLogo("")
  return (
    <SettingsLogo controller={controller} dict={locale === "ar" ? ar : en} />
  )
}
export function render(locale: "en" | "ar") {
  document.documentElement.lang = locale
  document.documentElement.dir = locale === "ar" ? "rtl" : "ltr"
  createRoot(document.getElementById("fixture")!).render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <Logo locale={locale} />
    </QueryClientProvider>
  )
}
