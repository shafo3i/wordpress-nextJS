import { articleMetadata } from "@/lib/seo/article";
import { ArticleStructuredData } from "@/components/site/article-structured-data";
import { notFound, redirect } from "next/navigation";
import { renderPostMedia } from "@/lib/post-content-media";
import { Metadata } from "next";
import { PostTemplate } from "@/components/site/news-patterns";
import { getPublishedPostBySlug, getPublishedPosts } from "@/lib/site-content";
import { getFrontEndThemeContext } from "@/lib/site-theme";
import { initActivePlugins } from "@/lib/plugins/loader";
import { applyFilters } from "@/lib/plugins/hooks";
import { getAllWidgetAreas } from "@/lib/widgets/db";
import { getActiveLanguages, getPostTranslations } from "@/services/language.service";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ lang: string; slug: string }> }): Promise<Metadata> {
  const values = await params;
  return articleMetadata(values.slug, values.lang);
}

export default async function LocalizedPostPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;

  // Validate active language
  const activeLanguages = await getActiveLanguages().catch(() => []);
  const validLanguage = activeLanguages.find((l) => l.code === lang);
  if (!validLanguage) {
    notFound();
  }

  const article = await getPublishedPostBySlug(slug, lang);
  if (!article) {
    notFound();
  }

  const [postTranslations, theme, relatedPosts, widgetAreas] = await Promise.all([
    getPostTranslations(article.id).catch(() => []),
    getFrontEndThemeContext({
      locale: lang,
      currentPath: `/${lang}/posts/${slug}`,
    }),
    getPublishedPosts(4, lang),
    getAllWidgetAreas(),
  ]);

  if (lang === theme.defaultLocale) {
    redirect(`/posts/${slug}`);
  }

  // Re-link theme translations if postTranslations exists
  if (postTranslations.length > 0 && theme.languages) {
    theme.languages = theme.languages.map((l) => {
      const match = postTranslations.find((t) => t.languageCode === l.code);
      return {
        ...l,
        url: match ? (l.isDefault ? `/posts/${match.slug}` : `/${l.code}/posts/${match.slug}`) : (l.isDefault ? `/posts/${slug}` : `/${l.code}/posts/${slug}`),
      };
    });
  }

  await initActivePlugins();
  const filteredContent = await applyFilters("the_content", renderPostMedia(article.content), { article, theme });

  const sidebarWidgets = widgetAreas.find((a) => a.id === "sidebar_primary")?.items || [];
  const footerWidgets = {
    col1: widgetAreas.find((a) => a.id === "footer_1")?.items || [],
    col2: widgetAreas.find((a) => a.id === "footer_2")?.items || [],
    col3: widgetAreas.find((a) => a.id === "footer_3")?.items || [],
    col4: widgetAreas.find((a) => a.id === "footer_4")?.items || [],
  };

  return (
    <>
    <ArticleStructuredData article={article} />
    <PostTemplate
      article={{ ...article, content: filteredContent }}
      relatedPosts={relatedPosts.filter((post) => post.slug !== slug)}
      theme={theme}
      sidebarWidgets={sidebarWidgets}
      footerWidgets={footerWidgets}
    />
    </>
  );
}
