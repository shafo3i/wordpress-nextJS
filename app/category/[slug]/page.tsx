import { notFound } from "next/navigation";
import { Metadata } from "next";
import { CategoryTemplate } from "@/components/site/news-patterns";
import { getPublishedPostsByCategory } from "@/lib/site-content";
import { getFrontEndThemeContext } from "@/lib/site-theme";
import { initActivePlugins } from "@/lib/plugins/loader";
import { getAllWidgetAreas } from "@/lib/widgets/db";
import { getTermTranslations } from "@/services/language.service";
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
  const [{ category }, siteNameOpt] = await Promise.all([
    getPublishedPostsByCategory(slug, 1, 1),
    db.select({ value: wpOptions.optionValue }).from(wpOptions).where(eq(wpOptions.optionName, "blogname")).limit(1),
  ]);

  const siteName = siteNameOpt[0]?.value || "PressForge News";

  if (!category) {
    return {
      title: `Category Not Found | ${siteName}`,
    };
  }

  return {
    title: `${category.name} | ${siteName}`,
    description: category.description || `Read the latest ${category.name} dispatches and investigative reporting.`,
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ page?: string; lang?: string }>;
}) {
  const { slug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const currentPage = Math.max(1, parseInt(resolvedSearchParams?.page || "1", 10) || 1);
  const lang = resolvedSearchParams?.lang;

  const [theme, widgetAreas, categoryResult] = await Promise.all([
    getFrontEndThemeContext({
      locale: lang,
      currentPath: `/category/${slug}`,
    }),
    getAllWidgetAreas(),
    getPublishedPostsByCategory(slug, currentPage, 9, lang),
  ]);

  if (!categoryResult.category) {
    notFound();
  }

  // Find linked category translations for language switcher
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
