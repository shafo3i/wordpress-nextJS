import { notFound } from "next/navigation";
import { PageTemplate } from "@/components/site/news-patterns";
import { getPublishedPageBySlug, getPublishedPosts } from "@/lib/site-content";
import { getFrontEndThemeContext } from "@/lib/site-theme";
import { getAllWidgetAreas } from "@/lib/widgets/db";

export const dynamic = "force-dynamic";

export default async function DynamicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  if (slug === "posts") {
    notFound();
  }

  const [page, theme, relatedPosts, widgetAreas] = await Promise.all([
    getPublishedPageBySlug(slug),
    getFrontEndThemeContext(),
    getPublishedPosts(5),
    getAllWidgetAreas(),
  ]);

  if (!page) {
    notFound();
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
