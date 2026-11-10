import { createRoot } from "react-dom/client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MediaAttachmentDetails } from "../../components/admin/media-attachment-details"
import { MetaBoxFeaturedImage } from "../../components/admin/posts/editor/meta-box-featured-image"
import en from "../../templates/language/en.json"
import ar from "../../templates/language/ar.json"
import type { MediaItem } from "../../services/media.service"
export function render(locale: "en" | "ar", item: MediaItem) {
  document.documentElement.lang = locale
  createRoot(document.getElementById("fixture")!).render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <MetaBoxFeaturedImage
        featuredImageId={String(item.id)}
        dict={locale === "ar" ? ar : en}
        onChange={() => {}}
      />
      <MediaAttachmentDetails
        item={item}
        dict={locale === "ar" ? ar : en}
        onUpdated={() => {}}
      />
    </QueryClientProvider>
  )
}
