import type { PostEditorSnapshot } from "@/db/schema/cms-post-autosave"
export const editorSnapshot = (patch: Partial<PostEditorSnapshot> = {}): PostEditorSnapshot => ({
  title: "Unpublished edits", content: "<p>Private recovery content</p>", excerpt: "Summary", featuredImageId: "",
  isFeatured: false, status: "publish", template: "default", postParent: "0", menuOrder: 0,
  selectedCategories: ["news"], tagList: ["tag"], languageCode: "en", customSlug: "", seo: {}, ...patch,
})
