import { getPostDateBounds } from "@/lib/post-date-filter";
import { AdminShell, getAdminLanguageContext } from "@/components/admin/admin-shell";
import { verifyPostEditor } from "@/lib/authMIddleware";
import { redirect } from "next/navigation";
import { getPostsQuery, getPostCountsQuery, getAllCategoriesQuery, getPostMonthsQuery } from "./query";
import { PostListHeader } from "@/components/admin/posts/post-list-header";
import { PostViewsNav } from "@/components/admin/posts/post-views-nav";
import { PostListTable } from "@/components/admin/posts/post-list-table";

export const dynamic = "force-dynamic";

interface PostsPageProps {
  searchParams: Promise<{
    s?: string;
    status?: string;
    date?: string;
    from?: string;
    to?: string;
    sort?: string;
    order?: string;
    category?: string;
    lang?: string;
    page?: string;
  }>;
}

export default async function PostsPage({ searchParams }: PostsPageProps) {
  const session = await verifyPostEditor();
  const canDelete = session.user.role === "admin";

  const { s, status, date, from, to, sort, order, category, lang, page } = await searchParams;
  if (!canDelete && status === "trash") redirect("/admincp/posts");
  const search = s?.trim() ?? "";
  const requestedPage = Number(page);
  const currentPage = Number.isSafeInteger(requestedPage) && requestedPage > 0 && requestedPage <= 100000 ? requestedPage : 1;
  const currentLanguage = lang || "all";
  const selectedCategory = category && category !== "all" ? category : undefined;

  const langContext = await getAdminLanguageContext();
  const dict = langContext.dict;
  const direction: "rtl" | "ltr" = langContext.direction === "rtl" ? "rtl" : "ltr";

  const [counts, postsData, categories, months] = await Promise.all([
    getPostCountsQuery({
      language: currentLanguage !== "all" ? currentLanguage : undefined,
    }),
    getPostsQuery({
      search,
      status,
      date,
      from,
      to,
      orderBy: sort === "views" ? "viewCount" : undefined,
      order: order === "asc" ? "asc" : "desc",
      category: selectedCategory,
      language: currentLanguage !== "all" ? currentLanguage : undefined,
      page: currentPage,
      pageSize: 20,
    }),
    getAllCategoriesQuery(),
    getPostMonthsQuery(),
  ]);

  const queryString = new URLSearchParams();
  if (search) queryString.set("s", search);
  if (status) queryString.set("status", status);
  if (date) queryString.set("date", date);
  if (from) queryString.set("from", from);
  if (to) queryString.set("to", to);
  if (sort === "views") queryString.set("sort", sort);
  if (order) queryString.set("order", order);
  if (selectedCategory) queryString.set("category", selectedCategory);
  if (currentLanguage !== "all") queryString.set("lang", currentLanguage);

  return (
    <AdminShell>
      <div dir={direction} className="space-y-4 text-start">
        <PostListHeader
          title={dict["admin.posts.title"] || "Posts"}
          addNewHref="/admincp/posts/new"
          addNewLabel={dict["admin.posts.add_new"] || "Add New"}
          dict={dict}
        />

        <PostViewsNav
          showTrash={canDelete}
          counts={counts}
          currentStatus={status}
          currentLanguage={currentLanguage}
          languages={langContext.allLanguages}
          basePath="/admincp/posts"
          dict={dict}
          direction={direction}
        />

        {!getPostDateBounds({ date: date || "all", from, to }).valid && <div role="alert" className="border-s-4 border-[#d63638] bg-white p-3 text-sm">{dict["admin.posts.invalid_date_range"]}</div>}
        <PostListTable
          canDelete={canDelete}
          key={queryString.toString()}
          dateMonths={months}
          currentFrom={from}
          currentTo={to}
          basePath="/admincp/posts"
          categories={categories}
          currentCategory={selectedCategory}
          currentDate={date}
          dict={dict}
          direction={direction}
          emptyMessage={dict["admin.posts.no_posts"] || "No posts found."}
          isTrashView={status === "trash"}
          pagination={{
            currentPage: postsData.currentPage,
            totalPages: postsData.totalPages,
            totalItems: postsData.totalItems,
            queryString: queryString.toString(),
          }}
          posts={postsData.posts}
        />
      </div>
    </AdminShell>
  );
}
