import { createRoot } from "react-dom/client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"
import { SettingsMediaStorage } from "../../app/(admin)/admincp/settings/_components/settings-media-storage"
import { MediaUploadDestination } from "../../components/admin/media-upload-destination"
import { MediaSelectModal } from "../../components/admin/media-select-modal"
import en from "../../templates/language/en.json"
import ar from "../../templates/language/ar.json"
function Fixture({ locale }: { locale: "en" | "ar" }) {
  const [destination, setDestination] = useState<"local" | "s3">("local")
  const dict = locale === "ar" ? ar : en
  return <div dir={locale === "ar" ? "rtl" : "ltr"}>
    <SettingsMediaStorage initialSettings={{ enabled: false, endpoint: "", region: "", bucket: "", prefix: "media", publicBaseUrl: "", credentialsConfigured: false }} dict={dict} />
    <MediaUploadDestination value={destination} onChange={setDestination} dict={dict} />
    <MediaSelectModal isOpen onClose={() => {}} onSelect={() => {}} dict={dict} mediaType="all" />
    <span id="destination">{destination}</span>
  </div>
}
export function mount(locale: "en" | "ar") { createRoot(document.getElementById("fixture")!).render(<QueryClientProvider client={new QueryClient()}><Fixture locale={locale} /></QueryClientProvider>) }
