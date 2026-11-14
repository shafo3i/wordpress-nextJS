import { contentPlainText } from "@/lib/content-text"
import { getArticleNewsletter } from "@/lib/newsletter/presentation"
import { getPostTranslations } from "@/services/language.service"
import { articleMetadata } from "@/lib/seo/article"
import { ArticleStructuredData } from "@/components/site/article-structured-data"
import { notFound } from "next/navigation"
import { Metadata } from "next"
import { PostTemplate } from "@/components/site/news-patterns"
import { getPublishedPostBySlug, getPublishedPosts } from "@/lib/site-content"
import { getFrontEndThemeContext } from "@/lib/site-theme"
import { initActivePlugins } from "@/lib/plugins/loader"

import { getAllWidgetAreas } from "@/lib/widgets/db"

export const dynamic = "force-dynamic"

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams?: Promise<{ lang?: string }>
}): Promise<Metadata> {
  const values = await params
  return articleMetadata(values.slug, (await searchParams)?.lang)
}

export default async function PostPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams?: Promise<{ lang?: string }>
}) {
  const { slug } = await params
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const lang = resolvedSearchParams?.lang

  const article = await getPublishedPostBySlug(slug, lang)
  if (!article) {
    notFound()
  }

  // Derive the effective locale directly from the post's language in the database
  const effectiveLocale = lang || article.locale

  const [postTranslations, theme, relatedPosts, widgetAreas] =
    await Promise.all([
      getPostTranslations(article.id).catch(() => []),
      getFrontEndThemeContext({
        locale: effectiveLocale,
        currentPath: `/posts/${slug}`,
      }),
      getPublishedPosts(4, effectiveLocale),
      getAllWidgetAreas(),
    ])

  // Re-link theme translations if postTranslations exists
  if (postTranslations.length > 0 && theme.languages) {
    theme.languages = theme.languages.map((l) => {
      const match = postTranslations.find((t) => t.languageCode === l.code)
      return {
        ...l,
        url: match
          ? l.isDefault
            ? `/posts/${match.slug}`
            : `/${l.code}/posts/${match.slug}`
          : l.isDefault
            ? `/posts/${slug}`
            : `/${l.code}/posts/${slug}`,
      }
    })
  }

  // Initialize active plugins registered in wp_options
  const plugins = await initActivePlugins()
  const newsletter = await getArticleNewsletter(
    theme.locale || theme.defaultLocale || "en"
  )

  // Apply the_content filters registered by active plugins (e.g. reading time, newsletter)
  const filteredContent = await plugins.applyFilters(
    "the_content",
    article.content,
    { article, theme }
  )

  const sidebarWidgets =
    widgetAreas.find((a) => a.id === "sidebar_primary")?.items || []
  const footerWidgets = {
    col1: widgetAreas.find((a) => a.id === "footer_1")?.items || [],
    col2: widgetAreas.find((a) => a.id === "footer_2")?.items || [],
    col3: widgetAreas.find((a) => a.id === "footer_3")?.items || [],
    col4: widgetAreas.find((a) => a.id === "footer_4")?.items || [],
  }

  return (
    <>
      <ArticleStructuredData article={article} />
      <PostTemplate
        readingWordCount={
          contentPlainText(article.content).split(/\s+/).filter(Boolean).length
        }
        newsletter={newsletter}
        article={{ ...article, content: filteredContent }}
        relatedPosts={relatedPosts.filter((post) => post.slug !== slug)}
        theme={theme}
        sidebarWidgets={sidebarWidgets}
        footerWidgets={footerWidgets}
      />
    </>
  )
}
