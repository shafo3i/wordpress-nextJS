import { notFound, redirect } from "next/navigation";
import { NewsHome, PageTemplate } from "@/components/site/news-patterns";
import { getPublishedPageBySlug, getPublishedPosts } from "@/lib/site-content";
import { getFrontEndThemeContext } from "@/lib/site-theme";
import { getHomepageSettings } from "@/lib/themes/homepage-blocks";
import { getAllWidgetAreas } from "@/lib/widgets/db";
import { getActiveLanguages, getDefaultLanguage, getPostTranslations } from "@/services/language.service";

export const dynamic = "force-dynamic";

export default async function LocalizedRootRoute({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  // Reserved top-level system paths to never match as a page or language
  const RESERVED_SLUGS = ["posts", "api", "feed", "admincp", "login", "register", "rss.xml", "sitemap.xml", "category"];
  if (RESERVED_SLUGS.includes(lang)) {
    notFound();
  }

  const [activeLanguages, defaultLang] = await Promise.all([
    getActiveLanguages().catch(() => []),
    getDefaultLanguage().catch(() => null),
  ]);

  const defaultLocale = defaultLang?.code || "en";
  const validLanguage = activeLanguages.find((l) => l.code === lang);

  // 1. If the segment matches an active language code (e.g. "/ar" or "/en")
  // If it's the default language, redirect to root "/"
  if (validLanguage) {
    if (lang === defaultLocale) {
      redirect("/");
    }

    const [posts, theme, settings, widgetAreas] = await Promise.all([
      getPublishedPosts(20, lang),
      getFrontEndThemeContext({ locale: lang, currentPath: `/${lang}` }),
      getHomepageSettings(),
      getAllWidgetAreas(),
    ]);

    const primarySidebar = widgetAreas.find((a) => a.id === "sidebar_primary")?.items || [];
    const secondarySidebar = widgetAreas.find((a) => a.id === "sidebar_secondary")?.items || [];
    const footerWidgets = {
      col1: widgetAreas.find((a) => a.id === "footer_1")?.items || [],
      col2: widgetAreas.find((a) => a.id === "footer_2")?.items || [],
      col3: widgetAreas.find((a) => a.id === "footer_3")?.items || [],
    };

    return (
      <NewsHome
        posts={posts}
        theme={theme}
        settings={settings}
        primarySidebar={primarySidebar}
        secondarySidebar={secondarySidebar}
        footerWidgets={footerWidgets}
      />
    );
  }

  // 2. If not a language code, check if it matches a published Page in default language (e.g. "/about", "/contact")
  const page = await getPublishedPageBySlug(lang, defaultLocale);
  if (!page) {
    notFound();
  }

  const [postTranslations, theme, relatedPosts, widgetAreas] = await Promise.all([
    getPostTranslations(page.id).catch(() => []),
    getFrontEndThemeContext({
      locale: defaultLocale,
      currentPath: `/${lang}`,
    }),
    getPublishedPosts(5, defaultLocale),
    getAllWidgetAreas(),
  ]);

  if (postTranslations.length > 0 && theme.languages) {
    theme.languages = theme.languages.map((l) => {
      const match = postTranslations.find((t) => t.languageCode === l.code);
      return {
        ...l,
        url: match
          ? (l.isDefault ? `/${match.slug}` : `/${l.code}/${match.slug}`)
          : (l.isDefault ? `/${lang}` : `/${l.code}/${lang}`),
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
      relatedPosts={relatedPosts.filter((post) => post.slug !== lang)}
      sidebarWidgets={primarySidebar}
      theme={theme}
      footerWidgets={footerWidgets}
    />
  );
}
