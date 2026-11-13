"use client"

import { useState, useTransition, useRef, useMemo, useCallback } from "react"
import { usePostAutosave } from "@/lib/use-post-autosave"
import type { PostEditorSnapshot } from "@/db/schema/cms-post-autosave"
import type { SavePostResult } from "@/app/(admin)/admincp/posts/action"
import { PostAutosaveNotice } from "./post-autosave-notice"
import type { Editor as TinyEditor } from "tinymce"
import { MediaSelectModal } from "@/components/admin/media-select-modal"
import { attachmentMarkup, videoMarkup, videoEmbedUrl } from "@/lib/post-media"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { Camera, Music } from "lucide-react"
import {
  createNewStudioPageAction,
  switchPageEditorModeAction,
} from "@/app/(admin)/admincp/studio/[id]/action"
import { MetaBoxPublish } from "./meta-box-publish"
import { MetaBoxFormat } from "./meta-box-format"
import { MetaBoxCategories, type CategoryItem } from "./meta-box-categories"
import { MetaBoxTags } from "./meta-box-tags"
import { MetaBoxFeaturedImage } from "./meta-box-featured-image"
import { MetaBoxExcerpt } from "./meta-box-excerpt"
import { MetaBoxPageAttributes } from "./meta-box-page-attributes"
import {
  MetaBoxLanguages,
  type LanguageOption,
  type TranslationLink,
} from "./meta-box-languages"
import { MetaBoxSeo, type PostSeoData } from "./meta-box-seo"

const DynamicEditor = dynamic(
  () => import("@tinymce/tinymce-react").then((mod) => mod.Editor),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-105 w-full items-center justify-center bg-[#f6f7f7] text-xs text-[#646970]"></div>
    ),
  }
)

type PostAction = (
  formData: FormData
) => void | SavePostResult | Promise<void | SavePostResult>

export type ClassicPostEditorProps = {
  canEditMediaDetails?: boolean
  canManageCategories?: boolean
  action: PostAction
  autosaveUserId?: string
  uiLocale?: string
  autosaveDocument?: string
  initialModifiedAt?: string
  initialPostPassword?: string
  initialCommentStatus?: string
  initialPingStatus?: string
  initialTitle?: string
  initialContent?: string
  initialExcerpt?: string
  initialFeaturedImageId?: string
  initialIsFeatured?: boolean
  initialStatus?: string
  initialTemplate?: string
  initialCategories?: string[]
  initialTags?: string
  initialPostParent?: string
  initialMenuOrder?: number
  initialSeo?: PostSeoData
  parentPages?: { id: string; title: string }[]
  postId?: string
  postType?: "post" | "page"
  categories?: CategoryItem[]
  tags?: { slug: string; name: string }[]
  languages?: LanguageOption[]
  initialLanguageCode?: string
  translations?: TranslationLink[]
  translationOfId?: string
  translationOfTitle?: string
  initialIsStudioBuilder?: boolean
  onTrash?: () => void
  dict?: Record<string, string>
  direction?: "rtl" | "ltr"
}

export function ClassicPostEditor({
  canEditMediaDetails = true,
  canManageCategories = true,
  action,
  autosaveUserId = "",
  uiLocale = "en",
  autosaveDocument = "",
  initialModifiedAt = "",
  initialPostPassword = "",
  initialCommentStatus = "open",
  initialPingStatus = "open",
  initialTitle = "",
  initialContent = "",
  initialExcerpt = "",
  initialFeaturedImageId = "",
  initialIsFeatured = false,
  initialStatus = "draft",
  initialTemplate = "default",
  initialCategories = [],
  initialTags = "",
  initialPostParent = "0",
  initialMenuOrder = 0,
  initialSeo = {},
  parentPages = [],
  postId,
  postType = "post",
  categories = [],
  tags: availableTags = [],
  languages = [],
  initialLanguageCode = "en",
  translations = [],
  translationOfId,
  translationOfTitle,
  initialIsStudioBuilder = false,
  onTrash,
  dict = {},
  direction = "ltr",
}: ClassicPostEditorProps) {
  const router = useRouter()
  const [title, setTitle] = useState(initialTitle)
  const [isStudioBuilder, setIsStudioBuilder] = useState(initialIsStudioBuilder)
  const [isLaunchingStudio, setIsLaunchingStudio] = useState(false)
  const [content, setContent] = useState(initialContent)
  const [mediaOpen, setMediaOpen] = useState(false)
  const editorRef = useRef<TinyEditor | null>(null)
  const textRef = useRef<HTMLTextAreaElement>(null)
  const [excerpt, setExcerpt] = useState(initialExcerpt)
  const [featuredImageId, setFeaturedImageId] = useState(initialFeaturedImageId)
  const [isFeatured, setIsFeatured] = useState(initialIsFeatured)
  const [status, setStatus] = useState(initialStatus)
  const [template, setTemplate] = useState(initialTemplate)
  const [postParent, setPostParent] = useState(initialPostParent)
  const [menuOrder, setMenuOrder] = useState(initialMenuOrder)
  const [selectedCategories, setSelectedCategories] =
    useState<string[]>(initialCategories)
  const [tagList, setTagList] = useState<string[]>(
    initialTags
      ? initialTags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : []
  )
  const [editorMode, setEditorMode] = useState<"visual" | "text">("visual")
  const [isEditingSlug, setIsEditingSlug] = useState(false)
  const [customSlug, setCustomSlug] = useState("")
  const [languageCode, setLanguageCode] = useState(initialLanguageCode)
  const [seo, setSeo] = useState(initialSeo)
  const [recoveryRevision, setRecoveryRevision] = useState(0)
  const [saveError, setSaveError] = useState("")
  const [lastSaved, setLastSaved] = useState("")
  const [isPending, startTransition] = useTransition()

  const snapshot = useMemo(
    () => ({
      title,
      content,
      excerpt,
      featuredImageId,
      isFeatured,
      status,
      template,
      postParent,
      menuOrder,
      selectedCategories,
      tagList,
      languageCode,
      customSlug,
      seo,
    }),
    [
      title,
      content,
      excerpt,
      featuredImageId,
      isFeatured,
      status,
      template,
      postParent,
      menuOrder,
      selectedCategories,
      tagList,
      languageCode,
      customSlug,
      seo,
    ]
  )
  const [initialSnapshot] = useState(() => snapshot)
  const restoreSnapshot = useCallback((value: PostEditorSnapshot) => {
    setTitle(value.title)
    setContent(value.content)
    setExcerpt(value.excerpt)
    setFeaturedImageId(value.featuredImageId)
    setIsFeatured(value.isFeatured)
    setStatus(value.status)
    setTemplate(value.template)
    setPostParent(value.postParent)
    setMenuOrder(value.menuOrder)
    setSelectedCategories(value.selectedCategories)
    setTagList(value.tagList)
    setLanguageCode(value.languageCode)
    setCustomSlug(value.customSlug)
    setSeo(value.seo)
    setRecoveryRevision((value) => value + 1)
  }, [])
  const autosave = usePostAutosave({
    ownerId: autosaveUserId,
    documentKey: postId ? `post:${postId}` : autosaveDocument,
    baseModified: initialModifiedAt,
    snapshot,
    initialSnapshot,
    enabled:
      postType === "post" &&
      Boolean(autosaveUserId && (postId || autosaveDocument)),
    onRestore: restoreSnapshot,
    readContent: () =>
      editorMode === "visual" ? editorRef.current?.getContent() : undefined,
  })

  const slug =
    customSlug ||
    (title
      ? title
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
      : "post")

  const wordCount = content
    .replace(/<[^>]*>/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length

  const toggleCategory = (catSlug: string, checked: boolean) => {
    setSelectedCategories((curr) =>
      checked
        ? [...new Set([...curr, catSlug])]
        : curr.filter((s) => s !== catSlug)
    )
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const submitter = (e.nativeEvent as SubmitEvent)
      ?.submitter as HTMLButtonElement | null
    const submitterStatus =
      submitter?.getAttribute("name") === "status"
        ? submitter.getAttribute("value")
        : null
    const finalStatus = submitterStatus || status || "publish"

    formData.set("title", title)
    formData.set(
      "content",
      editorMode === "visual"
        ? (editorRef.current?.getContent() ?? content)
        : content
    )
    formData.set("excerpt", excerpt)
    formData.set("featuredImageId", featuredImageId)
    formData.set("isFeatured", isFeatured ? "1" : "0")
    formData.set("status", finalStatus)
    formData.set("categorySlugs", selectedCategories.join(","))
    formData.set("tags", tagList.join(", "))
    formData.set("postType", postType)
    formData.set("postParent", postParent)
    formData.set("menuOrder", String(menuOrder))
    formData.set("pageTemplate", template)
    if (postId) formData.set("id", postId)

    if (autosave.enabled) {
      formData.set("autosaveDocument", autosave.documentKey)
      formData.set("autosaveVersion", String(autosave.version.current))
      formData.set("expectedModifiedAt", initialModifiedAt)
      formData.set("postPassword", initialPostPassword)
      formData.set("commentStatus", initialCommentStatus)
      formData.set("pingStatus", initialPingStatus)
    }
    setSaveError("")
    startTransition(async () => {
      try {
        if (!(await autosave.prepareSubmission())) return
        // A background autosave may have completed while checking the session.
        if (autosave.enabled)
          formData.set("autosaveVersion", String(autosave.version.current))
        const result = await action(formData)
        if (result && !result.success) {
          setSaveError(result.error)
          return
        }
        autosave.acknowledgeSaved()
        if (result?.success) {
          router.push("/admincp/posts")
          return
        }
        setLastSaved(
          new Date().toLocaleTimeString(uiLocale, {
            hour: "numeric",
            minute: "2-digit",
            second: "2-digit",
          })
        )
      } catch (error) {
        if (postType === "page") throw error
        setSaveError("admin.editor.save_failed")
      } finally {
        autosave.cancelSubmission()
      }
    })
  }

  const handleLaunchStudio = async () => {
    setIsLaunchingStudio(true)
    try {
      if (postId) {
        await switchPageEditorModeAction({
          pageId: postId,
          enableStudio: true,
        })
        router.push(`/admincp/studio/${postId}`)
      } else {
        const res = await createNewStudioPageAction({
          title: title.trim() || dict?.["admin.studio.untitled_page"],
          languageCode,
          translationOf: translationOfId,
        })
        if (res.pageId) {
          router.push(`/admincp/studio/${res.pageId}`)
        }
      }
    } finally {
      setIsLaunchingStudio(false)
    }
  }

  const handleSwitchToClassic = async () => {
    setIsStudioBuilder(false)
    if (postId) {
      await switchPageEditorModeAction({
        pageId: postId,
        enableStudio: false,
      })
    }
  }

  return (
    <form
      dir={direction}
      className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_280px]"
      onSubmit={handleSubmit}
    >
      {postId && <input name="id" type="hidden" value={postId} />}
      <input name="content" type="hidden" value={content} />
      <input name="excerpt" type="hidden" value={excerpt} />
      <input name="featuredImageId" type="hidden" value={featuredImageId} />
      <input name="isFeatured" type="hidden" value={isFeatured ? "1" : "0"} />
      <input name="status" type="hidden" value={status} />
      <input name="pageTemplate" type="hidden" value={template} />
      <input
        name="categorySlugs"
        type="hidden"
        value={selectedCategories.join(",")}
      />
      <input name="tags" type="hidden" value={tagList.join(", ")} />
      <input name="postType" type="hidden" value={postType} />
      <input name="postParent" type="hidden" value={postParent} />
      <input name="menuOrder" type="hidden" value={menuOrder} />

      <fieldset disabled={isPending} className="contents">
        {/* Main Content Column */}
        <div className="min-w-0 space-y-4">
          {/* Page Builder Switcher Top Bar (Pages only, matches Screenshot 1) */}
          {postType === "page" && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[3px] border border-[#c3c4c7] bg-white px-3.5 py-2.5 shadow-[0_1px_1px_rgba(0,0,0,0.04)]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSwitchToClassic}
                  className={`inline-flex items-center gap-2 rounded-[3px] border px-3 py-1.5 text-xs font-medium transition-colors ${
                    !isStudioBuilder
                      ? "border-[#2271b1] bg-[#f0f6fc] text-[#1d2327]"
                      : "border-[#c3c4c7] bg-white text-[#50575e] hover:border-[#8c8f94] hover:text-[#1d2327]"
                  }`}
                >
                  <span className="flex size-4 items-center justify-center rounded-full bg-[#1d2327] font-serif text-[10px] font-bold text-white">
                    W
                  </span>
                  <span>{dict?.["admin.studio.edit_with_classic"]}</span>
                </button>

                <button
                  type="button"
                  disabled={isLaunchingStudio}
                  onClick={handleLaunchStudio}
                  className="inline-flex items-center gap-2 rounded-[3px] bg-[#2563eb] px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#1d4ed8] disabled:opacity-60"
                >
                  <span className="flex size-4 items-center justify-center rounded-full bg-white/20 font-serif text-[10px] font-black text-white">
                    S
                  </span>
                  <span>
                    {isLaunchingStudio
                      ? dict?.["admin.studio.launching"]
                      : dict?.["admin.studio.edit_with_studio"]}
                  </span>
                </button>
              </div>

              <div className="hidden items-center gap-1.5 rounded bg-[#f0f0f1] px-4 py-1 text-xs text-[#50575e] sm:flex">
                <span className="font-semibold text-[#1d2327]">
                  {title || dict?.["admin.studio.untitled"]}
                </span>
                <span>·</span>
                <span>{dict?.["admin.studio.page_badge"]}</span>
              </div>
            </div>
          )}

          <PostAutosaveNotice
            autosave={autosave}
            dict={dict}
            locale={uiLocale}
          />
          {saveError && (
            <p
              role="alert"
              className="border-s-4 border-[#d63638] bg-white p-3 text-xs text-[#d63638]"
            >
              {dict?.[saveError]}
            </p>
          )}
          {/* Title input (Classic WordPress style) */}
          <div>
            <input
              className="w-full rounded-[3px] border border-[#8c8f94] bg-white px-3 py-2 text-[1.7em] leading-tight font-normal text-[#1d2327] shadow-[0_1px_2px_rgba(0,0,0,0.07)_inset] outline-none placeholder:text-[#a7aaad] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
              name="title"
              onChange={(e) => setTitle(e.target.value)}
              placeholder={dict?.["admin.editor.title_placeholder"]}
              required
              type="text"
              value={title}
            />
          </div>

          {/* Permalink Preview Row */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#50575e]">
            <span className="font-medium text-[#1d2327]">
              {dict?.["admin.editor.permalink"]}
            </span>
            <span className="text-[#2271b1]" dir="ltr">
              http://localhost:3000/{postType === "page" ? "" : "posts/"}
              {isEditingSlug ? (
                <input
                  className="h-[22px] rounded border border-[#8c8f94] bg-white px-1 text-xs text-[#2c3338]"
                  onChange={(e) => setCustomSlug(e.target.value)}
                  type="text"
                  value={slug}
                />
              ) : (
                <span className="font-semibold text-[#1d2327] underline">
                  {slug}/
                </span>
              )}
            </span>
            <button
              className="rounded-[3px] border border-[#c3c4c7] bg-[#f6f7f7] px-2 py-0.5 text-[11px] text-[#2271b1] hover:border-[#8c8f94] hover:bg-[#f0f0f1]"
              onClick={() => setIsEditingSlug(!isEditingSlug)}
              type="button"
            >
              {isEditingSlug
                ? dict?.["admin.common.confirm"]
                : dict?.["common.edit"]}
            </button>
          </div>

          {postType === "page" && isStudioBuilder ? (
            /* Studio Builder Placeholder Canvas (matches Screenshot 1) */
            <div className="relative flex min-h-[460px] flex-col justify-between rounded-[3px] border border-[#c3c4c7] bg-[#dcdcde] p-8 sm:p-12">
              <div>
                <h2 className="font-serif text-3xl font-bold tracking-tight text-[#1d2327]">
                  {title || dict?.["admin.studio.untitled"]}
                </h2>
              </div>

              <div className="my-auto flex flex-col items-center justify-center py-12 text-center">
                <button
                  type="button"
                  disabled={isLaunchingStudio}
                  onClick={handleLaunchStudio}
                  className="inline-flex items-center gap-2.5 rounded-[4px] bg-[#2563eb] px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#1d4ed8] disabled:opacity-60"
                >
                  <span className="flex size-5 items-center justify-center rounded-full bg-white/20 font-serif text-xs font-black text-white">
                    S
                  </span>
                  <span>
                    {isLaunchingStudio
                      ? dict?.["admin.studio.launching"]
                      : dict?.["admin.studio.edit_with_studio"]}
                  </span>
                </button>
                <p className="mt-3 text-xs text-[#50575e]">
                  {dict?.["admin.studio.canvas_hint"]}
                </p>
              </div>

              <div />
            </div>
          ) : (
            <>
              {/* Add Media Row & Visual/Text Tabs */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  className="inline-flex items-center gap-1.5 rounded-[3px] border border-[#2271b1] bg-[#f6f7f7] px-3 py-1 text-xs font-medium text-[#2271b1] shadow-sm hover:border-[#0a4b78] hover:bg-[#f0f0f1] hover:text-[#0a4b78]"
                  onClick={() => setMediaOpen(true)}
                  type="button"
                >
                  <span className="flex items-center text-xs">
                    <Camera className="mr-0.5 size-3.5" />
                    <Music className="size-3" />
                  </span>
                  <span>{dict?.["admin.editor.add_media"]}</span>
                </button>

                <div className="flex items-center text-xs">
                  <button
                    className={`rounded-t-[3px] px-3 py-1 font-medium ${
                      editorMode === "visual"
                        ? "border-x border-t border-[#8c8f94] bg-white text-[#1d2327]"
                        : "border-b border-[#8c8f94] bg-[#f6f7f7] text-[#2271b1] hover:text-[#135e96]"
                    }`}
                    onClick={() => setEditorMode("visual")}
                    type="button"
                  >
                    {dict?.["admin.editor.visual"]}
                  </button>
                  <button
                    className={`rounded-t-[3px] px-3 py-1 font-medium ${
                      editorMode === "text"
                        ? "border-x border-t border-[#8c8f94] bg-white text-[#1d2327]"
                        : "border-b border-[#8c8f94] bg-[#f6f7f7] text-[#2271b1] hover:text-[#135e96]"
                    }`}
                    onClick={() => setEditorMode("text")}
                    type="button"
                  >
                    {dict?.["admin.editor.text"]}
                  </button>
                </div>
              </div>

              {/* Editor Container */}
              <div className="overflow-hidden rounded-[3px] border border-[#8c8f94] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.07)_inset]">
                {editorMode === "visual" ? (
                  <DynamicEditor
                    disabled={isPending}
                    init={{
                      height: 440,
                      menubar: false,
                      branding: false,
                      statusbar: false,
                      directionality: direction === "rtl" ? "rtl" : "ltr",
                      plugins:
                        "advlist autolink lists link image media table code wordcount",
                      toolbar:
                        "formatselect | bold italic underline | bullist numlist blockquote | alignleft aligncenter alignright | link unlink | postvideo | code",
                      media_live_embeds: true,
                      sandbox_iframes: true,
                      sandbox_iframes_exclusions: [
                        "youtube-nocookie.com",
                        "youtube.com",
                        "player.vimeo.com",
                      ],
                      setup: (editor: TinyEditor) => {
                        editor.on("BeforeSetContent", (event) => {
                          if (!event.content.includes("sandbox")) return
                          const doc = new DOMParser().parseFromString(
                            event.content,
                            "text/html"
                          )
                          for (const frame of doc.querySelectorAll(
                            "iframe[sandbox]"
                          )) {
                            const source = videoEmbedUrl(
                              frame.getAttribute("src") || ""
                            )
                            if (source) {
                              frame.setAttribute("src", source)
                              frame.removeAttribute("sandbox")
                            }
                          }
                          event.content = doc.body.innerHTML
                        })
                        editor.ui.registry.addButton("postvideo", {
                          text: dict?.["admin.editor.insert_video"],
                          onAction: () =>
                            editor.windowManager.open({
                              title: dict?.["admin.editor.insert_video"],
                              body: {
                                type: "panel",
                                items: [
                                  {
                                    type: "input",
                                    name: "source",
                                    label: dict?.["admin.editor.video_url"],
                                  },
                                ],
                              },
                              initialData: { source: "" },
                              buttons: [
                                {
                                  type: "cancel",
                                  text: dict?.["common.cancel"],
                                },
                                {
                                  type: "submit",
                                  text: dict?.["admin.editor.insert_media"],
                                  primary: true,
                                },
                              ],
                              onSubmit: (dialog) => {
                                const markup = videoMarkup(
                                  dialog.getData().source.trim()
                                )
                                if (!markup) {
                                  editor.windowManager.alert(
                                    dict?.["admin.editor.invalid_video"]
                                  )
                                  return
                                }
                                editor.insertContent(markup)
                                dialog.close()
                              },
                            }),
                        })
                      },
                      toolbar_mode: "floating",
                      resize: false,
                      content_style:
                        "body { font-family: Georgia, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen-Sans, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif; font-size: 16px; line-height: 1.7; color: #23282d; margin: 16px; } p { margin: 0 0 1em; }",
                      skin: "oxide",
                      content_css: false,
                    }}
                    licenseKey="gpl"
                    onInit={(_event, editor) => {
                      editorRef.current = editor
                      editor.on("remove", () => {
                        editorRef.current = null
                      })
                    }}
                    onEditorChange={setContent}
                    tinymceScriptSrc="/tinymce/tinymce.min.js"
                    value={content}
                  />
                ) : (
                  <textarea
                    ref={textRef}
                    className="h-[440px] w-full resize-none p-4 font-mono text-xs leading-relaxed text-[#2c3338] outline-none"
                    onChange={(e) => setContent(e.target.value)}
                    value={content}
                  />
                )}

                {/* Editor Status Bar */}
                <div className="flex items-center justify-between border-t border-[#dcdcde] bg-[#f6f7f7] px-3 py-1.5 text-[11px] text-[#646970]">
                  <span>
                    {dict?.["admin.editor.word_count"]} {wordCount}
                  </span>
                  <span>
                    {lastSaved
                      ? `${dict?.["admin.editor.draft_saved_at"]} ${lastSaved}.`
                      : ""}
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Excerpt Meta Box (Can be displayed under editor in classic WP style) */}
          <MetaBoxExcerpt dict={dict} excerpt={excerpt} onChange={setExcerpt} />

          {/* SEO & Social Open Graph Meta Box */}
          <MetaBoxSeo
            postTitle={title}
            postExcerpt={excerpt}
            postSlug={slug}
            key={recoveryRevision}
            initialSeo={seo}
            onChange={setSeo}
            dict={dict}
            direction={direction}
          />
        </div>

        {/* Right Sidebar Meta Boxes */}
        <div className="space-y-4">
          <MetaBoxPublish
            dict={dict}
            isExisting={Boolean(postId)}
            isPostTypePage={postType === "page"}
            isFeatured={isFeatured}
            onFeaturedChange={setIsFeatured}
            isSaving={isPending}
            onStatusChange={setStatus}
            onTrash={onTrash}
            status={status}
            previewUrl={postType === "page" ? `/${slug}` : `/posts/${slug}`}
          />

          {languages && languages.length > 0 && (
            <MetaBoxLanguages
              dict={dict}
              languages={languages}
              currentLanguage={languageCode}
              onLanguageChange={setLanguageCode}
              translations={translations}
              postId={postId}
              postType={postType}
              translationOfId={translationOfId}
              translationOfTitle={translationOfTitle}
            />
          )}

          {postType === "post" && (
            <MetaBoxFormat dict={dict} direction={direction} />
          )}

          {postType === "post" && (
            <MetaBoxCategories
              canManageCategories={canManageCategories}
              categories={categories}
              currentLanguage={languageCode}
              dict={dict}
              direction={direction}
              onToggleCategory={toggleCategory}
              selectedCategories={selectedCategories}
            />
          )}

          {postType === "post" && (
            <MetaBoxTags
              availableTags={availableTags}
              dict={dict}
              direction={direction}
              onTagsChange={setTagList}
              tags={tagList}
            />
          )}

          {postType === "page" && (
            <MetaBoxPageAttributes
              dict={dict}
              currentParentId={postParent}
              onOrderChange={setMenuOrder}
              onParentChange={setPostParent}
              onTemplateChange={setTemplate}
              order={menuOrder}
              parentPages={parentPages}
              template={template}
            />
          )}

          <MetaBoxFeaturedImage
            canEditMediaDetails={canEditMediaDetails}
            dict={dict}
            featuredImageId={featuredImageId}
            onChange={setFeaturedImageId}
          />
        </div>
      </fieldset>
      <MediaSelectModal
        canEditDetails={canEditMediaDetails}
        isOpen={mediaOpen}
        onClose={() => setMediaOpen(false)}
        mediaType="all"
        dict={dict}
        title={dict?.["admin.editor.add_media"]}
        selectButtonText={dict?.["admin.editor.insert_media"]}
        onSelect={(item) => {
          const markup = attachmentMarkup(item)
          if (editorMode === "visual" && editorRef.current) {
            editorRef.current.insertContent(markup)
          } else {
            const start = textRef.current?.selectionStart ?? content.length
            const end = textRef.current?.selectionEnd ?? start
            setContent(content.slice(0, start) + markup + content.slice(end))
          }
        }}
      />
    </form>
  )
}
