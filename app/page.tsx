import { PublicAdminBar } from "@/components/site/admin/public-admin-bar";
import { homepageMetadata } from "@/lib/seo/article";
import { resolveStudioPageContent } from '@/services/studio-content.service';
import { NewsHome, PageTemplate } from "@/components/site/news-patterns";
import { getPublishedPageById, getPublishedPosts } from "@/lib/site-content";
import { getFrontEndThemeContext } from "@/lib/site-theme";
import { getHomepageSettings } from "@/lib/themes/homepage-blocks";
import { getAllWidgetAreas } from "@/lib/widgets/db";
import { getOptions } from "@/services/settings.service";

export const dynamic = "force-dynamic";
export async function generateMetadata({searchParams}:{searchParams?:Promise<{lang?:string}>}) {
  return homepageMetadata((await searchParams)?.lang);
}

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<{ lang?: string }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const lang = resolvedSearchParams?.lang;

  const [posts, theme, settings, widgetAreas, frontOptions] = await Promise.all([
    getPublishedPosts(20, lang),
    getFrontEndThemeContext({ locale: lang, currentPath: "/" }),
    getHomepageSettings(),
    getAllWidgetAreas(),
    getOptions(["show_on_front", "page_on_front"]),
  ]);

  const primarySidebar = widgetAreas.find((a) => a.id === "sidebar_primary")?.items || [];
  const secondarySidebar = widgetAreas.find((a) => a.id === "sidebar_secondary")?.items || [];
  const footerWidgets = {
    col1: widgetAreas.find((a) => a.id === "footer_1")?.items || [],
    col2: widgetAreas.find((a) => a.id === "footer_2")?.items || [],
    col3: widgetAreas.find((a) => a.id === "footer_3")?.items || [],
    col4: widgetAreas.find((a) => a.id === "footer_4")?.items || [],
  };

  if (frontOptions.show_on_front === "page" && frontOptions.page_on_front) {
    const frontPage = await getPublishedPageById(frontOptions.page_on_front, theme.locale);
    if (frontPage) {
      return (
        <PublicAdminBar pageId={frontPage.id} siteTitle={theme.siteTitle}>
        <PageTemplate
          page={await resolveStudioPageContent(frontPage, theme.locale || frontPage.locale || "")}
          relatedPosts={posts}
          sidebarWidgets={primarySidebar}
          theme={theme}
          footerWidgets={footerWidgets}
        />
      </PublicAdminBar>
      );
    }
  }

  return (
    <PublicAdminBar siteTitle={theme.siteTitle}>
    <NewsHome
      posts={posts}
      theme={theme}
      settings={settings}
      primarySidebar={primarySidebar}
      secondarySidebar={secondarySidebar}
      footerWidgets={footerWidgets}
    />
      </PublicAdminBar>
  );
}
