import { notFound } from "next/navigation";
import { Metadata } from "next";
import { PostTemplate } from "@/components/site/news-patterns";
import { getPublishedPostBySlug, getPublishedPosts } from "@/lib/site-content";
import { getFrontEndThemeContext } from "@/lib/site-theme";
import { initActivePlugins } from "@/lib/plugins/loader";
import { applyFilters } from "@/lib/plugins/hooks";
import { getAllWidgetAreas } from "@/lib/widgets/db";

import { db } from "@/db";
import { wpOptions } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [article, siteNameOpt, ogSiteOpt, ogImgOpt] = await Promise.all([
    getPublishedPostBySlug(slug),
    db.select({ value: wpOptions.optionValue }).from(wpOptions).where(eq(wpOptions.optionName, "blogname")).limit(1),
    db.select({ value: wpOptions.optionValue }).from(wpOptions).where(eq(wpOptions.optionName, "og_site_name")).limit(1),
    db.select({ value: wpOptions.optionValue }).from(wpOptions).where(eq(wpOptions.optionName, "og_default_image")).limit(1),
  ]);

  const siteName = ogSiteOpt[0]?.value || siteNameOpt[0]?.value || "PressForge News";

  if (!article) {
    return {
      title: `Post Not Found | ${siteName}`,
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const postImage = article.imageUrl || ogImgOpt[0]?.value || `${siteUrl}/posts/${slug}/opengraph-image`;

  return {
    title: `${article.title} | ${siteName}`,
    description: article.excerpt || article.title,
    openGraph: {
      siteName,
      title: article.title,
      description: article.excerpt || article.title,
      type: "article",
      publishedTime: article.date.toISOString(),
      authors: [article.authorName],
      tags: [...article.categories, ...article.tags],
      images: [
        {
          url: postImage,
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.excerpt || article.title,
      images: [postImage],
    },
  };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const [article, theme, relatedPosts, widgetAreas] = await Promise.all([
    getPublishedPostBySlug(slug),
    getFrontEndThemeContext(),
    getPublishedPosts(4),
    getAllWidgetAreas(),
  ]);

  if (!article) {
    notFound();
  }

  // Initialize active plugins registered in wp_options
  await initActivePlugins();

  // Apply the_content filters registered by active plugins (e.g. reading time, newsletter)
  const filteredContent = await applyFilters("the_content", article.content, { article });

  const sidebarWidgets = widgetAreas.find((a) => a.id === "sidebar_primary")?.items || [];
  const footerWidgets = {
    col1: widgetAreas.find((a) => a.id === "footer_1")?.items || [],
    col2: widgetAreas.find((a) => a.id === "footer_2")?.items || [],
    col3: widgetAreas.find((a) => a.id === "footer_3")?.items || [],
  };

  return (
    <PostTemplate
      article={{ ...article, content: filteredContent }}
      relatedPosts={relatedPosts.filter((post) => post.slug !== slug)}
      theme={theme}
      sidebarWidgets={sidebarWidgets}
      footerWidgets={footerWidgets}
    />
  );
}
