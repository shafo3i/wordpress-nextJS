import { useState } from "react"
import { createRoot } from "react-dom/client"
import { MetaBoxFeaturedVideo } from "../../components/admin/posts/editor/meta-box-featured-video"
import { PostTemplate } from "../../components/site/templates/post-template"
import { resolveFeaturedVideo } from "../../lib/featured-video"
import { DEFAULT_THEME } from "../../components/site/utils"
import en from "../../templates/language/en.json"
import ar from "../../templates/language/ar.json"
function Fixture({ locale }: { locale: "en" | "ar" }) {
  const dict = locale === "ar" ? ar : en
  const [value, setValue] = useState("")
  const [image, setImage] = useState(false)
  const content =
    '<p>https://youtu.be/dQw4w9WgXcQ</p><video src="/uploads/second.mp4"></video>'
  const theme = {
    ...DEFAULT_THEME,
    dict,
    locale,
    direction: locale === "ar" ? ("rtl" as const) : ("ltr" as const),
  }
  return (
    <>
      <form data-featured-video-form>
        <MetaBoxFeaturedVideo
          value={value}
          content={content}
          onChange={setValue}
          dict={dict}
        />
      </form>
      <label>
        <input
          type="checkbox"
          checked={image}
          onChange={(event) => setImage(event.target.checked)}
        />
        {dict["admin.editor.featured_image"]}
      </label>
      <PostTemplate
        theme={theme}
        relatedPosts={[]}
        trackViews={false}
        article={{
          id: "1",
          title: "Article",
          slug: "article",
          excerpt: "Summary",
          content: "<p>Article body</p>",
          date: new Date("2026-01-01T00:00:00Z"),
          authorName: "Author",
          categories: [],
          tags: [],
          imageUrl: image ? "/uploads/cover.jpg" : "",
          isFeatured: false,
          hasFeaturedImage: image,
          featuredVideoUrl: resolveFeaturedVideo(value, content) || undefined,
        }}
      />
    </>
  )
}
export function render(locale: "en" | "ar") {
  createRoot(document.getElementById("fixture")!).render(
    <Fixture locale={locale} />
  )
}
