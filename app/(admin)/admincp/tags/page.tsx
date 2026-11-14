import { AdminShell, getAdminLanguageContext } from "@/components/admin/admin-shell";
import { verifyPostEditor as verifyAdminOrEditor } from "@/lib/authMIddleware";
import { PostListHeader } from "@/components/admin/posts/post-list-header";
import { getTags } from "./query";
import { TagTable, TagForm, TagFilter } from "./_components";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    s?: string;
    page?: string;
    lang?: string;
  }>;
};

export default async function TagsPage({ searchParams }: PageProps) {
  await verifyAdminOrEditor();

  const { s, page, lang } = await searchParams;
  const searchQuery = typeof s === "string" ? s.trim().slice(0, 200) : "";
  const requestedPage = Number(page);
  const currentPage = Number.isSafeInteger(requestedPage) && requestedPage > 0 && requestedPage <= 100000 ? requestedPage : 1;
  const currentLanguage = typeof lang === "string" && lang.length <= 10 ? lang : "all";
  const pageSize = 20;

  const langContext = await getAdminLanguageContext();
  const dict = langContext.dict;
  const direction = langContext.direction;

  const { tags, total } = await getTags({
    search: searchQuery,
    language: currentLanguage,
    page: currentPage,
    limit: pageSize,
  });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <AdminShell>
      <div className="mb-2">
        <PostListHeader
          addNewHref="#add-tag"
          addNewLabel=""
          dict={dict}
          title={dict["admin.tags.title"] || ""}
        />

        {/* Top-Right Search Tags Bar */}
        <TagFilter dict={dict} searchQuery={searchQuery} />
      </div>

      {/* WordPress Classic 2-Column Split: Form on Left, Table on Right */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-[300px_1fr] lg:grid-cols-[340px_1fr]">
        <div className="min-w-0" id="add-tag">
          <TagForm dict={dict} />
        </div>

        <div className="min-w-0">
          <TagTable
            currentPage={currentPage}
            currentLanguage={currentLanguage}
            dict={dict}
            direction={direction}
            languages={langContext.allLanguages}
            pageSize={pageSize}
            searchQuery={searchQuery}
            tags={tags}
            totalItems={total}
            totalPages={totalPages}
          />
        </div>
      </div>
    </AdminShell>
  );
}
