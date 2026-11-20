import { createRoot } from "react-dom/client"
import { AdminSignOut } from "../../components/admin/admin-sign-out"
import en from "../../templates/language/en.json"
import ar from "../../templates/language/ar.json"

export function render(locale: "en" | "ar") {
  createRoot(document.getElementById("fixture")!).render(<AdminSignOut dict={locale === "ar" ? ar : en} />)
}
