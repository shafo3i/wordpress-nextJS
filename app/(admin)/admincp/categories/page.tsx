import { and, count, eq, ilike } from "drizzle-orm";
import { AdminShell } from "@/components/admin/admin-shell";
import { db } from "@/db";
import { wpTermRelationships, wpTermTaxonomy, wpTerms } from "@/db/schema";
import { PostListHeader } from "@/components/admin/posts/post-list-header";
import { CategoryAddForm } from "@/components/admin/categories/category-add-form";
import { CategoryListTable } from "@/components/admin/categories/category-list-table";

export const dynamic = "force-dynamic";

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ s?: string }>;
}) {
  const { s } = await searchParams;
  const search = s?.trim() ?? "";

  const categoryFilter = and(
    eq(wpTermTaxonomy.taxonomy, "category"),
    search ? ilike(wpTerms.name, `%${search}%`) : undefined,
  );

  const rawCategories = await db
    .select({
      termId: wpTerms.termId,
      name: wpTerms.name,
      slug: wpTerms.slug,
      description: wpTermTaxonomy.description,
      parent: wpTermTaxonomy.parent,
      termTaxonomyId: wpTermTaxonomy.termTaxonomyId,
    })
    .from(wpTerms)
    .innerJoin(wpTermTaxonomy, eq(wpTerms.termId, wpTermTaxonomy.termId))
    .where(categoryFilter)
    .orderBy(wpTerms.name);

  // Compute live post counts per category
  const counts = await Promise.all(
    rawCategories.map(async (cat) => {
      const c = await db
        .select({ count: count() })
        .from(wpTermRelationships)
        .where(eq(wpTermRelationships.termTaxonomyId, cat.termTaxonomyId));
      return {
        id: cat.termId.toString(),
        count: Number(c[0]?.count ?? 0),
      };
    }),
  );

  const countMap = new Map(counts.map((item) => [item.id, item.count]));

  const categoryRows = rawCategories.map((c) => ({
    id: c.termId.toString(),
    name: c.name,
    slug: c.slug,
    description: c.description || "",
    parent: c.parent?.toString() || "0",
    count: countMap.get(c.termId.toString()) ?? 0,
  }));

  const parentOptions = rawCategories.map((c) => ({
    id: c.termId.toString(),
    name: c.name,
    parent: c.parent?.toString() || "0",
  }));

  return (
    <AdminShell>
      <div className="mb-2">
        <PostListHeader
          addNewHref="#add-category"
          addNewLabel=""
          title="Categories"
        />

        {/* Top-Right Search Categories Bar */}
        <div className="mb-4 flex justify-end">
          <form className="flex items-center gap-1 text-[13px]" method="get">
            <input
              className="h-[30px] w-48 rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px] text-[#2c3338] shadow-[0_1px_2px_rgba(0,0,0,0.07)_inset] outline-none placeholder:text-[#a7aaad] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
              defaultValue={search}
              name="s"
              placeholder="Search Categories"
              type="search"
            />
            <button
              className="h-[30px] rounded-[3px] border border-[#2271b1] bg-[#f6f7f7] px-3 text-[13px] text-[#2271b1] hover:border-[#0a4b78] hover:bg-[#f0f0f1] hover:text-[#0a4b78]"
              type="submit"
            >
              Search Categories
            </button>
          </form>
        </div>
      </div>

      {/* WordPress Classic 2-Column Split: Form on Left, Table on Right */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-[300px_1fr] lg:grid-cols-[340px_1fr]">
        <div className="min-w-0" id="add-category">
          <CategoryAddForm parentCategories={parentOptions} />
        </div>

        <div className="min-w-0">
          <CategoryListTable categories={categoryRows} />
        </div>
      </div>
    </AdminShell>
  );
}
