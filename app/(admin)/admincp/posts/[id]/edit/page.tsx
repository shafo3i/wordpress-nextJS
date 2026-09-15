import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { ClassicPostEditor } from "@/components/admin/posts/editor/classic-post-editor";
import { db } from "@/db";
import {
  wpPostmeta,
  wpPosts,
  wpTermRelationships,
  wpTermTaxonomy,
  wpTerms,
} from "@/db/schema";
import { updatePost } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const postId = BigInt(id);

  const post = await db
    .select({
      id: wpPosts.id,
      title: wpPosts.postTitle,
      content: wpPosts.postContent,
      excerpt: wpPosts.postExcerpt,
      status: wpPosts.postStatus,
    })
    .from(wpPosts)
    .where(and(eq(wpPosts.id, postId), eq(wpPosts.postType, "post")))
    .limit(1);

  if (!post[0]) notFound();

  const [terms, relationships, featuredImage] = await Promise.all([
    db
      .select({
        slug: wpTerms.slug,
        name: wpTerms.name,
        taxonomy: wpTermTaxonomy.taxonomy,
      })
      .from(wpTerms)
      .innerJoin(wpTermTaxonomy, eq(wpTerms.termId, wpTermTaxonomy.termId)),
    db
      .select({
        slug: wpTerms.slug,
        name: wpTerms.name,
        taxonomy: wpTermTaxonomy.taxonomy,
      })
      .from(wpTermRelationships)
      .innerJoin(
        wpTermTaxonomy,
        eq(wpTermRelationships.termTaxonomyId, wpTermTaxonomy.termTaxonomyId),
      )
      .innerJoin(wpTerms, eq(wpTermTaxonomy.termId, wpTerms.termId))
      .where(eq(wpTermRelationships.objectId, postId)),
    db
      .select({ value: wpPostmeta.metaValue })
      .from(wpPostmeta)
      .where(and(eq(wpPostmeta.postId, postId), eq(wpPostmeta.metaKey, "_thumbnail_id")))
      .limit(1),
  ]);

  const selectedCategories = relationships
    .filter((term) => term.taxonomy === "category")
    .map((term) => term.slug);
  const selectedTags = relationships
    .filter((term) => term.taxonomy === "post_tag")
    .map((term) => term.name)
    .join(", ");

  return (
    <AdminShell>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-[23px] font-normal leading-normal text-[#1d2327]">
            Edit Post
          </h1>
          <Link
            className="inline-flex items-center rounded-[3px] border border-[#2271b1] bg-[#f6f7f7] px-2.5 py-0.5 text-[13px] font-medium text-[#2271b1] hover:border-[#0a4b78] hover:bg-[#f0f0f1] hover:text-[#0a4b78]"
            href="/admincp/posts/new"
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
        action={updatePost}
        categories={terms
          .filter((term) => term.taxonomy === "category")
          .map(({ slug, name }) => ({ slug, name }))}
        initialCategories={selectedCategories}
        initialContent={post[0].content}
        initialExcerpt={post[0].excerpt}
        initialFeaturedImageId={featuredImage[0]?.value ?? ""}
        initialStatus={post[0].status}
        initialTags={selectedTags}
        initialTitle={post[0].title}
        postId={post[0].id.toString()}
        tags={terms
          .filter((term) => term.taxonomy === "post_tag")
          .map(({ slug, name }) => ({ slug, name }))}
      />
    </AdminShell>
  );
}
