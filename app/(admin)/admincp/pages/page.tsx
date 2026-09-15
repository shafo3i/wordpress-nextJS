import { and, count, desc, eq, gte, ilike, inArray } from "drizzle-orm";
import { AdminShell } from "@/components/admin/admin-shell";
import { db } from "@/db";
import { wpComments, wpPosts, user } from "@/db/schema";
import { PostListHeader } from "@/components/admin/posts/post-list-header";
import { PostViewsNav } from "@/components/admin/posts/post-views-nav";
import { PageListTable } from "@/components/admin/pages/page-list-table";

const VALID_STATUSES = ["publish", "draft", "pending", "private", "trash"] as const;

export const dynamic = "force-dynamic";

export default async function PagesPage({
  searchParams,
}: {
  searchParams: Promise<{ s?: string; status?: string; date?: string; page?: string }>;
}) {
  const { s, status, date, page } = await searchParams;
  const search = s?.trim() ?? "";
  const currentPage = Number(page) > 0 ? Number(page) : 1;
  const pageSize = 20;

  const selectedStatus =
    status && VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])
      ? status
      : undefined;
  const selectedDate = date === "today" || date === "month" ? date : undefined;

  const dateStart =
    selectedDate === "today"
      ? new Date(new Date().setHours(0, 0, 0, 0))
      : selectedDate === "month"
        ? new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        : undefined;

  const baseFilter = eq(wpPosts.postType, "page");

  const filterArgs = [
    baseFilter,
    selectedStatus ? eq(wpPosts.postStatus, selectedStatus) : undefined,
    dateStart ? gte(wpPosts.postDate, dateStart) : undefined,
    search ? ilike(wpPosts.postTitle, `%${search}%`) : undefined,
  ];

  const [
    allCountRes,
    publishedCountRes,
    draftCountRes,
    trashCountRes,
    totalResult,
    pagesResult,
    allPagesList,
  ] = await Promise.all([
    db.select({ count: count() }).from(wpPosts).where(baseFilter),
    db.select({ count: count() }).from(wpPosts).where(and(baseFilter, eq(wpPosts.postStatus, "publish"))),
    db.select({ count: count() }).from(wpPosts).where(and(baseFilter, eq(wpPosts.postStatus, "draft"))),
    db.select({ count: count() }).from(wpPosts).where(and(baseFilter, eq(wpPosts.postStatus, "trash"))),
    db.select({ total: count() }).from(wpPosts).where(and(...filterArgs)),
    db
      .select({
        id: wpPosts.id,
        title: wpPosts.postTitle,
        status: wpPosts.postStatus,
        date: wpPosts.postDate,
        slug: wpPosts.postName,
        postParent: wpPosts.postParent,
        menuOrder: wpPosts.menuOrder,
        commentStatus: wpPosts.commentStatus,
        postPassword: wpPosts.postPassword,
        authorName: user.name,
      })
      .from(wpPosts)
      .leftJoin(user, eq(wpPosts.postAuthor, user.id))
      .where(and(...filterArgs))
      .orderBy(desc(wpPosts.menuOrder), desc(wpPosts.postModified))
      .limit(pageSize)
      .offset((currentPage - 1) * pageSize),
    db
      .select({ id: wpPosts.id, title: wpPosts.postTitle })
      .from(wpPosts)
      .where(baseFilter),
  ]);

  const totalItems = Number(totalResult[0]?.total ?? 0);
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const pageIds = pagesResult.map((p) => p.id);

  const commentRows = pageIds.length
    ? await db
      .select({ postId: wpComments.commentPostId, count: count() })
      .from(wpComments)
      .where(inArray(wpComments.commentPostId, pageIds))
      .groupBy(wpComments.commentPostId)
    : [];

  const rows = pagesResult.map((pageItem) => {
    const comment = commentRows.find((item) => item.postId === pageItem.id);
    return {
      id: pageItem.id.toString(),
      title: pageItem.title,
      slug: pageItem.slug,
      status: pageItem.status,
      date: pageItem.date.toISOString(),
      authorName: pageItem.authorName ?? "admin",
      commentCount: String(comment?.count ?? 0),
      postParent: pageItem.postParent?.toString() || "0",
      menuOrder: pageItem.menuOrder,
      commentStatus: pageItem.commentStatus,
      postPassword: pageItem.postPassword,
    };
  });

  const parentOptions = allPagesList.map((p) => ({
    id: p.id.toString(),
    title: p.title || `Page #${p.id}`,
  }));

  const queryString = new URLSearchParams();
  if (search) queryString.set("s", search);
  if (selectedStatus) queryString.set("status", selectedStatus);
  if (selectedDate) queryString.set("date", selectedDate);

  return (
    <AdminShell>
      <PostListHeader addNewHref="/admincp/pages/new" title="Pages" />

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <PostViewsNav
          basePath="/admincp/pages"
          counts={{
            all: Number(allCountRes[0]?.count ?? 0),
            publish: Number(publishedCountRes[0]?.count ?? 0),
            draft: Number(draftCountRes[0]?.count ?? 0),
            trash: Number(trashCountRes[0]?.count ?? 0),
          }}
          currentStatus={selectedStatus}
          queryString={queryString.toString()}
        />

        {/* Top-Right Search Bar */}
        <form className="flex items-center gap-1 text-[13px]" method="get">
          {selectedStatus ? <input name="status" type="hidden" value={selectedStatus} /> : null}
          {selectedDate ? <input name="date" type="hidden" value={selectedDate} /> : null}
          <input
            className="h-[30px] w-48 rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px] text-[#2c3338] shadow-[0_1px_2px_rgba(0,0,0,0.07)_inset] outline-none placeholder:text-[#a7aaad] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
            defaultValue={search}
            name="s"
            placeholder="Search Pages"
            type="search"
          />
          <button
            className="h-[30px] rounded-[3px] border border-[#2271b1] bg-[#f6f7f7] px-3 text-[13px] text-[#2271b1] hover:border-[#0a4b78] hover:bg-[#f0f0f1] hover:text-[#0a4b78]"
            type="submit"
          >
            Search Pages
          </button>
        </form>
      </div>

      <PageListTable
        basePath="/admincp/pages"
        currentDate={selectedDate}
        emptyMessage="No pages found."
        pagination={{
          currentPage,
          totalPages,
          totalItems,
          queryString: queryString.toString(),
        }}
        pages={rows}
        parentPages={parentOptions}
      />
    </AdminShell>
  );
}
