import React from "react"
import { createRoot } from "react-dom/client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { LanguageTemplates } from "../../app/(admin)/admincp/languages/_components/language-templates"
import en from "../../templates/language/en.json"
import ar from "../../templates/language/ar.json"
export function render(locale: "en" | "ar") {
  createRoot(document.getElementById("fixture")!).render(<QueryClientProvider client={new QueryClient()}>
    <div dir={locale === "ar" ? "rtl" : "ltr"}><LanguageTemplates dict={locale === "ar" ? ar : en} templates={[
      { code: "en", name: "English", nativeName: "English", direction: "ltr" },
      { code: "ar", name: "Arabic", nativeName: "العربية", direction: "rtl" },
      { code: "fr", name: "French", nativeName: "Français", direction: "ltr" },
    ]} /></div>
  </QueryClientProvider>)
}
