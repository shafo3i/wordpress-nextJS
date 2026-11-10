import { getPublishedPostBySlug } from "@/lib/site-content"
import { getSiteSeoOptions } from "@/services/settings.service"
import { getPublicLanguageContext } from "@/lib/public-language"
import { localizedSiteOptions } from "@/lib/site-identity"
import { renderSocialImage, socialImageResponse } from "@/lib/seo/social-image"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"
export const runtime = "nodejs"
export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const [post, options, language] = await Promise.all([
    getPublishedPostBySlug(slug),
    getSiteSeoOptions(),
    getPublicLanguageContext(),
  ])
  if (!post) return new Response(null, { status: 404 })
  const identity = localizedSiteOptions(
    options,
    post.locale || language.code,
    language.defaultCode
  )
  const date = post.date
    ? new Date(post.date).toLocaleDateString(post.locale || language.code, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : ""
  return socialImageResponse(
    await renderSocialImage({
      title: post.title,
      heading: [identity.blogname, post.categories?.[0]]
        .filter(Boolean)
        .join(" | "),
      description: post.excerpt,
      footer: [post.authorName, date].filter(Boolean).join(" | "),
      direction: post.direction || language.direction,
    })
  )
}
