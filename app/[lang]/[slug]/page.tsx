import { notFound, redirect } from "next/navigation";
import { PageTemplate } from "@/components/site/news-patterns";
import { getPublishedPageBySlug, getPublishedPosts } from "@/lib/site-content";
import { getFrontEndThemeContext } from "@/lib/site-theme";
import { getAllWidgetAreas } from "@/lib/widgets/db";
import { getActiveLanguages, getPostTranslations } from "@/services/language.service";

export const dynamic = "force-dynamic";

export default async function LocalizedStaticPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;

  // Reserved top-level system paths to never match as a CMS page
  const RESERVED_SLUGS = ["posts", "api", "feed", "admincp", "login", "register", "rss.xml", "sitemap.xml"];
  if (RESERVED_SLUGS.includes(slug)) {
    notFound();
  }

  // Validate active language
  const activeLanguages = await getActiveLanguages().catch(() => []);
  const validLanguage = activeLanguages.find((l) => l.code === lang);
  if (!validLanguage) {
    notFound();
  }

  const page = await getPublishedPageBySlug(slug, lang);
  if (!page) {
    notFound();
  }

  const [postTranslations, theme, relatedPosts, widgetAreas] = await Promise.all([
    getPostTranslations(page.id).catch(() => []),
    getFrontEndThemeContext({
      locale: lang,
      currentPath: `/${lang}/${slug}`,
    }),
    getPublishedPosts(5, lang),
    getAllWidgetAreas(),
  ]);

  if (lang === theme.defaultLocale) {
    redirect(`/${slug}`);
  }

  if (postTranslations.length > 0 && theme.languages) {
    theme.languages = theme.languages.map((l) => {
      const match = postTranslations.find((t) => t.languageCode === l.code);
      return {
        ...l,
        url: match ? (l.isDefault ? `/${match.slug}` : `/${l.code}/${match.slug}`) : (l.isDefault ? `/${slug}` : `/${l.code}/${slug}`),
      };
    });
  }

  const primarySidebar = widgetAreas.find((a) => a.id === "sidebar_primary")?.items || [];
  const footerWidgets = {
    col1: widgetAreas.find((a) => a.id === "footer_1")?.items || [],
    col2: widgetAreas.find((a) => a.id === "footer_2")?.items || [],
    col3: widgetAreas.find((a) => a.id === "footer_3")?.items || [],
  };

  return (
    <PageTemplate
      page={page}
      relatedPosts={relatedPosts.filter((post) => post.slug !== slug)}
      sidebarWidgets={primarySidebar}
      theme={theme}
      footerWidgets={footerWidgets}
    />
  );
}
