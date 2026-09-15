import Link from "next/link";
import { and, eq, ne } from "drizzle-orm";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { ClassicPostEditor } from "@/components/admin/posts/editor/classic-post-editor";
import { db } from "@/db";
import { wpPostmeta, wpPosts } from "@/db/schema";
import { updatePage } from "../../../posts/actions";

export const dynamic = "force-dynamic";

export default async function EditPagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pageId = BigInt(id);

  const [page, featuredImage, allOtherPages] = await Promise.all([
    db
      .select({
        id: wpPosts.id,
        title: wpPosts.postTitle,
        content: wpPosts.postContent,
        excerpt: wpPosts.postExcerpt,
        status: wpPosts.postStatus,
        postParent: wpPosts.postParent,
        menuOrder: wpPosts.menuOrder,
      })
      .from(wpPosts)
      .where(and(eq(wpPosts.id, pageId), eq(wpPosts.postType, "page")))
      .limit(1),
    db
      .select({ value: wpPostmeta.metaValue })
      .from(wpPostmeta)
      .where(and(eq(wpPostmeta.postId, pageId), eq(wpPostmeta.metaKey, "_thumbnail_id")))
      .limit(1),
    db
      .select({ id: wpPosts.id, title: wpPosts.postTitle })
      .from(wpPosts)
      .where(and(eq(wpPosts.postType, "page"), ne(wpPosts.id, pageId))),
  ]);

  if (!page[0]) notFound();

  const parentPages = allOtherPages.map((p) => ({
    id: p.id.toString(),
    title: p.title || `Page #${p.id}`,
  }));

  return (
    <AdminShell>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-[23px] font-normal leading-normal text-[#1d2327]">
            Edit Page
          </h1>
          <Link
            className="inline-flex items-center rounded-[3px] border border-[#2271b1] bg-[#f6f7f7] px-2.5 py-0.5 text-[13px] font-medium text-[#2271b1] hover:border-[#0a4b78] hover:bg-[#f0f0f1] hover:text-[#0a4b78]"
            href="/admincp/pages/new"
          >
            Add New
          </Link>
        </div>
        <div className="flex items-center gap-1 text-[13px]">
          <button
            className="flex items-center gap-1 rounded-b-[4px] border border-[#c3c4c7] bg-white px-2.5 py-0.5 text-[#50575e] hover:border-[#8c8f94] hover:text-[#1d2327]"
            type="button"
          >
            Screen Options <span className="text-[9px]">▼</span>
          </button>
          <button
            className="flex items-center gap-1 rounded-b-[4px] border border-[#c3c4c7] bg-white px-2.5 py-0.5 text-[#50575e] hover:border-[#8c8f94] hover:text-[#1d2327]"
            type="button"
          >
            Help <span className="text-[9px]">▼</span>
          </button>
        </div>
      </div>

      <ClassicPostEditor
        action={updatePage}
        initialContent={page[0].content}
        initialExcerpt={page[0].excerpt}
        initialFeaturedImageId={featuredImage[0]?.value ?? ""}
        initialMenuOrder={page[0].menuOrder}
        initialPostParent={page[0].postParent?.toString() || "0"}
        initialStatus={page[0].status}
        initialTitle={page[0].title}
        parentPages={parentPages}
        postId={page[0].id.toString()}
        postType="page"
      />
    </AdminShell>
  );
}
