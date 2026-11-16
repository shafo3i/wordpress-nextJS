import React, { useState } from "react"
import { createRoot } from "react-dom/client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { RecentPostsAdminForm, RecentPostsRender } from "../../widgets/recent-posts"
import { RelatedPostsAdminForm, RelatedPostsRender } from "../../widgets/related-posts"
import { WidgetsManagerShell } from "../../app/(admin)/admincp/widgets/_components/widgets-manager-shell"
import type { WidgetItem } from "../../widgets/types"
import type { ContentItem } from "../../lib/site-content"
import type { FrontEndThemeContext } from "../../lib/site-theme"
import en from "../../templates/language/en.json"
import ar from "../../templates/language/ar.json"

export function render(locale: "en" | "ar") {
  const dict = locale === "ar" ? ar : en
  const categories = [{ id: "11", name: "Business", languageCode: "en" }, { id: "12", name: "Science", languageCode: "en" }, { id: "22", name: "الأعمال", languageCode: "ar" }, { id: "23", name: "العلوم", languageCode: "ar" }]
  function Fixture() {
    const [client] = useState(() => new QueryClient())
    const [recent, setRecent] = useState<WidgetItem>({ id: "recent", type: "recent_posts", title: "Recent", count: 5, locale, config: { categoryFilter: "Old text filter" } })
    const [related, setRelated] = useState<WidgetItem>({ id: "related", type: "plugin_related_posts", title: "Related", locale, config: { count: 5 } })
    const theme = { locale, defaultLocale: locale, direction: locale === "ar" ? "rtl" : "ltr", dict } as unknown as FrontEndThemeContext
    const pagePosts = [{ id: "99", title: "Unrelated page post", slug: "unrelated", locale, categories: ["Other"], tags: [], imageUrl: "", date: new Date("2026-11-16"), authorName: "Writer", excerpt: "", content: "" }] as ContentItem[]
    theme.breakingPosts = pagePosts
    return <QueryClientProvider client={client}><div dir={theme.direction}>
      <WidgetsManagerShell initialAreas={[{ id: "footer_4", title: "", description: "", items: [] }]} availableWidgets={[]} dict={dict} direction={theme.direction} />
      <RecentPostsAdminForm item={recent} categories={categories} dict={dict} onChange={(patch) => setRecent((item) => ({ ...item, ...patch }))} />
      <RelatedPostsAdminForm item={related} categories={categories} dict={dict} direction={theme.direction} onChange={(patch) => setRelated((item) => ({ ...item, ...patch }))} />
      <RecentPostsRender item={recent} posts={pagePosts} theme={theme} />
      <RelatedPostsRender item={related} posts={pagePosts} theme={theme} />
      <output id="widget-config">{JSON.stringify([recent.config, related.config])}</output>
    </div></QueryClientProvider>
  }
  createRoot(document.getElementById("fixture")!).render(<Fixture />)
}
