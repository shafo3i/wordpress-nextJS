import type { ContentItem } from "@/lib/site-content"
import { getSeoSite } from "@/lib/seo/data"
import { newsArticleSchema } from "@/lib/seo/article"
import { serializeJsonLd } from "@/lib/seo/urls"
import { headers } from "next/headers"

export async function ArticleStructuredData({
  article,
}: {
  article: ContentItem
}) {
  const [site, requestHeaders] = await Promise.all([getSeoSite(), headers()])
  const schema = newsArticleSchema(article, site)
  return schema ? (
    <script
      type="application/ld+json"
      nonce={requestHeaders.get("x-nonce") || undefined}
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }}
    />
  ) : null
}
