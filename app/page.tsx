import { NewsHome } from "@/components/site/news-patterns";
import { getPublishedPosts } from "@/lib/site-content";
import { getFrontEndThemeContext } from "@/lib/site-theme";
import { getHomepageSettings } from "@/lib/themes/homepage-blocks";
import { getAllWidgetAreas } from "@/lib/widgets/db";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [posts, theme, settings, widgetAreas] = await Promise.all([
    getPublishedPosts(20),
    getFrontEndThemeContext(),
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
