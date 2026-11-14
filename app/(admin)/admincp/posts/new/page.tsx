import { notFound } from "next/navigation";
import { randomUUID } from "node:crypto"
import { redirect } from "next/navigation"
import { autosaveDocumentKey } from "@/db/schema/cms-post-autosave"
import {
  AdminShell,
  getAdminLanguageContext,
} from "@/components/admin/admin-shell"
import { ClassicPostEditor } from "@/components/admin/posts/editor/classic-post-editor"
import { verifyPostEditor as verifyAdminOrEditor } from "@/lib/authMIddleware"
import {
  getAllCategoriesQuery,
  getAllTagsQuery,
  getPostByIdQuery,
} from "../query"
import { savePostAction } from "../action"

export const dynamic = "force-dynamic"

interface NewPostProps {
  searchParams: Promise<{
    lang?: string
    draft?: string
    translation_of?: string
  }>
}

export default async function NewPostPage({ searchParams }: NewPostProps) {
  const session = await verifyAdminOrEditor()

  const { lang, translation_of, draft } = await searchParams
  if (!draft || !autosaveDocumentKey.safeParse(`new:${draft}`).success) {
    const params = new URLSearchParams({ draft: randomUUID() })
    if (lang) params.set("lang", lang)
    if (translation_of) params.set("translation_of", translation_of)
    redirect(`/admincp/posts/new?${params}`)
  }
  const langContext = await getAdminLanguageContext()
  const dict = langContext.dict
  const direction: "rtl" | "ltr" =
    langContext.direction === "rtl" ? "rtl" : "ltr"

  // Determine initial language
  const targetLanguage = lang || langContext.code;
  if(!langContext.allLanguages.some(language=>language.code===targetLanguage))notFound();

  const [categories, tags] = await Promise.all([
    getAllCategoriesQuery(),
    getAllTagsQuery(),
  ])

  // Fetch translation source info if creating a translation
  let translationOfTitle: string | undefined
  let initialCategories: string[] = []
  if (translation_of) {
    const sourcePost = await getPostByIdQuery(translation_of)
    if(!sourcePost?.post)notFound();
    if (sourcePost?.post) {
      translationOfTitle = sourcePost.post.title
      const sourceCatSlugs = sourcePost.post.categorySlugs || []
      // Match source categories' translation groups with targetLanguage categories
      const sourceGroupIds = categories
        .filter((c) => sourceCatSlugs.includes(c.slug) && c.translationGroupId)
        .map((c) => c.translationGroupId)

      const targetMatchingCats = categories.filter(
        (c) =>
          c.languageCode === targetLanguage &&
          c.translationGroupId &&
          sourceGroupIds.includes(c.translationGroupId)
      )

      if (targetMatchingCats.length > 0) {
        initialCategories = targetMatchingCats.map((c) => c.slug)
      }
    }
  }

  return (
    <AdminShell>
      <div dir={direction} className="space-y-4 text-start">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <h1 className="text-[23px] leading-normal font-normal text-[#1d2327]">
              {dict["admin.posts.add_new"] || "Add New Post"}
            </h1>
          </div>
          <div className="flex items-center gap-1 text-[13px]">
            <button
              className="flex items-center gap-1 rounded-b-[4px] border border-[#c3c4c7] bg-white px-2.5 py-0.5 text-[#50575e] hover:border-[#8c8f94] hover:text-[#1d2327]"
              type="button"
            >
              {dict["admin.common.screen_options"] || "Screen Options"}{" "}
              <span className="text-[9px]">▼</span>
            </button>
            <button
              className="flex items-center gap-1 rounded-b-[4px] border border-[#c3c4c7] bg-white px-2.5 py-0.5 text-[#50575e] hover:border-[#8c8f94] hover:text-[#1d2327]"
              type="button"
            >
              {dict["admin.common.help"] || "Help"}{" "}
              <span className="text-[9px]">▼</span>
            </button>
          </div>
        </div>

        <ClassicPostEditor
          key={`new:${draft}`}
          action={savePostAction}
          autosaveUserId={session.user.id}
          canEditMediaDetails
          canManageCategories={session.user.role === "admin"}
          uiLocale={langContext.code}
          autosaveDocument={`new:${draft}`}
          categories={categories}
          initialCategories={initialCategories}
          tags={tags}
          postType="post"
          languages={langContext.allLanguages}
          initialLanguageCode={targetLanguage}
          translationOfId={translation_of}
          translationOfTitle={translationOfTitle}
          dict={dict}
          direction={direction}
        />
      </div>
    </AdminShell>
  )
}
