import { AdminShell, getAdminLanguageContext } from "@/components/admin/admin-shell";
import { verifyAdminOrEditor } from "@/lib/authMIddleware";
import { PostListHeader } from "@/components/admin/posts/post-list-header";
import { getPlugins, getPluginCounts, getCatalogPlugins } from "./query";
import { PluginTable, PluginFilter } from "./_components";
import { PluginInstallHeader } from "@/components/admin/plugins/add-new/plugin-install-header";
import { PluginDirectoryGrid } from "@/components/admin/plugins/add-new/plugin-directory-grid";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    s?: string;
    status?: string;
    page?: string;
    tab?: string;
    category?: string;
  }>;
};

export default async function PluginsPage({ searchParams }: PageProps) {
  await verifyAdminOrEditor();

  const { s, status, page, tab, category } = await searchParams;
  const searchQuery = s?.trim() ?? "";
  const currentStatus = status ?? "all";
  const currentPage = Number(page) > 0 ? Number(page) : 1;
  const pageSize = 20;

  const langContext = await getAdminLanguageContext();
  const dict = langContext.dict;

  // 1. ADD NEW PLUGINS DIRECTORY VIEW
  if (tab === "add-new") {
    const activeCategory = category && ["Featured", "Popular", "Recommended"].includes(category)
      ? category
      : "Featured";

    const catalogPlugins = await getCatalogPlugins({
      category: activeCategory,
      search: searchQuery,
    });

    return (
      <AdminShell>
        <div className="space-y-4">
          <PluginInstallHeader activeCategory={activeCategory} dict={dict} search={s} />
          <PluginDirectoryGrid dict={dict} plugins={catalogPlugins} />
        </div>
      </AdminShell>
    );
  }

  // 2. INSTALLED PLUGINS LIST VIEW (Matching Comments Structure)
  const [{ plugins, total }, counts] = await Promise.all([
    getPlugins({
      status: currentStatus,
      search: searchQuery,
      page: currentPage,
      limit: pageSize,
    }),
    getPluginCounts(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <AdminShell>
      <div className="space-y-4">
        <PostListHeader
          addNewHref="/admincp/plugins?tab=add-new"
          addNewLabel={dict["admin.plugins.add_new"] || "Add New Plugin"}
          dict={dict}
          title={dict["admin.plugins.title"] || "Plugins"}
        />

        {/* Filter and Search Bar */}
        <PluginFilter
          counts={counts}
          currentStatus={currentStatus}
          dict={dict}
          searchQuery={searchQuery}
        />

        {/* Plugins Table with Integrated Top & Bottom Tablenav */}
        <PluginTable
          currentPage={currentPage}
          currentStatus={currentStatus}
          dict={dict}
          direction={langContext.direction}
          pageSize={pageSize}
          plugins={plugins}
          searchQuery={searchQuery}
          totalItems={total}
          totalPages={totalPages}
        />
      </div>
    </AdminShell>
  );
}
