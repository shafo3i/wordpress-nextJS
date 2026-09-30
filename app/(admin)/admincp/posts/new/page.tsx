import { AdminShell, getAdminLanguageContext } from "@/components/admin/admin-shell";
import { ClassicPostEditor } from "@/components/admin/posts/editor/classic-post-editor";
import { verifyAdminOrEditor } from "@/lib/authMIddleware";
import { getAllCategoriesQuery, getAllTagsQuery, getPostByIdQuery } from "../query";
import { savePostAction } from "../action";

export const dynamic = "force-dynamic";

interface NewPostProps {
  searchParams: Promise<{
    lang?: string;
    translation_of?: string;
  }>;
}

export default async function NewPostPage({ searchParams }: NewPostProps) {
  await verifyAdminOrEditor();

  const { lang, translation_of } = await searchParams;
  const langContext = await getAdminLanguageContext();
  const dict = langContext.dict;
  const direction: "rtl" | "ltr" = langContext.direction === "rtl" ? "rtl" : "ltr";

  // Determine initial language
  const targetLanguage = lang || langContext.code || "en";

  // Fetch translation source info if creating a translation
  let translationOfTitle: string | undefined;
  if (translation_of) {
    const sourcePost = await getPostByIdQuery(translation_of);
    if (sourcePost?.post) {
      translationOfTitle = sourcePost.post.title;
    }
  }

  const [categories, tags] = await Promise.all([
    getAllCategoriesQuery(),
    getAllTagsQuery(),
  ]);

  return (
    <AdminShell>
      <div dir={direction} className="space-y-4 text-start">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <h1 className="text-[23px] font-normal leading-normal text-[#1d2327]">
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
              {dict["admin.common.help"] || "Help"} <span className="text-[9px]">▼</span>
            </button>
          </div>
        </div>

        <ClassicPostEditor
          action={savePostAction}
          categories={categories}
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
  );
}
