import { createRoot } from "react-dom/client"
import { ProfileClientView } from "../../app/(admin)/admincp/profile/_components/profile-client-view"
import en from "../../templates/language/en.json"
import ar from "../../templates/language/ar.json"
export function render(locale: "en" | "ar") {
  document.documentElement.lang = locale
  document.documentElement.dir = locale === "ar" ? "rtl" : "ltr"
  createRoot(document.getElementById("fixture")!).render(
    <ProfileClientView
      dict={locale === "ar" ? ar : en}
      direction={locale === "ar" ? "rtl" : "ltr"}
      initialUser={{
        id: "fixture-user",
        name: "<img src=x onerror=alert(1)>",
        email: "reader@example.test",
        image: "javascript:alert(1)",
        emailVerified: true,
        twoFactorEnabled: false,
        role: "admin",
        createdAt: "2026-11-01",
      }}
    />
  )
}
