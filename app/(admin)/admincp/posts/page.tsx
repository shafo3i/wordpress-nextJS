import { and, count, desc, eq, gte, ilike, inArray } from "drizzle-orm";
import { AdminShell } from "@/components/admin/admin-shell";
import { db } from "@/db";
import {
  wpComments,
  wpPosts,
  wpTermRelationships,
  wpTermTaxonomy,
  wpTerms,
  user,
} from "@/db/schema";
import { PostListHeader } from "@/components/admin/posts/post-list-header";
import { PostViewsNav } from "@/components/admin/posts/post-views-nav";
import { PostListTable } from "@/components/admin/posts/post-list-table";

const VALID_STATUSES = ["publish", "draft", "pending", "private", "trash"] as const;

export const dynamic = "force-dynamic";

export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<{ s?: string; status?: string; date?: string; category?: string; page?: string }>;
}) {
  const { s, status, date, category, page } = await searchParams;
  const search = s?.trim() ?? "";
  const currentPage = Number(page) > 0 ? Number(page) : 1;
  const pageSize = 20;

  const selectedStatus =
    status && VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])
      ? status
      : undefined;
  const selectedDate = date === "today" || date === "month" ? date : undefined;
  const selectedCategory = category && category !== "all" ? category : undefined;

  const dateStart =
    selectedDate === "today"
      ? new Date(new Date().setHours(0, 0, 0, 0))
      : selectedDate === "month"
        ? new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        : undefined;

  const categoryTaxonomy = selectedCategory
    ? await db
        .select({ id: wpTermTaxonomy.termTaxonomyId })
        .from(wpTermTaxonomy)
        .innerJoin(wpTerms, eq(wpTermTaxonomy.termId, wpTerms.termId))
        .where(and(eq(wpTerms.slug, selectedCategory), eq(wpTermTaxonomy.taxonomy, "category")))
        .limit(1)
    : [];

  const categoryPostIds = categoryTaxonomy[0]
    ? await db
        .select({ id: wpTermRelationships.objectId })
        .from(wpTermRelationships)
        .where(eq(wpTermRelationships.termTaxonomyId, categoryTaxonomy[0].id))
    : undefined;

  const categoryIds = categoryPostIds?.map((item) => item.id) ?? [];
  const baseFilter = eq(wpPosts.postType, "post");

  const filterArgs = [
    baseFilter,
    selectedStatus ? eq(wpPosts.postStatus, selectedStatus) : undefined,
    dateStart ? gte(wpPosts.postDate, dateStart) : undefined,
    selectedCategory
      ? categoryIds.length
        ? inArray(wpPosts.id, categoryIds)
        : eq(wpPosts.id, BigInt(-1))
      : undefined,
    search ? ilike(wpPosts.postTitle, `%${search}%`) : undefined,
  ];

  const [
    allCountRes,
    publishedCountRes,
    draftCountRes,
    pendingCountRes,
    trashCountRes,
    categoriesRes,
    totalResult,
    postsResult,
  ] = await Promise.all([
    db.select({ count: count() }).from(wpPosts).where(baseFilter),
    db.select({ count: count() }).from(wpPosts).where(and(baseFilter, eq(wpPosts.postStatus, "publish"))),
    db.select({ count: count() }).from(wpPosts).where(and(baseFilter, eq(wpPosts.postStatus, "draft"))),
    db.select({ count: count() }).from(wpPosts).where(and(baseFilter, eq(wpPosts.postStatus, "pending"))),
    db.select({ count: count() }).from(wpPosts).where(and(baseFilter, eq(wpPosts.postStatus, "trash"))),
    db
      .select({ id: wpTerms.termId, slug: wpTerms.slug, name: wpTerms.name })
      .from(wpTerms)
      .innerJoin(wpTermTaxonomy, eq(wpTerms.termId, wpTermTaxonomy.termId))
      .where(eq(wpTermTaxonomy.taxonomy, "category")),
    db.select({ total: count() }).from(wpPosts).where(and(...filterArgs)),
    db
      .select({
        id: wpPosts.id,
        title: wpPosts.postTitle,
        status: wpPosts.postStatus,
        date: wpPosts.postDate,
        slug: wpPosts.postName,
        commentStatus: wpPosts.commentStatus,
        pingStatus: wpPosts.pingStatus,
        postPassword: wpPosts.postPassword,
        authorName: user.name,
      })
      .from(wpPosts)
      .leftJoin(user, eq(wpPosts.postAuthor, user.id))
      .where(and(...filterArgs))
      .orderBy(desc(wpPosts.postModified))
      .limit(pageSize)
      .offset((currentPage - 1) * pageSize),
  ]);

  const totalItems = Number(totalResult[0]?.total ?? 0);
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const postIds = postsResult.map((post) => post.id);

  const [termRows, commentRows] = postIds.length
    ? await Promise.all([
        db
          .select({
            objectId: wpTermRelationships.objectId,
            taxonomy: wpTermTaxonomy.taxonomy,
            name: wpTerms.name,
            slug: wpTerms.slug,
          })
          .from(wpTermRelationships)
          .innerJoin(wpTermTaxonomy, eq(wpTermRelationships.termTaxonomyId, wpTermTaxonomy.termTaxonomyId))
          .innerJoin(wpTerms, eq(wpTermTaxonomy.termId, wpTerms.termId))
          .where(inArray(wpTermRelationships.objectId, postIds)),
        db
          .select({ postId: wpComments.commentPostId, count: count() })
          .from(wpComments)
          .where(inArray(wpComments.commentPostId, postIds))
          .groupBy(wpComments.commentPostId),
      ])
    : [[], []];

  const rows = postsResult.map((post) => {
    const terms = termRows.filter((term) => term.objectId === post.id);
    const comment = commentRows.find((item) => item.postId === post.id);
    const catTerms = terms.filter((term) => term.taxonomy === "category");
    const tagTerms = terms.filter((term) => term.taxonomy === "post_tag");

    return {
      id: post.id.toString(),
      title: post.title,
      slug: post.slug,
      status: post.status,
      date: post.date.toISOString(),
      authorName: post.authorName ?? "admin",
      categories: catTerms.map((term) => term.name),
      categorySlugs: catTerms.map((term) => term.slug),
      tags: tagTerms.map((term) => term.name),
      commentCount: String(comment?.count ?? 0),
      commentStatus: post.commentStatus,
      pingStatus: post.pingStatus,
      postPassword: post.postPassword,
    };
  });

  const queryString = new URLSearchParams();
  if (search) queryString.set("s", search);
  if (selectedStatus) queryString.set("status", selectedStatus);
  if (selectedDate) queryString.set("date", selectedDate);
  if (selectedCategory) queryString.set("category", selectedCategory);

  const categoryOptions = categoriesRes.map((c) => ({
    id: c.id.toString(),
    slug: c.slug,
    name: c.name,
  }));

  return (
    <AdminShell>
      <PostListHeader />

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <PostViewsNav
          counts={{
            all: Number(allCountRes[0]?.count ?? 0),
            publish: Number(publishedCountRes[0]?.count ?? 0),
            draft: Number(draftCountRes[0]?.count ?? 0),
            pending: Number(pendingCountRes[0]?.count ?? 0),
            trash: Number(trashCountRes[0]?.count ?? 0),
          }}
          currentStatus={selectedStatus}
          queryString={queryString.toString()}
        />

        {/* Top-Right Search Bar */}
        <form className="flex items-center gap-1 text-[13px]" method="get">
          {selectedStatus ? <input name="status" type="hidden" value={selectedStatus} /> : null}
          {selectedDate ? <input name="date" type="hidden" value={selectedDate} /> : null}
          {selectedCategory ? <input name="category" type="hidden" value={selectedCategory} /> : null}
          <input
            className="h-[30px] w-48 rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px] text-[#2c3338] shadow-[0_1px_2px_rgba(0,0,0,0.07)_inset] outline-none placeholder:text-[#a7aaad] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
            defaultValue={search}
            name="s"
            placeholder="Search Posts"
            type="search"
          />
          <button
            className="h-[30px] rounded-[3px] border border-[#2271b1] bg-[#f6f7f7] px-3 text-[13px] text-[#2271b1] hover:border-[#0a4b78] hover:bg-[#f0f0f1] hover:text-[#0a4b78]"
            type="submit"
          >
            Search Posts
          </button>
        </form>
      </div>

      <PostListTable
        basePath="/admincp/posts"
        categories={categoryOptions}
        currentCategory={selectedCategory}
        currentDate={selectedDate}
        emptyMessage="No posts found."
        pagination={{
          currentPage,
          totalPages,
          totalItems,
          queryString: queryString.toString(),
        }}
        posts={rows}
      />
    </AdminShell>
  );
}
