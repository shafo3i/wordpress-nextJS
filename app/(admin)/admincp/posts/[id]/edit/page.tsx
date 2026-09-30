import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell, getAdminLanguageContext } from "@/components/admin/admin-shell";
import { ClassicPostEditor } from "@/components/admin/posts/editor/classic-post-editor";
import { verifyAdminOrEditor } from "@/lib/authMIddleware";
import { getPostByIdQuery, getAllCategoriesQuery, getAllTagsQuery } from "../../query";
import { updatePostAction } from "../../action";

export const dynamic = "force-dynamic";

interface EditPostProps {
  params: Promise<{ id: string }>;
}

export default async function EditPostPage({ params }: EditPostProps) {
  await verifyAdminOrEditor();

  const { id } = await params;
  const langContext = await getAdminLanguageContext();
  const dict = langContext.dict;
  const direction: "rtl" | "ltr" = langContext.direction === "rtl" ? "rtl" : "ltr";

  const [result, categories, tags] = await Promise.all([
    getPostByIdQuery(id),
    getAllCategoriesQuery(),
    getAllTagsQuery(),
  ]);

  if (!result || !result.post) notFound();

  const { post, translations } = result;

  return (
    <AdminShell>
      <div dir={direction} className="space-y-4 text-start">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h1 className="text-[23px] font-normal leading-normal text-[#1d2327]">
              {dict["admin.posts.edit_post"] || "Edit Post"}
            </h1>
            <Link
              className="inline-flex items-center rounded-[3px] border border-[#2271b1] bg-[#f6f7f7] px-2.5 py-0.5 text-[13px] font-medium text-[#2271b1] hover:border-[#0a4b78] hover:bg-[#f0f0f1] hover:text-[#0a4b78]"
              href="/admincp/posts/new"
            >
              {dict["admin.menu.add_new"] || "Add New"}
            </Link>
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
          action={updatePostAction}
          postId={post.id}
          initialTitle={post.title}
          initialContent={post.content}
          initialExcerpt={post.excerpt}
          initialFeaturedImageId={post.featuredImageId}
          initialStatus={post.status}
          initialCategories={post.categorySlugs}
          initialTags={post.tags.join(", ")}
          initialSeo={post.seo}
          categories={categories}
          tags={tags}
          postType="post"
          languages={langContext.allLanguages}
          initialLanguageCode={post.languageCode || "en"}
          translations={translations.map((t) => ({
            languageCode: t.languageCode,
            postId: t.postId.toString(),
            title: t.title,
          }))}
          dict={dict}
          direction={direction}
        />
      </div>
    </AdminShell>
  );
}
