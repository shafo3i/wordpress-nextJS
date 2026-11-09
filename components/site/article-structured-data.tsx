import type { ContentItem } from "@/lib/site-content"
import { getSeoSite } from "@/lib/seo/data"
import { newsArticleSchema } from "@/lib/seo/article"
import { serializeJsonLd } from "@/lib/seo/urls"

export async function ArticleStructuredData({
  article,
}: {
  article: ContentItem
}) {
  const schema = newsArticleSchema(article, await getSeoSite())
  return schema ? (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }}
    />
  ) : null
}
