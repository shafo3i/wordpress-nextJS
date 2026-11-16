import "server-only"
import { and, eq } from "drizzle-orm"
import { db } from "@/db"
import { wpTerms, wpTermTaxonomy } from "@/db/schema/cms-taxonomy"
import { widgetPostQuerySchema } from "@/db/schema/cms-appearance"
import { getPublishedPostsByCategory } from "@/lib/site-content"

export async function getWidgetCategoryPosts(input: unknown) {
  const query = widgetPostQuerySchema.parse(input)
  const [category] = await db.select({ slug: wpTerms.slug }).from(wpTerms)
    .innerJoin(wpTermTaxonomy, eq(wpTerms.termId, wpTermTaxonomy.termId))
    .where(and(eq(wpTermTaxonomy.termTaxonomyId, query.categoryId), eq(wpTermTaxonomy.taxonomy, "category"))).limit(1)
  if (!category) return []
  // Reuse the archive query's publication, password, date and locale restrictions.
  const result = await getPublishedPostsByCategory(category.slug, 1, query.limit, query.locale)
  return result.posts.map((post) => ({
    id: post.id, title: post.title, slug: post.slug, excerpt: post.excerpt,
    date: post.date.toISOString(), authorName: post.authorName,
    categories: post.categories, tags: post.tags, imageUrl: post.imageUrl,
    imageWidth: post.imageWidth, imageHeight: post.imageHeight, imageSrcSet: post.imageSrcSet,
    hasVideo: post.hasVideo, hasFeaturedImage: post.hasFeaturedImage,
    featuredVideoUrl: post.featuredVideoUrl, locale: query.locale || post.locale,
  }))
}
