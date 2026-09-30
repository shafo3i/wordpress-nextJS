import { AdminShell, getAdminLanguageContext } from "@/components/admin/admin-shell";
import { verifyAdminOrEditor } from "@/lib/authMIddleware";
import { getPostsQuery, getPostCountsQuery, getAllCategoriesQuery } from "./query";
import { PostListHeader } from "@/components/admin/posts/post-list-header";
import { PostViewsNav } from "@/components/admin/posts/post-views-nav";
import { PostListTable } from "@/components/admin/posts/post-list-table";

export const dynamic = "force-dynamic";

interface PostsPageProps {
  searchParams: Promise<{
    s?: string;
    status?: string;
    date?: "today" | "month";
    category?: string;
    lang?: string;
    page?: string;
  }>;
}

export default async function PostsPage({ searchParams }: PostsPageProps) {
  await verifyAdminOrEditor();

  const { s, status, date, category, lang, page } = await searchParams;
  const search = s?.trim() ?? "";
  const currentPage = Number(page) > 0 ? Number(page) : 1;
  const currentLanguage = lang || "all";
  const selectedCategory = category && category !== "all" ? category : undefined;

  const langContext = await getAdminLanguageContext();
  const dict = langContext.dict;
  const direction: "rtl" | "ltr" = langContext.direction === "rtl" ? "rtl" : "ltr";

  const [counts, postsData, categories] = await Promise.all([
    getPostCountsQuery({
      language: currentLanguage !== "all" ? currentLanguage : undefined,
    }),
    getPostsQuery({
      search,
      status,
      date,
      category: selectedCategory,
      language: currentLanguage !== "all" ? currentLanguage : undefined,
      page: currentPage,
      pageSize: 20,
    }),
    getAllCategoriesQuery(),
  ]);

  const queryString = new URLSearchParams();
  if (search) queryString.set("s", search);
  if (status) queryString.set("status", status);
  if (date) queryString.set("date", date);
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
          counts={counts}
          currentStatus={status}
          currentLanguage={currentLanguage}
          languages={langContext.allLanguages}
          basePath="/admincp/posts"
          dict={dict}
          direction={direction}
        />

        <PostListTable
          basePath="/admincp/posts"
          categories={categories}
          currentCategory={selectedCategory}
          currentDate={date}
          dict={dict}
          direction={direction}
          emptyMessage={dict["admin.posts.no_posts"] || "No posts found."}
          isTrashView={status === "trash"}
          pagination={{
            currentPage,
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
