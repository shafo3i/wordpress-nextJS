import { db } from "@/db";
import { wpPosts, wpTerms, wpTermTaxonomy, user, wpComments } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function getToolsExportData() {
  const [categories, authors, postCountRes, pageCountRes, commentCountRes] =
    await Promise.all([
      db
        .select({
          termId: wpTerms.termId,
          name: wpTerms.name,
          slug: wpTerms.slug,
        })
        .from(wpTerms)
        .innerJoin(wpTermTaxonomy, eq(wpTerms.termId, wpTermTaxonomy.termId))
        .where(eq(wpTermTaxonomy.taxonomy, "category")),

      db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
        })
        .from(user),

      db
        .select({ count: sql<number>`count(*)::int` })
        .from(wpPosts)
        .where(eq(wpPosts.postType, "post")),

      db
        .select({ count: sql<number>`count(*)::int` })
        .from(wpPosts)
        .where(eq(wpPosts.postType, "page")),

      db
        .select({ count: sql<number>`count(*)::int` })
        .from(wpComments),
    ]);

  return {
    categories,
    authors,
    stats: {
      posts: postCountRes[0]?.count || 0,
      pages: pageCountRes[0]?.count || 0,
      comments: commentCountRes[0]?.count || 0,
      categories: categories.length,
    },
  };
}
