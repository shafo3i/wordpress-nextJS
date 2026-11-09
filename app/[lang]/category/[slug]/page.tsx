import { categoryMetadata } from "@/lib/seo/category";
import { notFound, redirect } from "next/navigation";
import { Metadata } from "next";
import { getArchiveSettings } from "@/lib/customizer/archive";
import { CategoryTemplate } from "@/components/site/news-patterns";
import { getPublishedPostsByCategory } from "@/lib/site-content";
import { getFrontEndThemeContext } from "@/lib/site-theme";
import { initActivePlugins } from "@/lib/plugins/loader";
import { getAllWidgetAreas } from "@/lib/widgets/db";
import { getActiveLanguages, getTermTranslations } from "@/services/language.service";

export const dynamic = "force-dynamic";

export async function generateMetadata({params}:{params:Promise<{lang:string;slug:string}>}):Promise<Metadata> {
  const values=await params;
  return categoryMetadata(values.slug,values.lang);
}

export default async function LocalizedCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string; slug: string }>;
  searchParams?: Promise<{ page?: string }>;
}) {
  const { lang, slug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const currentPage = Math.max(1, parseInt(resolvedSearchParams?.page || "1", 10) || 1);

  // Validate active language
  const activeLanguages = await getActiveLanguages().catch(() => []);
  const validLanguage = activeLanguages.find((l) => l.code === lang);
  if (!validLanguage) {
    notFound();
  }

  const [theme, widgetAreas] = await Promise.all([
    getFrontEndThemeContext({
      locale: lang,
      currentPath: `/${lang}/category/${slug}`,
    }),
    getAllWidgetAreas(),
  ]);
  const categoryResult = await getPublishedPostsByCategory(slug, currentPage, getArchiveSettings(theme.mods).archivePostsPerPage, lang);

  if (lang === theme.defaultLocale) {
    redirect(`/category/${slug}${currentPage > 1 ? `?page=${currentPage}` : ""}`);
  }

  if (!categoryResult.category) {
    notFound();
  }

  // Find linked category translations for the language switcher
  const termTranslations = await getTermTranslations(BigInt(categoryResult.category.termTaxonomyId)).catch(() => []);
  if (termTranslations.length > 0 && theme.languages) {
    theme.languages = theme.languages.map((l) => {
      const match = termTranslations.find((t) => t.languageCode === l.code);
      return {
        ...l,
        url: match
          ? (l.isDefault ? `/category/${match.slug}` : `/${l.code}/category/${match.slug}`)
          : (l.isDefault ? `/category/${slug}` : `/${l.code}/category/${slug}`),
      };
    });
  }

  await initActivePlugins();

  const categoryWidgets = widgetAreas.find((a) => a.id === "sidebar_category")?.items || [];
  const sidebarWidgets = widgetAreas.find((a) => a.id === "sidebar_primary")?.items || [];
  const footerWidgets = {
    col1: widgetAreas.find((a) => a.id === "footer_1")?.items || [],
    col2: widgetAreas.find((a) => a.id === "footer_2")?.items || [],
    col3: widgetAreas.find((a) => a.id === "footer_3")?.items || [],
    col4: widgetAreas.find((a) => a.id === "footer_4")?.items || [],
  };

  return (
    <CategoryTemplate
      category={categoryResult.category}
      posts={categoryResult.posts}
      totalPosts={categoryResult.total}
      totalPages={categoryResult.totalPages}
      currentPage={categoryResult.currentPage}
      theme={theme}
      categoryWidgets={categoryWidgets}
      sidebarWidgets={sidebarWidgets}
      footerWidgets={footerWidgets}
    />
  );
}