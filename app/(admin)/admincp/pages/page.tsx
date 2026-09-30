import { AdminShell, getAdminLanguageContext } from "@/components/admin/admin-shell";
import { verifyAdminOrEditor } from "@/lib/authMIddleware";
import { getPagesQuery, getPageCountsQuery, getParentPagesQuery } from "./query";
import { PageListHeader, PageViewsNav, PageListTable } from "./_components";

export const dynamic = "force-dynamic";

interface PagesPageProps {
  searchParams: Promise<{
    s?: string;
    status?: string;
    date?: "today" | "month";
    lang?: string;
    page?: string;
  }>;
}

export default async function PagesPage({ searchParams }: PagesPageProps) {
  await verifyAdminOrEditor();

  const { s, status, date, lang, page } = await searchParams;
  const search = s?.trim() ?? "";
  const currentPage = Number(page) > 0 ? Number(page) : 1;
  const currentLanguage = lang || "all";

  const langContext = await getAdminLanguageContext();
  const dict = langContext.dict;
  const direction: "rtl" | "ltr" = langContext.direction === "rtl" ? "rtl" : "ltr";

  // Fetch counts and pages
  const [counts, pagesData, parentPages] = await Promise.all([
    getPageCountsQuery({
      language: currentLanguage !== "all" ? currentLanguage : undefined,
    }),
    getPagesQuery({
      search,
      status,
      date,
      language: currentLanguage !== "all" ? currentLanguage : undefined,
      page: currentPage,
      pageSize: 20,
    }),
    getParentPagesQuery(
      undefined,
      currentLanguage !== "all" ? currentLanguage : undefined
    ),
  ]);

  const queryString = new URLSearchParams();
  if (search) queryString.set("s", search);
  if (status) queryString.set("status", status);
  if (date) queryString.set("date", date);
  if (currentLanguage !== "all") queryString.set("lang", currentLanguage);

  return (
    <AdminShell>
      <div dir={direction} className="space-y-4 text-start">
        <PageListHeader
          title={dict["admin.menu.pages"] || "Pages"}
          addNewHref="/admincp/pages/new"
          dict={dict}
          direction={direction}
        />

        <PageViewsNav
          counts={counts}
          currentStatus={status}
          currentLanguage={currentLanguage}
          languages={langContext.allLanguages}
          basePath="/admincp/pages"
          dict={dict}
          direction={direction}
        />

        <PageListTable
          basePath="/admincp/pages"
          currentDate={date}
          emptyMessage={dict["admin.pages.no_pages"] || "No pages found."}
          pagination={{
            currentPage,
            totalPages: pagesData.totalPages,
            totalItems: pagesData.totalItems,
            queryString: queryString.toString(),
          }}
          pages={pagesData.pages}
          parentPages={parentPages}
          languages={langContext.allLanguages}
          isTrashView={status === "trash"}
          dict={dict}
          direction={direction}
        />
      </div>
    </AdminShell>
  );
}
