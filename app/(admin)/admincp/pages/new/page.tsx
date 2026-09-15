import { eq } from "drizzle-orm";
import { AdminShell } from "@/components/admin/admin-shell";
import { ClassicPostEditor } from "@/components/admin/posts/editor/classic-post-editor";
import { db } from "@/db";
import { wpPosts } from "@/db/schema";
import { savePage } from "../../posts/actions";

export const dynamic = "force-dynamic";

export default async function NewPagePage() {
  const existingPages = await db
    .select({ id: wpPosts.id, title: wpPosts.postTitle })
    .from(wpPosts)
    .where(eq(wpPosts.postType, "page"));

  const parentPages = existingPages.map((p) => ({
    id: p.id.toString(),
    title: p.title || `Page #${p.id}`,
  }));

  return (
    <AdminShell>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <h1 className="text-[23px] font-normal leading-normal text-[#1d2327]">
            Add New Page
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
        action={savePage}
        parentPages={parentPages}
        postType="page"
      />
    </AdminShell>
  );
}
