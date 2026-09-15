import { notFound } from "next/navigation";
import { Metadata } from "next";
import { PostTemplate } from "@/components/site/news-patterns";
import { getPublishedPostBySlug, getPublishedPosts } from "@/lib/site-content";
import { getFrontEndThemeContext } from "@/lib/site-theme";
import { initActivePlugins } from "@/lib/plugins/loader";
import { applyFilters } from "@/lib/plugins/hooks";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublishedPostBySlug(slug);

  if (!article) {
    return {
      title: "Post Not Found | Signal News",
    };
  }

  return {
    title: `${article.title} | Signal News`,
    description: article.excerpt || article.title,
    openGraph: {
      title: article.title,
      description: article.excerpt || article.title,
      type: "article",
      publishedTime: article.date.toISOString(),
      authors: [article.authorName],
      tags: [...article.categories, ...article.tags],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.excerpt || article.title,
    },
  };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const [article, theme, relatedPosts] = await Promise.all([
    getPublishedPostBySlug(slug),
    getFrontEndThemeContext(),
    getPublishedPosts(4),
  ]);

  if (!article) {
    notFound();
  }

  // Initialize active plugins registered in wp_options
  await initActivePlugins();

  // Apply the_content filters registered by active plugins (e.g. reading time, newsletter)
  const filteredContent = await applyFilters("the_content", article.content, { article });

  return (
    <PostTemplate
      article={{ ...article, content: filteredContent }}
      relatedPosts={relatedPosts.filter((post) => post.slug !== slug)}
      theme={theme}
    />
  );
}
