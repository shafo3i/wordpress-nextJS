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

  return (
    <NewsHome
      posts={posts}
      theme={theme}
      settings={settings}
      primarySidebar={primarySidebar}
      secondarySidebar={secondarySidebar}
    />
  );
}
