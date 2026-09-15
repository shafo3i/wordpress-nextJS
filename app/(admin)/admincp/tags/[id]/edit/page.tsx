import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { db } from "@/db";
import { wpTermTaxonomy, wpTerms } from "@/db/schema";
import { updateTag } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditTagPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const termId = BigInt(id);

  const tagRows = await db
    .select({
      termId: wpTerms.termId,
      name: wpTerms.name,
      slug: wpTerms.slug,
      description: wpTermTaxonomy.description,
    })
    .from(wpTerms)
    .innerJoin(wpTermTaxonomy, eq(wpTerms.termId, wpTermTaxonomy.termId))
    .where(and(eq(wpTerms.termId, termId), eq(wpTermTaxonomy.taxonomy, "post_tag")))
    .limit(1);

  if (!tagRows[0]) notFound();
  const tag = tagRows[0];

  return (
    <AdminShell>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[#c3c4c7] pb-3">
        <div className="flex items-center gap-3">
          <h1 className="text-[23px] font-normal text-[#1d2327]">Edit Tag</h1>
          <Link
            className="text-xs text-[#2271b1] hover:underline"
            href="/admincp/tags"
          >
            Back to Tags
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

      <div className="max-w-2xl text-[13px] text-[#2c3338]">
        <form action={updateTag} className="space-y-5">
          <input name="termId" type="hidden" value={tag.termId.toString()} />

          <div>
            <label className="mb-1 block text-xs font-semibold text-[#1d2327]">
              Name
            </label>
            <input
              className="h-[32px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2.5 text-[13px] text-[#2c3338] shadow-[0_1px_2px_rgba(0,0,0,0.07)_inset] outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
              defaultValue={tag.name}
              name="name"
              required
              type="text"
            />
            <p className="mt-1 text-[11px] text-[#646970]">
              The name is how it appears on your site.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-[#1d2327]">
              Slug
            </label>
            <input
              className="h-[32px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2.5 text-[13px] text-[#2c3338] shadow-[0_1px_2px_rgba(0,0,0,0.07)_inset] outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
              defaultValue={tag.slug}
              name="slug"
              type="text"
            />
            <p className="mt-1 text-[11px] text-[#646970]">
              The “slug” is the URL-friendly version of the name. It is usually all
              lowercase and contains only letters, numbers, and hyphens.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-[#1d2327]">
              Description
            </label>
            <textarea
              className="w-full rounded-[3px] border border-[#8c8f94] bg-white p-2.5 text-[13px] text-[#2c3338] shadow-[0_1px_2px_rgba(0,0,0,0.07)_inset] outline-none focus:border-[#2271b1]"
              defaultValue={tag.description || ""}
              name="description"
              rows={5}
            />
            <p className="mt-1 text-[11px] text-[#646970]">
              The description is not prominent by default; however, some themes may show
              it.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              className="inline-flex items-center rounded-[3px] border border-[#2271b1] bg-[#2271b1] px-5 py-1.5 text-[13px] font-medium text-white shadow-[0_1px_0_#135e96] hover:border-[#135e96] hover:bg-[#135e96]"
              type="submit"
            >
              Update
            </button>
            <Link
              className="rounded-[3px] border border-[#8c8f94] bg-[#f6f7f7] px-3 py-1.5 text-[13px] text-[#2271b1] hover:border-[#0a4b78] hover:bg-[#f0f0f1] hover:text-[#0a4b78]"
              href="/admincp/tags"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </AdminShell>
  );
}
