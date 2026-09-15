import { notFound } from "next/navigation";
import { PageTemplate } from "@/components/site/news-patterns";
import { getPublishedPageBySlug, getPublishedPosts } from "@/lib/site-content";
import { getFrontEndThemeContext } from "@/lib/site-theme";

export const dynamic = "force-dynamic";

export default async function DynamicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  if (slug === "posts") {
    notFound();
  }

  const [page, theme, relatedPosts] = await Promise.all([
    getPublishedPageBySlug(slug),
    getFrontEndThemeContext(),
    getPublishedPosts(5),
  ]);

  if (!page) {
    notFound();
  }

  return (
    <PageTemplate
      page={page}
      relatedPosts={relatedPosts.filter((post) => post.slug !== slug)}
      theme={theme}
    />
  );
}
