import { and, count, eq, ilike } from "drizzle-orm";
import { AdminShell } from "@/components/admin/admin-shell";
import { db } from "@/db";
import { wpTermRelationships, wpTermTaxonomy, wpTerms } from "@/db/schema";
import { PostListHeader } from "@/components/admin/posts/post-list-header";
import { TagAddForm } from "@/components/admin/tags/tag-add-form";
import { TagListTable } from "@/components/admin/tags/tag-list-table";

export const dynamic = "force-dynamic";

export default async function TagsPage({
  searchParams,
}: {
  searchParams: Promise<{ s?: string }>;
}) {
  const { s } = await searchParams;
  const search = s?.trim() ?? "";

  const tagFilter = and(
    eq(wpTermTaxonomy.taxonomy, "post_tag"),
    search ? ilike(wpTerms.name, `%${search}%`) : undefined,
  );

  const rawTags = await db
    .select({
      termId: wpTerms.termId,
      name: wpTerms.name,
      slug: wpTerms.slug,
      description: wpTermTaxonomy.description,
      termTaxonomyId: wpTermTaxonomy.termTaxonomyId,
    })
    .from(wpTerms)
    .innerJoin(wpTermTaxonomy, eq(wpTerms.termId, wpTermTaxonomy.termId))
    .where(tagFilter)
    .orderBy(wpTerms.name);

  // Compute live post counts per tag
  const counts = await Promise.all(
    rawTags.map(async (tag) => {
      const c = await db
        .select({ count: count() })
        .from(wpTermRelationships)
        .where(eq(wpTermRelationships.termTaxonomyId, tag.termTaxonomyId));
      return {
        id: tag.termId.toString(),
        count: Number(c[0]?.count ?? 0),
      };
    }),
  );

  const countMap = new Map(counts.map((item) => [item.id, item.count]));

  const tagRows = rawTags.map((t) => ({
    id: t.termId.toString(),
    name: t.name,
    slug: t.slug,
    description: t.description || "",
    count: countMap.get(t.termId.toString()) ?? 0,
  }));

  return (
    <AdminShell>
      <div className="mb-2">
        <PostListHeader addNewHref="#add-tag" addNewLabel="" title="Tags" />

        {/* Top-Right Search Tags Bar */}
        <div className="mb-4 flex justify-end">
          <form className="flex items-center gap-1 text-[13px]" method="get">
            <input
              className="h-[30px] w-48 rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px] text-[#2c3338] shadow-[0_1px_2px_rgba(0,0,0,0.07)_inset] outline-none placeholder:text-[#a7aaad] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
              defaultValue={search}
              name="s"
              placeholder="Search Tags"
              type="search"
            />
            <button
              className="h-[30px] rounded-[3px] border border-[#2271b1] bg-[#f6f7f7] px-3 text-[13px] text-[#2271b1] hover:border-[#0a4b78] hover:bg-[#f0f0f1] hover:text-[#0a4b78]"
              type="submit"
            >
              Search Tags
            </button>
          </form>
        </div>
      </div>

      {/* WordPress Classic 2-Column Split: Form on Left, Table on Right */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-[300px_1fr] lg:grid-cols-[340px_1fr]">
        <div className="min-w-0" id="add-tag">
          <TagAddForm />
        </div>

        <div className="min-w-0">
          <TagListTable tags={tagRows} />
        </div>
      </div>
    </AdminShell>
  );
}
