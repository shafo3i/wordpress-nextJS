import Link from "next/link";
import { eq } from "drizzle-orm";
import { AdminShell } from "@/components/admin/admin-shell";
import { ClassicPostEditor } from "@/components/admin/posts/editor/classic-post-editor";
import { db } from "@/db";
import { wpTermTaxonomy, wpTerms } from "@/db/schema";
import { savePost } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewPostPage() {
  const [categories, tags] = await Promise.all([
    db
      .select({ slug: wpTerms.slug, name: wpTerms.name })
      .from(wpTerms)
      .innerJoin(wpTermTaxonomy, eq(wpTerms.termId, wpTermTaxonomy.termId))
      .where(eq(wpTermTaxonomy.taxonomy, "category")),
    db
      .select({ slug: wpTerms.slug, name: wpTerms.name })
      .from(wpTerms)
      .innerJoin(wpTermTaxonomy, eq(wpTerms.termId, wpTermTaxonomy.termId))
      .where(eq(wpTermTaxonomy.taxonomy, "post_tag")),
  ]);

  return (
    <AdminShell>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <h1 className="text-[23px] font-normal leading-normal text-[#1d2327]">
            Add New Post
          </h1>
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
        action={savePost}
        categories={categories}
        tags={tags}
      />
    </AdminShell>
  );
}
