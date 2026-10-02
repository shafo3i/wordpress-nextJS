import { notFound, redirect } from "next/navigation";
import { Metadata } from "next";
import { PostTemplate } from "@/components/site/news-patterns";
import { getPublishedPostBySlug, getPublishedPosts } from "@/lib/site-content";
import { getFrontEndThemeContext } from "@/lib/site-theme";
import { initActivePlugins } from "@/lib/plugins/loader";
import { applyFilters } from "@/lib/plugins/hooks";
import { getAllWidgetAreas } from "@/lib/widgets/db";
import { getActiveLanguages, getPostTranslations } from "@/services/language.service";
import { db } from "@/db";
import { wpOptions } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  const [article, siteNameOpt] = await Promise.all([
    getPublishedPostBySlug(slug, lang),
    db.select({ value: wpOptions.optionValue }).from(wpOptions).where(eq(wpOptions.optionName, "blogname")).limit(1),
  ]);

  const siteName = siteNameOpt[0]?.value || "PressForge News";

  if (!article) {
    return {
      title: `Post Not Found | ${siteName}`,
    };
  }

  return {
    title: `${article.title} | ${siteName}`,
    description: article.excerpt || article.title,
  };
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
